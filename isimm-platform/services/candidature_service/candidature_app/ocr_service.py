"""
OCR Service — Extraction réelle des scores/moyennes depuis PDF
Utilise pdfplumber (extraction texte) + pytesseract (fallback OCR image)

Req-3 — Actions automatiques :
- conforme (écart ≤ 0.5) → pièce validée auto
- incoherence (écart > 0.5) → alerte "Dossier Suspect"
"""

import re
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    from pdf2image import convert_from_path
except ImportError:
    convert_from_path = None


class OCRService:
    """Service d'extraction de moyennes depuis PDF (réel, pas simulation)."""

    @staticmethod
    def extraire_texte_pdf(fichier_path: str) -> str:
        """
        Extraction texte directe (PDF texte) + fallback OCR (PDF scanné).

        Args:
            fichier_path: Chemin du PDF

        Returns:
            Texte extrait du PDF
        """
        texte = ''

        # ÉTAPE 1 — pdfplumber (extraction texte directe, rapide et précis)
        if pdfplumber is None:
            logger.warning("pdfplumber non installé — impossible d'extraire le texte")
            return ''

        try:
            with pdfplumber.open(fichier_path) as pdf:
                for page in pdf.pages:
                    t = page.extract_text() or ''
                    texte += t + '\n'
        except Exception as e:
            logger.warning(f"Erreur pdfplumber: {e}")
            texte = ''

        # ÉTAPE 2 — Fallback : si pas assez de texte, utiliser OCR image
        if len(texte.strip()) < 20:
            texte = OCRService._ocr_image_fallback(fichier_path)

        return texte

    @staticmethod
    def _ocr_image_fallback(fichier_path: str) -> str:
        """Fallback OCR image si le PDF est scanné."""
        if pytesseract is None or convert_from_path is None:
            logger.warning("pytesseract/pdf2image non installé — impossible de faire l'OCR image")
            return ''

        try:
            # Configurer le chemin de Tesseract sur Windows
            pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

            images = convert_from_path(fichier_path, dpi=200)
            textes = []

            for img in images[:4]:  # Max 4 pages
                t = pytesseract.image_to_string(img, lang='fra+eng')
                textes.append(t)

            return '\n'.join(textes)
        except Exception as e:
            logger.warning(f"Erreur OCR image: {e}")
            return ''

    @staticmethod
    def extraire_moyenne(texte: str) -> Optional[float]:
        """
        Cherche la moyenne dans le texte avec plusieurs patterns regex.
        Ordre = priorité (plus spécifique → plus générique).

        Args:
            texte: Texte extrait du PDF

        Returns:
            Valeur moyenne extraite (float) ou None
        """
        patterns = [
            # "Moyenne Générale : 14.17 / 20"
            r'[Mm]oyenne\s*[Gg][ée]n[ée]rale\s*[:\-]?\s*(\d{1,2}[.,]\d{1,2})',
            # "Moyenne Générale : 14.17 / 20" (variante)
            r'[Mm]oyenne\s*[Gg][ée]n[ée]rale\s*[:\-]?\s*(\d{1,2}[.,]\d{1,2})\s*/\s*20',
            # "M.G : 14.17" / "MG = 14.17"
            r'\bm\.?g\.?\s*[:\-–=]?\s*(\d{1,2}[.,]\d{1,2})',
            # "Score Total : 14.17"
            r'score\s*total\s*[:\-–=]?\s*(\d{1,2}[.,]\d{1,2})',
            # "Moyenne : 14.17"
            r'[Mm]oyenne\s*[:\-]?\s*(\d{1,2}[.,]\d{1,2})',
            # "14.17 / 20"
            r'(\d{1,2}[.,]\d{1,2})\s*/\s*20',
            # "Total : 14.17"
            r'total\s*[:\-]?\s*(\d{1,2}[.,]\d{1,2})',
            # Score isolé "14.17"
            r'\b(\d{1,2}[.,]\d{1,2})\b',
        ]

        for pattern in patterns:
            match = re.search(pattern, texte, re.IGNORECASE)
            if match:
                valeur_str = match.group(1).replace(',', '.')
                try:
                    moyenne = float(valeur_str)
                    if 0 <= moyenne <= 20:
                        return moyenne
                except ValueError:
                    continue

        return None

    @staticmethod
    def analyser_releve_notes(
        fichier_path: str,
        score_declare: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Analyse complète d'un relevé de notes PDF.

        Req-3 — Actions automatiques selon résultat :
        - conforme (écart ≤ 0.5) → pièce validée auto
        - incoherence (écart > 0.5) → alerte "Dossier Suspect"

        Args:
            fichier_path: Chemin du PDF
            score_declare: Score déclaré par le candidat

        Returns:
            Dict avec statut, scores extraits, écart, confiance, alerte
        """
        # Extraction texte
        texte = OCRService.extraire_texte_pdf(fichier_path)

        # Gestion erreur extraction
        if not texte or len(texte.strip()) < 10:
            return {
                'statut': 'ocr_error',
                'message': 'Impossible de lire le document PDF',
                'confiance': 0,
                'moteur': 'pdfplumber',
                'texte_extrait': '',
                'score_extrait': None,
                'score_declare': score_declare,
                'ecart': None,
                'alerte': None,
                'anomalies': ['PDF non lisible ou corrompu'],
            }

        # Extraction score
        moyenne_extraite = OCRService.extraire_moyenne(texte)

        # Gestion pas de score détecté
        if moyenne_extraite is None:
            return {
                'statut': 'ocr_no_data',
                'message': 'Aucune moyenne détectée dans le document',
                'confiance': 30,
                'moteur': 'pdfplumber',
                'texte_extrait': texte[:500],
                'score_extrait': None,
                'score_declare': score_declare,
                'ecart': None,
                'alerte': 'Impossible d\'extraire une moyenne du PDF',
                'anomalies': ['Aucune moyenne trouvée'],
            }

        # Calcul écart si score déclaré fourni
        ecart = None
        alerte = None
        statut = 'conforme'  # défaut

        if score_declare is not None:
            try:
                score_declare_float = float(score_declare)
                ecart = round(abs(moyenne_extraite - score_declare_float), 2)

                # Req-3 : Seuil de concordance = 0.5 points
                if ecart <= 0.5:
                    statut = 'conforme'
                    alerte = None
                else:
                    statut = 'incoherence'
                    alerte = f'Dossier Suspect — Écart de {ecart} pts entre déclaré ({score_declare_float}) et extrait ({moyenne_extraite})'
            except (TypeError, ValueError):
                pass

        # Confiance basée sur la précision
        if ecart is None:
            confiance = 85  # pas de comparaison possible
        elif ecart <= 0.5:
            confiance = 95  # très confiant
        else:
            confiance = max(40, 90 - int(ecart * 10))  # confiance dégradée par l'écart

        return {
            'statut': statut,
            'message': 'Moyenne extraite avec succès' if statut == 'conforme' else alerte,
            'score_extrait': moyenne_extraite,
            'score_declare': score_declare,
            'ecart': ecart,
            'confiance': confiance,
            'moteur': 'pdfplumber',
            'texte_extrait': texte[:500],
            'alerte': alerte,
            'anomalies': [alerte] if alerte else [],
        }


def verifier_concordance_dossier(
    fichier_path: str,
    score_declare: float,
) -> Dict[str, Any]:
    """
    Fonction compatibilité (import existant dans views.py).
    Encapsule OCRService.analyser_releve_notes().
    """
    return OCRService.analyser_releve_notes(fichier_path, score_declare)
