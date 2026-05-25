"""
Contrôleur : générateur PDF officiel ISIMM
GET /api/documents/generer-pdf
"""
from datetime import date
from django.http import HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import os

from .models import Candidature, MembreCommission
from .exports_isimm_official import ISIMMPDFGenerator


def _get_logo_path() -> str | None:
    """Localise le logo ISIMM dans les assets statiques."""
    candidates = [
        os.path.join(settings.BASE_DIR, 'assets', 'images', 'logo-isimm.png'),
        os.path.join(settings.BASE_DIR, 'static', 'images', 'logo-isimm.png'),
        os.path.join(settings.BASE_DIR, 'media', 'logo-isimm.png'),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def _build_qr_url(request, etape: str, master_id: int, specialite: str = '') -> str:
    """Construit l'URL de vérification intégrée dans le QR code."""
    base = request.build_absolute_uri('/').rstrip('/')
    url = f'{base}/api/documents/verifier-liste/?etape={etape}&master={master_id}'
    if specialite:
        url += f'&specialite={specialite}'
    return url


def _candidature_to_dict(c: Candidature) -> dict:
    """Sérialise une Candidature en dict pour le générateur PDF."""
    candidat = c.candidat if hasattr(c, 'candidat') else None
    return {
        'num_dossier': getattr(c, 'numero', '') or str(c.id),
        'nom': getattr(candidat, 'last_name', '') if candidat else (getattr(c, 'candidat_nom', '') or ''),
        'prenom': getattr(candidat, 'first_name', '') if candidat else '',
        'cin': getattr(candidat, 'cin', '') if candidat else (getattr(c, 'cin_passeport', '') or ''),
        'score': float(getattr(c, 'score', 0) or 0),
        'type_candidat': getattr(c, 'type_candidat', 'externe') or 'externe',
        'specialite_candidat': getattr(c, 'specialite', '') or '',
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generer_pdf_officiel(request):
    """
    Génère la liste officielle PDF au format ISIMM GFH FOR 09 v1.

    Paramètres query string :
        etape       : 'PRESELECTION' (défaut) ou 'SELECTION'
        master_id   : int (obligatoire)
        specialite  : str (optionnel — filtre une spécialité)
        annee       : str (ex: '2025-2026', défaut: année courante)
    """
    role = getattr(request.user, 'role', None)

    # ── Contrôle d'accès ──────────────────────────────────────────────────────
    allowed_roles = ['admin', 'responsable_commission', 'commission']
    if role not in allowed_roles:
        return Response({'error': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

    # ── Paramètres ────────────────────────────────────────────────────────────
    etape = request.query_params.get('etape', 'PRESELECTION').upper()
    master_id_str = request.query_params.get('master_id', '').strip()
    specialite_filter = request.query_params.get('specialite', '').strip()
    annee = request.query_params.get('annee', f'{date.today().year - 1}-{date.today().year}')

    if not master_id_str or not master_id_str.isdigit():
        return Response({'error': 'master_id est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)

    master_id = int(master_id_str)

    if etape not in ('PRESELECTION', 'SELECTION'):
        return Response(
            {'error': "etape doit être 'PRESELECTION' ou 'SELECTION'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Vérification des droits sur ce master ─────────────────────────────────
    if role in ('responsable_commission', 'commission'):
        has_access = MembreCommission.objects.filter(
            user=request.user,
            actif=True,
            commission__actif=True,
            commission__master_id=master_id,
        ).exists()
        if not has_access:
            return Response(
                {'error': 'Accès refusé : vous n\'êtes pas membre d\'une commission pour ce master.'},
                status=status.HTTP_403_FORBIDDEN
            )

    # ── Récupération des candidatures filtrées ────────────────────────────────
    statuts_presel = ['preselectionne', 'selectionne']
    statuts_selection = ['selectionne', 'admis', 'en_attente_liste']

    qs = Candidature.objects.filter(master_id=master_id).select_related('candidat')

    if etape == 'PRESELECTION':
        qs = qs.filter(statut__in=statuts_presel)
    else:
        qs = qs.filter(statut__in=statuts_selection)

    if specialite_filter:
        qs = qs.filter(specialite__icontains=specialite_filter)

    qs = qs.order_by('-score')

    candidates_data = [_candidature_to_dict(c) for c in qs]

    if not candidates_data:
        return Response(
            {'error': 'Aucune candidature ne correspond aux critères sélectionnés.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # ── Infos du responsable ──────────────────────────────────────────────────
    user = request.user
    selecteur_nom = f'{getattr(user, "first_name", "")} {getattr(user, "last_name", "")}'.strip() or str(user)

    # Nom du master
    try:
        from .models import Master
        master = Master.objects.get(pk=master_id)
        master_nom = master.nom
    except Exception:
        master_nom = f'Master #{master_id}'

    # ── Génération du PDF ─────────────────────────────────────────────────────
    qr_url = _build_qr_url(request, etape, master_id, specialite_filter)
    logo_path = _get_logo_path()
    date_sel = date.today().strftime('%d/%m/%Y')

    try:
        generator = ISIMMPDFGenerator()
        pdf_buffer = generator.generer(
            candidates_data=candidates_data,
            etape=etape,
            master_nom=master_nom,
            annee=annee,
            selecteur=selecteur_nom,
            specialite_filter=specialite_filter,
            qr_url=qr_url,
            logo_path=logo_path,
            date_selection=date_sel,
        )
    except ImportError as e:
        return Response(
            {'error': f'Bibliothèque PDF manquante : {e}. Installez reportlab et qrcode.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur de génération PDF : {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # ── Nom du fichier ────────────────────────────────────────────────────────
    etape_label = 'Preselection' if etape == 'PRESELECTION' else 'Selection'
    spec_label = f'_{specialite_filter.replace(" ", "_")}' if specialite_filter else ''
    filename = f'ISIMM_{etape_label}{spec_label}_{annee.replace("/", "-")}.pdf'

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['X-Filename'] = filename
    response.write(pdf_buffer.read())
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verifier_liste(request):
    """
    Endpoint de vérification d'authenticité d'une liste (appelé depuis le QR code).
    Retourne les métadonnées de la liste pour confirmation.
    """
    etape = request.query_params.get('etape', '').upper()
    master_id_str = request.query_params.get('master', '').strip()
    specialite = request.query_params.get('specialite', '').strip()

    if not master_id_str or not master_id_str.isdigit():
        return Response({'valid': False, 'message': 'Paramètres invalides.'})

    master_id = int(master_id_str)

    try:
        from .models import Master
        master = Master.objects.get(pk=master_id)
        return Response({
            'valid': True,
            'master': master.nom,
            'etape': etape,
            'specialite': specialite or 'Toutes',
            'institution': 'Institut Supérieur d\'Informatique et de Mathématiques de Monastir',
            'reference': 'GFH FOR 09 v1',
            'date_verification': date.today().isoformat(),
        })
    except Exception:
        return Response({'valid': False, 'message': 'Liste introuvable.'})
