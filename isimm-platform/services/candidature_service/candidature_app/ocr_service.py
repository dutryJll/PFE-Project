"""
PaddleOCR Batch Service — Analyse OCR des dossiers candidats

Traitement 100 % local (PaddleOCR / EasyOCR), sans API externe.

Pipeline :
  PDF complet → pages → images PNG (200 DPI) → OCR texte → regex moyenne → mise à jour score

Usage :
    from .ocr_service import PaddleOCRBatchService

    service = PaddleOCRBatchService()

    # Analyse d'un seul dossier
    resultat = service.analyser_dossier(candidature, fichier_pdf=django_file)

    # Traitement batch de tous les dossiers d'un master
    rapport = service.analyser_batch_master(master_id=3, update_scores=True)
"""

import io
import os
import re
import hashlib
import logging
import tempfile
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Imports OCR (fallback gracieux) ─────────────────────────────────────────

_paddle_ok = False
_easyocr_ok = False
_pdf2image_ok = False

try:
    from paddleocr import PaddleOCR as _PaddleOCR
    _paddle_ok = True
except ImportError:
    pass

if not _paddle_ok:
    try:
        import easyocr as _easyocr_module
        _easyocr_ok = True
    except ImportError:
        pass

try:
    from pdf2image import convert_from_bytes as _convert_from_bytes
    _pdf2image_ok = True
except ImportError:
    pass

# ─── Regex de détection de moyenne / score ───────────────────────────────────

_SCORE_PATTERNS = [
    # "Moyenne générale : 14,75"  /  "Moyenne: 14.75"
    re.compile(r'moyenne\s*(?:g[eé]n[eé]rale)?\s*[:\-–]?\s*(\d{1,2}[.,]\d{1,3})', re.I),
    # "Total : 14.75 / 20"
    re.compile(r'total\s*[:\-–]?\s*(\d{1,2}[.,]\d{1,3})\s*/\s*20', re.I),
    # Nombre flottant précédé de "note" ou "résultat"
    re.compile(r'(?:note|r[eé]sultat)\s*[:\-–]?\s*(\d{1,2}[.,]\d{1,3})', re.I),
    # Score isolé "14.75 / 20"
    re.compile(r'(\d{1,2}[.,]\d{1,3})\s*/\s*20'),
    # Score nu en dernier recours
    re.compile(r'\b(\d{1,2}[.,]\d{2,3})\b'),
]

_SEUIL_FRAUDE = 0.5   # écart en points → flag fraude


def _extraire_score(texte: str) -> Optional[float]:
    """Retourne le premier score plausible (0–20) trouvé dans le texte OCR."""
    for pattern in _SCORE_PATTERNS:
        m = pattern.search(texte)
        if m:
            try:
                val = float(m.group(1).replace(',', '.'))
                if 0.0 <= val <= 20.0:
                    return round(val, 2)
            except ValueError:
                continue
    return None


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# ─── Moteur OCR (lazy singleton) ─────────────────────────────────────────────

class _OCREngine:
    """Wraps PaddleOCR ou EasyOCR avec initialisation paresseuse."""

    def __init__(self):
        self._paddle = None
        self._easyocr = None

    def _get_paddle(self):
        if self._paddle is None:
            if not _paddle_ok:
                raise ImportError(
                    "PaddleOCR non disponible — exécutez : "
                    "pip install paddlepaddle paddleocr"
                )
            # use_angle_cls=True : détecte les textes tournés (relevés scannés)
            self._paddle = _PaddleOCR(
                use_angle_cls=True,
                lang='fr',
                show_log=False,
                enable_mkldnn=False,   # Pas de MKL-DNN pour la portabilité Windows
            )
        return self._paddle

    def _get_easyocr(self):
        if self._easyocr is None:
            if not _easyocr_ok:
                raise ImportError(
                    "EasyOCR non disponible — exécutez : pip install easyocr"
                )
            self._easyocr = _easyocr_module.Reader(['fr', 'en'], gpu=False, verbose=False)
        return self._easyocr

    def lire_image(self, image_bytes: bytes) -> str:
        """
        Extrait le texte brut d'une image PNG/JPG.
        Essaie PaddleOCR en priorité, puis EasyOCR.
        """
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        try:
            if _paddle_ok:
                paddle = self._get_paddle()
                result = paddle.ocr(tmp_path, cls=True)
                lignes = []
                if result:
                    for page_result in result:
                        if page_result:
                            for ligne in page_result:
                                # ligne = [[bbox], (texte, confiance)]
                                if ligne and len(ligne) >= 2 and ligne[1]:
                                    lignes.append(str(ligne[1][0]))
                return '\n'.join(lignes)

            elif _easyocr_ok:
                reader = self._get_easyocr()
                segments = reader.readtext(tmp_path, detail=0, paragraph=True)
                return '\n'.join(str(s) for s in segments)

            raise RuntimeError(
                "Aucun moteur OCR disponible. "
                "Installez paddleocr (recommandé) ou easyocr."
            )
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


# Singleton partagé (évite de recharger les modèles à chaque appel)
_engine = _OCREngine()


# ─── Conversion PDF → liste d'images ─────────────────────────────────────────

def _pdf_vers_images(pdf_bytes: bytes, dpi: int = 200, max_pages: int = 8) -> list[bytes]:
    """
    Convertit un PDF en liste de bytes PNG, une entrée par page.

    dpi=200 : résolution suffisante pour la lecture des chiffres.
    max_pages=8 : évite le traitement de PDF volumineux.
    """
    if not _pdf2image_ok:
        raise ImportError(
            "pdf2image non disponible — exécutez : pip install pdf2image\n"
            "Sur Windows, téléchargez aussi poppler : "
            "https://github.com/oschwartz10612/poppler-windows/releases"
        )
    pages = _convert_from_bytes(pdf_bytes, dpi=dpi, first_page=1, last_page=max_pages)
    images = []
    for page in pages:
        buf = io.BytesIO()
        page.save(buf, format='PNG')
        images.append(buf.getvalue())
    return images


# ─── Service principal ────────────────────────────────────────────────────────

class PaddleOCRBatchService:
    """
    Analyse OCR des dossiers de candidature via PaddleOCR / EasyOCR.

    • analyser_dossier()      — traite 1 fichier, retourne le diagnostic complet
    • analyser_batch_master() — traite toutes les candidatures d'un master
    """

    # ── Analyse d'un fichier unique ───────────────────────────────────────────

    def analyser_dossier(
        self,
        candidature,
        fichier_pdf=None,
        update_score: bool = False,
    ) -> dict:
        """
        Analyse le dossier PDF d'une candidature.

        Paramètres
        ----------
        candidature   : instance Django Candidature
        fichier_pdf   : fichier Django (InMemoryUploadedFile) ou None
                        → si None, utilise le premier Document attaché
        update_score  : si True, écrase candidature.score si l'OCR réussit

        Retour
        ------
        dict avec les clés :
            texte_extrait, score_extrait, score_declare, delta,
            flag_fraude, confiance, moteur, sha256, anomalies,
            nb_pages_analysees, fields_updated
        """
        # ── Récupération du fichier ───────────────────────────────────────────
        if fichier_pdf is None:
            fichier_pdf = self._get_premier_document(candidature)
        if fichier_pdf is None:
            return self._erreur("Aucun fichier PDF disponible dans le dossier.")

        # ── Lecture des bytes ─────────────────────────────────────────────────
        data: bytes = fichier_pdf.read() if hasattr(fichier_pdf, 'read') else bytes(fichier_pdf)
        sha = _sha256(data)
        nom_fichier: str = getattr(fichier_pdf, 'name', '') or ''
        anomalies = []

        # ── OCR page par page ─────────────────────────────────────────────────
        texte_total = ''
        nb_pages = 0
        moteur = 'none'

        try:
            if nom_fichier.lower().endswith('.pdf'):
                images = _pdf_vers_images(data)
                blocs = []
                for i, img_bytes in enumerate(images):
                    logger.info(
                        "OCR page %d/%d — candidature %s",
                        i + 1, len(images), candidature.id,
                    )
                    bloc = _engine.lire_image(img_bytes)
                    blocs.append(bloc)
                texte_total = '\n'.join(blocs)
                nb_pages = len(images)
            else:
                # Image directe (JPG, PNG…)
                texte_total = _engine.lire_image(data)
                nb_pages = 1

            moteur = (
                'paddleocr' if _paddle_ok
                else ('easyocr' if _easyocr_ok else 'none')
            )

        except ImportError as exc:
            anomalies.append({'type': 'import_error', 'message': str(exc)})
            logger.warning("Import OCR manquant : %s", exc)
        except Exception as exc:
            anomalies.append({'type': 'ocr_error', 'message': str(exc)})
            logger.exception("Erreur OCR candidature %s", candidature.id)

        # ── Extraction du score depuis le texte OCR ───────────────────────────
        score_extrait: Optional[float] = _extraire_score(texte_total) if texte_total else None
        score_declare: Optional[float] = None
        try:
            score_declare = float(candidature.score or 0) or None
        except (TypeError, ValueError):
            pass

        # ── Comparaison déclaré / extrait ─────────────────────────────────────
        delta: Optional[float] = None
        flag_fraude = False

        if score_extrait is not None and score_declare is not None:
            delta = round(abs(score_declare - score_extrait), 2)
            if delta > _SEUIL_FRAUDE:
                flag_fraude = True
                anomalies.append({
                    'type': 'score_mismatch',
                    'score_declare': score_declare,
                    'score_extrait': score_extrait,
                    'delta': delta,
                    'message': (
                        f"Écart de {delta:.2f} pt(s) entre le score déclaré "
                        f"({score_declare}) et extrait par OCR ({score_extrait}). "
                        "Vérification manuelle recommandée."
                    ),
                })

        # ── Mise à jour Django (optionnelle) ──────────────────────────────────
        fields_updated: list[str] = []
        if score_extrait is not None:
            candidature.note_extraite_ocr = score_extrait
            fields_updated.append('note_extraite_ocr')
            if update_score:
                candidature.score = score_extrait
                fields_updated.append('score')

        if flag_fraude and not candidature.flag_fraude:
            candidature.flag_fraude = True
            fields_updated.append('flag_fraude')

        if fields_updated:
            candidature.save(update_fields=fields_updated)

        # ── Confiance heuristique (0.0 → 1.0) ────────────────────────────────
        if not texte_total:
            confiance = 0.0
        elif score_extrait is None:
            confiance = 0.35    # Texte extrait mais pas de score trouvé
        elif flag_fraude:
            confiance = max(0.0, 1.0 - (delta or 0) / 5.0)
        else:
            confiance = 1.0

        return {
            'candidature_id':    candidature.id,
            'numero':            candidature.numero or str(candidature.id),
            'texte_extrait':     texte_total[:2000],   # tronqué pour l'API
            'score_extrait':     score_extrait,
            'score_declare':     score_declare,
            'delta':             delta,
            'flag_fraude':       flag_fraude,
            'confiance':         round(confiance, 2),
            'moteur':            moteur,
            'sha256':            sha,
            'nb_pages_analysees': nb_pages,
            'anomalies':         anomalies,
            'fields_updated':    fields_updated,
        }

    # ── Traitement batch d'un master entier ───────────────────────────────────

    def analyser_batch_master(
        self,
        master_id: int,
        update_scores: bool = False,
        statuts_cibles: list[str] = None,
    ) -> dict:
        """
        Analyse par lot toutes les candidatures d'un master qui ont un dossier.

        Paramètres
        ----------
        master_id      : identifiant Django du Master
        update_scores  : si True, met à jour candidature.score dans la DB
        statuts_cibles : liste de statuts Django à traiter
                         (défaut : ['soumis', 'preselectionne', 'dossier_depose'])

        Retour
        ------
        {
            "total": int,
            "analyses": int,
            "erreurs": int,
            "flag_fraude_count": int,
            "resultats": [liste de dicts analyser_dossier()]
        }
        """
        from .models import Candidature, Document

        if statuts_cibles is None:
            statuts_cibles = ['soumis', 'preselectionne', 'dossier_depose', 'selectionne']

        candidatures = (
            Candidature.objects
            .filter(master_id=master_id, statut__in=statuts_cibles)
            .select_related('candidat', 'master')
        )

        total = candidatures.count()
        resultats = []
        erreurs = 0
        flag_fraude_count = 0

        for cand in candidatures:
            # Recherche du premier document PDF dans le dossier
            doc = (
                Document.objects
                .filter(candidature=cand)
                .exclude(fichier='')
                .order_by('uploaded_at')
                .first()
            )
            fichier = doc.fichier if doc else None

            try:
                result = self.analyser_dossier(
                    cand,
                    fichier_pdf=fichier,
                    update_score=update_scores,
                )
                resultats.append(result)
                if result.get('flag_fraude'):
                    flag_fraude_count += 1
            except Exception as exc:
                erreurs += 1
                logger.exception("Erreur batch OCR candidature %s", cand.id)
                resultats.append({
                    'candidature_id': cand.id,
                    'numero': cand.numero,
                    'erreur': str(exc),
                })

        return {
            'master_id':         master_id,
            'total':             total,
            'analyses':          len(resultats) - erreurs,
            'erreurs':           erreurs,
            'flag_fraude_count': flag_fraude_count,
            'update_scores':     update_scores,
            'resultats':         resultats,
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _get_premier_document(candidature):
        """Retourne le premier fichier de document du dossier, ou None."""
        try:
            from .models import Document
            doc = (
                Document.objects
                .filter(candidature=candidature)
                .exclude(fichier='')
                .order_by('uploaded_at')
                .first()
            )
            return doc.fichier if doc else None
        except Exception:
            return None

    @staticmethod
    def _erreur(message: str) -> dict:
        return {
            'texte_extrait': '',
            'score_extrait': None,
            'score_declare': None,
            'delta': None,
            'flag_fraude': False,
            'confiance': 0.0,
            'moteur': 'none',
            'sha256': '',
            'nb_pages_analysees': 0,
            'anomalies': [{'type': 'fichier_absent', 'message': message}],
            'fields_updated': [],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Shim de compatibilité — ancienne API appelée par views_depot_dossier.py
# ─────────────────────────────────────────────────────────────────────────────
def verifier_concordance_dossier(candidature, dossier_info: dict) -> dict:
    """
    Compatibilité avec le code legacy de views_depot_dossier.py.
    Délègue au nouveau PaddleOCRBatchService.analyser_dossier().
    """
    try:
        service = PaddleOCRBatchService()
        return service.analyser_dossier(candidature)
    except Exception as exc:
        return {
            'validation_auto': False,
            'flag_fraude': False,
            'score_extrait': None,
            'anomalies': [{'type': 'erreur', 'message': str(exc)}],
        }
