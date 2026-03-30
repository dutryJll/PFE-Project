import os
import logging
import csv
import tempfile
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from django.utils import timezone
from django.db.utils import OperationalError
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Candidature,
    CandidatListe,
    Concours,
    ConfigurationAppel,
    DonneesAcademiques,
    FormuleScore,
    ListeAdmission,
    Master,
    InscriptionEnLigne,
)
from .services import (
    GestionListesService,
    ImportPaiementService,
    SelectionCandidatsService,
    VerificationPaiementService,
)
from .ocr_service import verifier_concordance_dossier
from .serializers import (
    CandidatureSerializer,
    ConfigurationAppelSerializer,
    FormuleScoreSerializer,
    UserUpdateSerializer,
)
from .emails import (
    envoyer_email_changement_statut,
    envoyer_email_confirmation_candidature,
    envoyer_notifications_masse,
    envoyer_email_inscription_validee,
)


logger = logging.getLogger(__name__)


ALLOWED_STATUS_TRANSITIONS = {
    'soumis': {'sous_examen', 'rejete', 'annule'},
    'sous_examen': {'preselectionne', 'en_attente_dossier', 'rejete'},
    'preselectionne': {'en_attente_dossier', 'rejete'},
    'en_attente_dossier': {'dossier_depose', 'dossier_non_depose', 'rejete'},
    'dossier_depose': {'en_attente', 'selectionne', 'rejete'},
    'en_attente': {'selectionne', 'rejete', 'annule'},
    'selectionne': {'inscrit', 'rejete'},
    'dossier_non_depose': {'en_attente_dossier', 'rejete'},
    'annule': set(),
    'rejete': set(),
    'inscrit': set(),
}


# Reglement de reference (article fourni) transforme en structure exploitable.
REGLEMENT_CONCOURS_INGENIEUR_REFERENCE_2025_2026 = {
    'metadata': {
        'version': '2025-07-03',
        'annee_universitaire': '2025/2026',
        'type_concours': 'ingenieur',
        'source': 'Decision commission masters / concours ingenieur',
    },
    'chapitre_1_ouverture': {
        'resume': (
            'Ouverture du concours sur dossiers pour l acces a la formation ingenieur '
            'a l ISIMM pour l annee universitaire 2025/2026.'
        ),
    },
    'chapitre_2_eligibilite': {
        'paragraphe_1': {
            'public': 'Etudiants reussis en 2eme annee preparatoire integree ISIMM 2024/2025',
        },
        'paragraphe_2': {
            'public': (
                'Etudiants inscrits/admis en 3eme annee licence (specialites scientifiques '
                'et techniques LMD) en 2024/2025 et n ayant pas redouble cette annee'
            ),
            'diplomes_acceptes': [
                'Licence en sciences de l informatique',
                'Genie logiciel et systemes d information',
                'Licence en mathematiques et informatique ou diplome equivalent',
            ],
        },
    },
    'chapitre_3_quotas': {
        'regle': 'Quotas par filiere et par type de candidature (paragraphe 1 / paragraphe 2).',
        'filieres': [
            {
                'filiere': 'Informatique (Ingenierie des systemes - Genie Logiciel)',
                'places_paragraphe_1': 52,
                'places_paragraphe_2': 13,
            }
        ],
    },
    'chapitre_4_calcul_score': {
        'paragraphe_1': {
            'formule': 'M2 + B1 + B2',
            'variables': {
                'M2': 'Moyenne de la 2eme annee (en score de selection)',
                'B1': 'Bonification relative a la 1ere annee',
                'B2': 'Bonification relative a la 2eme annee',
            },
            'bonification_sans_redoublement': {
                'B1_session_principale': 2,
                'B1_session_controle': 1.5,
                'B2_session_principale': 2,
                'B2_session_controle': 1.5,
            },
            'bonification_avec_redoublement': {
                'B1_session_principale': 1,
                'B1_session_controle': 0,
                'B2_session_principale': 1,
                'B2_session_controle': 0,
            },
        },
        'paragraphe_2': {
            'formule': '0.5*(2*M1 + 2*M2 + M3) + 50*(1-R1) + 50*(1-R2)',
            'variables': {
                'M1': 'Moyenne 1ere annee (session principale)',
                'M2': 'Moyenne 2eme annee (session principale)',
                'M3': 'Moyenne S1 3eme annee (session principale)',
                'R1': 'Rang 1ere annee / (effectif - 1)',
                'R2': 'Rang 2eme annee / (effectif - 1)',
            },
            'sous_cas': [
                'Etudiants internes ISIMM (paragraphe 2-b-1)',
                'Etudiants externes ISIMM (paragraphe 2-b-2)',
            ],
        },
    },
    'chapitre_5_classement': {
        'regle': 'Classement par filiere selon le score calcule; admission selon le quota disponible.',
    },
    'chapitre_6_publication': {
        'regle': 'Publication des listes finales apres deliberations de la commission.',
    },
    'chapitre_7_documents_obligatoires': [
        'Fiche de candidature telechargee du site et signee',
        'Annexe du site signee et legalisee par le directeur de l etablissement d origine (cas paragraphe 2-b)',
        'Copie certifiee conforme du releve bac',
        'Copies certifiees conformes des releves de toutes les annees universitaires',
        'Copie CIN ou passeport (etudiants etrangers)',
        'Pieces justifiant reorientation ou retrait d inscription le cas echeant',
    ],
    'chapitre_8_depot': {
        'mode': 'Courrier rapide',
        'adresse': 'ISIMM - Route de Kheniss - BP 223 - 5000 Monastir',
        'date_limite': '2025-08-08',
        'reference_delai': 'Cachet de la poste fait foi',
    },
    'chapitre_9_execution': {
        'responsable': 'Directeur de l ISIMM',
    },
}


REFERENTIEL_MASTERS_ISIMM_2025_2026 = {
    'metadata': {
        'annee_universitaire': '2025/2026',
        'etablissement': 'ISIMM Monastir',
        'source': 'Communique officiel masters 2025/2026 (synthese structuree)',
    },
    'sections_masters': {
        'mpgl': {
            'intitule': 'Master Professionnel en Ingenierie Logicielle (MPGL)',
            'calendrier': {
                'inscription_web': {
                    'debut': 'date_publication',
                    'fin': '2025-07-22',
                },
                'publication_preselection': '2025-07-28',
                'depot_dossier_numerique': {
                    'debut': '2025-07-28',
                    'fin': '2025-07-31',
                },
                'publication_liste_finale': '2025-08-08',
            },
            'capacites': {
                'isimm_licence_info': 30,
                'autres_etablissements_licence_info_ou_info_gestion': 5,
                'total': 35,
            },
            'modalites_candidature': [
                'Etape 1: inscription obligatoire en ligne avant la date limite.',
                'Etape 2: pour les preselectionnes, depot d un dossier numerique en un seul fichier PDF.',
            ],
        },
        'mrgl': {
            'intitule': 'Master de Recherche en Sciences de l Informatique: Ingenierie Logicielle (MRGL)',
            'capacites': {
                'isimm_licence_ou_maitrise_info': 28,
                'autres_etablissements': 2,
                'total': 30,
            },
            'score': {
                'note': 'Calcul specifique au master de recherche.',
                'formule_licence': (
                    'Score = 1.5*Moy_1ere_Annee + 2*Moy_2eme_Annee + Moy_3eme_Annee '
                    '+ Bonus_Redoublement + Bonus_SessionPrincipale '
                    '+ (MoyBac + Note_Math_Bac - 20)/2 + Bonus_Langue + Bonus_Annee_Diplome'
                ),
                'bonus_langue': (
                    '1 point si note de Francais ou Anglais au bac >= 12 '
                    'ou certification niveau B2.'
                ),
                'bonus_annee_diplome': {
                    '2025_ou_2023': 4,
                    '2022_2021_2020': 2,
                },
            },
        },
        'mpds': {
            'intitule': 'Master Professionnel en Science des Donnees (MPDS)',
            'capacites': {
                'isimm_licence_math_appliquees': 10,
                'isimm_licence_informatique': 19,
                'autres_licence_math_appliquees': 2,
                'autres_licence_informatique': 4,
                'total': 35,
            },
        },
    },
    'documents_requis_pdf_unique': [
        'Demande de candidature (formulaire joint).',
        'Fiche de candidature imprimee du site et signee.',
        'CV d une page avec coordonnees (adresse, telephone, email).',
        'Copie de la carte d identite nationale.',
        'Copies certifiees conformes de tous les diplomes (bac inclus).',
        'Copies certifiees conformes de tous les releves de notes (bac inclus).',
        'Justificatifs de report d inscription ou de reorientation si necessaire.',
    ],
    'regles_importantes': [
        'Aucun dossier hors delai ou incomplet ne sera examine.',
        'Toute donnee erronnee entraine l annulation immediate de la candidature.',
        'En cas de falsification, des poursuites judiciaires peuvent etre engagees.',
        'Recours possible pour les non retenus par email avant le 2025-07-31.',
        'Presentation des originaux obligatoire lors de l inscription administrative finale.',
    ],
    'modele_formulaire_candidature': {
        'champs': [
            'nom_prenom',
            'etablissement_origine',
            'diplome',
            'choix_1',
            'choix_2',
            'choix_3',
            'numero_dossier_reserve_administration',
        ],
        'choix_possibles': ['MPGL', 'MRGL', 'MPDS'],
    },
}


def _validate_formulaire_commission(configuration, formulaire_payload):
    """Valide les champs/documents requis selon la configuration du master."""
    schema = configuration.formulaire_commission_schema or {}
    required_fields = schema.get('required_fields', []) or []
    required_documents = schema.get('required_documents', []) or []

    if not isinstance(formulaire_payload, dict):
        return {'ok': False, 'error': 'Le champ formulaire doit etre un objet JSON.'}

    missing_fields = []
    for field_name in required_fields:
        value = formulaire_payload.get(field_name)
        if value is None or (isinstance(value, str) and not value.strip()):
            missing_fields.append(field_name)

    uploaded_documents = formulaire_payload.get('documents', [])
    if not isinstance(uploaded_documents, list):
        return {'ok': False, 'error': 'Le champ formulaire.documents doit etre une liste.'}

    uploaded_documents_set = {str(doc).strip() for doc in uploaded_documents if str(doc).strip()}
    missing_documents = [doc for doc in required_documents if str(doc).strip() not in uploaded_documents_set]

    if missing_fields or missing_documents:
        return {
            'ok': False,
            'error': 'Formulaire commission incomplet pour ce master.',
            'missing_fields': missing_fields,
            'missing_documents': missing_documents,
        }

    return {'ok': True}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_candidature(request):
    """Creation simplifiee d'une candidature."""
    master_id = request.data.get('master_id')
    if not master_id:
        return Response({'error': 'master_id est requis'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        master = Master.objects.get(id=master_id)
    except Master.DoesNotExist:
        return Response({'error': 'Master non trouve'}, status=status.HTTP_404_NOT_FOUND)

    candidature = Candidature.objects.create(candidat=request.user, master=master, statut='soumis')

    try:
        envoyer_email_confirmation_candidature(candidature)
    except Exception as exc:
        logger.exception("Erreur envoi email confirmation candidature %s: %s", candidature.id, exc)

    serializer = CandidatureSerializer(candidature)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def soumettre_candidature(request):
    """Conserve la route historique en redirigeant vers la creation."""
    return create_candidature(request)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def modifier_candidature(request, candidature_id):
    try:
        candidature = Candidature.objects.get(id=candidature_id, candidat=request.user)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    if not candidature.peut_etre_modifie():
        return Response(
            {'error': 'Le delai de modification est expire ou la candidature ne peut plus etre modifiee'},
            status=status.HTTP_403_FORBIDDEN,
        )

    allowed_fields = {'choix_priorite'}
    payload = {key: value for key, value in request.data.items() if key in allowed_fields}

    if not payload:
        return Response(
            {'error': 'Aucun champ modifiable fourni', 'allowed_fields': sorted(list(allowed_fields))},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = CandidatureSerializer(candidature, data=payload, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_candidatures(request):
    candidatures = Candidature.objects.filter(candidat=request.user)
    serializer = CandidatureSerializer(candidatures, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def offres_inscription(request):
    """Retourne les offres d'inscription (masters + cycle ingenieur)."""
    today = timezone.now().date()

    masters = Master.objects.filter(actif=True).order_by('nom')
    offres = []

    for master in masters:
        nom_lower = (master.nom or '').lower()
        specialite_lower = (master.specialite or '').lower()
        is_cycle_ingenieur = 'ingenieur' in nom_lower or 'genie logiciel' in specialite_lower
        statut = 'ouvert' if master.date_limite_candidature >= today else 'ferme'
        offres.append(
            {
                'id': master.id,
                'titre': master.nom,
                'type': 'cycle_ingenieur' if is_cycle_ingenieur else 'master',
                'sous_type': master.type_master,
                'specialite': master.specialite,
                'description': master.description,
                'date_limite': master.date_limite_candidature,
                'places': master.places_disponibles,
                'statut': statut,
            }
        )

    return Response(offres)


@api_view(['GET'])
@permission_classes([AllowAny])
def lister_masters(request):
    masters = Master.objects.filter(actif=True).order_by('nom')
    payload = [
        {
            'id': m.id,
            'nom': m.nom,
            'specialite': m.specialite,
            'type_master': m.type_master,
            'date_limite_candidature': m.date_limite_candidature,
            'annee_universitaire': m.annee_universitaire,
        }
        for m in masters
    ]
    return Response(payload)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_dossiers(request):
    """Retourne les dossiers du candidat derives des candidatures."""
    candidatures = Candidature.objects.filter(candidat=request.user).select_related('master')

    dossiers = []
    for candidature in candidatures:
        numero_dossier = f"DOS-{candidature.numero}"
        dossiers.append(
            {
                'id': candidature.id,
                'numero_dossier': numero_dossier,
                'numero_candidature': candidature.numero,
                'candidature_id': candidature.id,
                'master_nom': candidature.master.nom,
                'statut': candidature.statut,
                'dossier_depose': candidature.dossier_depose,
                'dossier_valide': candidature.dossier_valide,
                'date_soumission': candidature.date_soumission,
            }
        )

    return Response(dossiers)


@api_view(['GET'])
@permission_classes([AllowAny])
def lister_dossiers_ocr(request):
    """Retourne les dossiers deposes a analyser par la commission (OCR)."""
    try:
        candidatures = (
            Candidature.objects.select_related('candidat', 'master')
            .filter(dossier_depose=True)
            .order_by('-date_depot_dossier', '-updated_at')
        )
    except OperationalError as exc:
        logger.exception('Schema candidature indisponible pour dossiers-ocr: %s', exc)
        return Response(
            {
                'results': [],
                'warning': 'Base candidature non initialisee correctement (table manquante).',
            },
            status=status.HTTP_200_OK,
        )

    payload = []
    for c in candidatures:
        payload.append(
            {
                'id': c.id,
                'candidat_nom': f"{getattr(c.candidat, 'first_name', '')} {getattr(c.candidat, 'last_name', '')}".strip(),
                'email': getattr(c.candidat, 'email', ''),
                'master_nom': c.master.nom if c.master else '',
                'statut': c.statut,
                'date_depot_dossier': c.date_depot_dossier,
                'score': c.score,
            }
        )

    return Response(payload)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'user': serializer.data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def changer_statut_candidature(request, candidature_id):
    if getattr(request.user, 'role', None) not in ['commission', 'responsable_commission', 'admin']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    try:
        candidature = Candidature.objects.get(id=candidature_id)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    nouveau_statut = request.data.get('statut')
    motif_rejet = request.data.get('motif_rejet', '')

    if nouveau_statut not in dict(Candidature.STATUT_CHOICES):
        return Response({'error': 'Statut invalide'}, status=status.HTTP_400_BAD_REQUEST)

    ancien_statut = candidature.statut
    if ancien_statut == nouveau_statut:
        return Response(
            {'error': 'Aucun changement detecte sur le statut'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    statuts_suivants = ALLOWED_STATUS_TRANSITIONS.get(ancien_statut, set())
    if nouveau_statut not in statuts_suivants:
        return Response(
            {
                'error': f'Transition interdite: {ancien_statut} -> {nouveau_statut}',
                'allowed_transitions': sorted(list(statuts_suivants)),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    candidature.statut = nouveau_statut
    candidature.date_changement_statut = timezone.now()

    if nouveau_statut == 'rejete':
        candidature.motif_rejet = motif_rejet

    if nouveau_statut in ['sous_examen', 'preselectionne', 'selectionne']:
        candidature.peut_modifier = False

    candidature.save()
    candidature.ajouter_historique(
        ancien_statut,
        nouveau_statut,
        request.user,
        'Changement de statut via commission',
    )

    channel_layer = get_channel_layer()
    if channel_layer is not None:
        async_to_sync(channel_layer.group_send)(
            'candidatures_updates',
            {
                'type': 'candidature_status_changed',
                'candidature_id': candidature.id,
                'candidate_user_id': candidature.candidat_id,
                'new_status': nouveau_statut,
                'updated_at': timezone.now().isoformat(),
            },
        )

    try:
        envoyer_email_changement_statut(candidature, ancien_statut, nouveau_statut)
    except Exception as exc:
        logger.exception("Erreur envoi email changement statut %s: %s", candidature.id, exc)

    serializer = CandidatureSerializer(candidature)
    return Response(
        {
            'success': True,
            'message': f'Statut change de "{ancien_statut}" a "{nouveau_statut}"',
            'candidature': serializer.data,
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_member_credentials(request):
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    role = request.data.get('role', '')

    if not email or not password:
        return Response({'error': 'Email et password requis'}, status=status.HTTP_400_BAD_REQUEST)

    role_text = 'Responsable Commission' if role == 'responsable_commission' else 'Membre Commission'

    try:
        send_mail(
            subject='Vos identifiants ISIMM',
            message=(
                f"Bonjour {first_name} {last_name},\n\n"
                f"Role : {role_text}\n"
                f"Email : {email}\n"
                f"Mot de passe : {password}\n"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': 'Email envoye'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def annuler_candidature(request, candidature_id):
    try:
        candidature = Candidature.objects.get(id=candidature_id, candidat=request.user)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    if not candidature.peut_etre_annulee():
        return Response(
            {'error': 'Cette candidature ne peut plus etre annulee'},
            status=status.HTTP_403_FORBIDDEN,
        )

    ancien_statut = candidature.statut
    candidature.statut = 'annule'
    candidature.annule_par_candidat = True
    candidature.date_annulation = timezone.now()
    candidature.save()

    candidature.ajouter_historique(ancien_statut, 'annule', request.user, 'Annule par le candidat')

    return Response({'success': True, 'message': 'Candidature annulee avec succes'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def corbeille_candidatures(request):
    if request.user.role not in ['admin', 'commission', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    candidatures = Candidature.objects.filter(statut='annule', annule_par_candidat=True)
    serializer = CandidatureSerializer(candidatures, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def gerer_configuration_appel(request, master_id=None):
    if request.user.role not in ['admin', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        try:
            config = ConfigurationAppel.objects.get(master_id=master_id)
            serializer = ConfigurationAppelSerializer(config)
            return Response(serializer.data)
        except ConfigurationAppel.DoesNotExist:
            return Response({'error': 'Configuration non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        serializer = ConfigurationAppelSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        config = ConfigurationAppel.objects.get(master_id=master_id)
    except ConfigurationAppel.DoesNotExist:
        return Response({'error': 'Configuration non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ConfigurationAppelSerializer(config, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FormuleScoreViewSet(viewsets.ModelViewSet):
    queryset = FormuleScore.objects.all()
    serializer_class = FormuleScoreSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def formule_score_master(request, master_id):
    """Expose une API simple pour consulter/editer la formule de score d'un master."""
    if getattr(request.user, 'role', None) not in ['admin', 'commission', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    try:
        master = Master.objects.get(id=master_id)
    except Master.DoesNotExist:
        return Response({'error': 'Master non trouve'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        formule = FormuleScore.objects.filter(master=master).first()
        if not formule:
            return Response(
                {
                    'master_id': master.id,
                    'master_nom': master.nom,
                    'message': 'Aucune formule configuree pour ce master.',
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(FormuleScoreSerializer(formule).data)

    formule, _ = FormuleScore.objects.get_or_create(
        master=master,
        defaults={'nom': f'Formule {master.nom}', 'description': ''},
    )

    payload = request.data.copy()
    payload['master'] = master.id
    if 'nom' not in payload:
        payload['nom'] = formule.nom or f'Formule {master.nom}'

    serializer = FormuleScoreSerializer(
        formule,
        data=payload,
        partial=(request.method == 'PATCH'),
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposer_dossier_numerique(request, candidature_id):
    """
    Depot dossier numerique avec controle strict:
    - uniquement candidat proprietaire
    - uniquement statut autorise
    - validation formulaire commission par master
    """
    try:
        candidature = Candidature.objects.select_related('master', 'master__configuration').get(
            id=candidature_id,
            candidat=request.user,
        )
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    statuts_autorises = {'preselectionne', 'en_attente_dossier'}
    if candidature.statut not in statuts_autorises:
        return Response(
            {
                'error': 'Depot dossier non autorise pour ce statut.',
                'statut_actuel': candidature.statut,
                'statuts_autorises': sorted(list(statuts_autorises)),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        configuration = candidature.master.configuration
    except ConfigurationAppel.DoesNotExist:
        return Response(
            {'error': 'Configuration master introuvable.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    formulaire_payload = request.data.get('formulaire', {})
    validation = _validate_formulaire_commission(configuration, formulaire_payload)
    if not validation.get('ok'):
        return Response(validation, status=status.HTTP_400_BAD_REQUEST)

    diagnostic_ocr = verifier_concordance_dossier(candidature, formulaire_payload)

    ancien_statut = candidature.statut
    candidature.statut = 'dossier_depose'
    candidature.dossier_depose = True
    candidature.dossier_valide = bool(diagnostic_ocr.get('validation_auto'))
    candidature.date_depot_dossier = timezone.now()
    candidature.save(
        update_fields=['statut', 'dossier_depose', 'dossier_valide', 'date_depot_dossier', 'updated_at']
    )

    candidature.ajouter_historique(
        ancien_statut,
        'dossier_depose',
        request.user,
        (
            'Depot dossier numerique via formulaire commission | '
            f"OCR: {diagnostic_ocr.get('decision')} | confiance={diagnostic_ocr.get('confiance')}"
        ),
    )

    return Response(
        {
            'success': True,
            'message': 'Dossier numerique depose avec succes.',
            'candidature_id': candidature.id,
            'statut': candidature.statut,
            'dossier_valide_auto': candidature.dossier_valide,
            'ocr_diagnostic': diagnostic_ocr,
            'date_depot_dossier': candidature.date_depot_dossier,
        }
    )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def ajuster_dossier_numerique(request, candidature_id):
    """
    Permet au candidat presélectionné d'ajuster son dossier avant expiration du délai.
    """
    try:
        candidature = Candidature.objects.select_related('master', 'master__configuration').get(
            id=candidature_id,
            candidat=request.user,
        )
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    if candidature.statut not in {'preselectionne', 'en_attente_dossier', 'dossier_depose'}:
        return Response(
            {
                'error': 'Ajustement dossier non autorise pour ce statut.',
                'statut_actuel': candidature.statut,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        configuration = candidature.master.configuration
    except ConfigurationAppel.DoesNotExist:
        return Response({'error': 'Configuration master introuvable.'}, status=status.HTTP_400_BAD_REQUEST)

    if not configuration.date_limite_depot_dossier:
        return Response({'error': 'Date limite de depot dossier non configuree.'}, status=status.HTTP_400_BAD_REQUEST)

    today = timezone.now().date()
    date_limite = configuration.date_limite_depot_dossier
    if candidature.prolongation_delai and candidature.delai_depot_dossier:
        date_limite = candidature.delai_depot_dossier

    if today > date_limite:
        return Response(
            {
                'error': 'Le delai d ajustement du dossier est expire.',
                'date_limite': str(date_limite),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    formulaire_payload = request.data.get('formulaire', {})
    validation = _validate_formulaire_commission(configuration, formulaire_payload)
    if not validation.get('ok'):
        return Response(validation, status=status.HTTP_400_BAD_REQUEST)

    diagnostic_ocr = verifier_concordance_dossier(candidature, formulaire_payload)

    ancien_statut = candidature.statut
    candidature.statut = 'dossier_depose'
    candidature.dossier_depose = True
    candidature.dossier_valide = bool(diagnostic_ocr.get('validation_auto'))
    candidature.date_depot_dossier = timezone.now()
    candidature.save(
        update_fields=['statut', 'dossier_depose', 'dossier_valide', 'date_depot_dossier', 'updated_at']
    )

    candidature.ajouter_historique(
        ancien_statut,
        'dossier_depose',
        request.user,
        'Ajustement dossier numerique avant delai',
    )

    return Response(
        {
            'success': True,
            'message': 'Dossier numerique ajuste avec succes.',
            'candidature_id': candidature.id,
            'statut': candidature.statut,
            'date_depot_dossier': candidature.date_depot_dossier,
            'ocr_diagnostic': diagnostic_ocr,
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ocr_test_diagnostic(request):
    """Endpoint de test OCR/IA independant du depot dossier final."""
    candidature_id = request.data.get('candidature_id')

    candidature = None
    if candidature_id:
        try:
            candidature = Candidature.objects.select_related('candidat').get(id=candidature_id)
        except Candidature.DoesNotExist:
            return Response({'error': 'Candidature non trouvee.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        candidature = (
            Candidature.objects.select_related('candidat')
            .filter(candidat=request.user)
            .order_by('-created_at')
            .first()
        )
        if not candidature and getattr(request.user, 'role', None) in ['admin', 'commission', 'responsable_commission']:
            candidature = Candidature.objects.select_related('candidat').order_by('-created_at').first()

    if not candidature:
        return Response(
            {'error': 'Aucune candidature disponible pour le test OCR.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    formulaire_payload = request.data.get('formulaire', {})
    if not isinstance(formulaire_payload, dict):
        return Response(
            {'error': 'Le champ formulaire doit etre un objet JSON.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    diagnostic = verifier_concordance_dossier(candidature, formulaire_payload)
    return Response(
        {
            'success': True,
            'message': 'Diagnostic OCR execute.',
            'candidature_id': candidature.id,
            'ocr_diagnostic': diagnostic,
        }
    )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def formulaire_commission_master(request, master_id):
    """Permet a la commission de consulter/modifier le schema du formulaire par master."""
    if getattr(request.user, 'role', None) not in ['admin', 'commission', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    try:
        configuration = ConfigurationAppel.objects.select_related('master').get(master_id=master_id)
    except ConfigurationAppel.DoesNotExist:
        return Response({'error': 'Configuration master introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(
            {
                'master_id': configuration.master_id,
                'master_nom': configuration.master.nom,
                'formulaire_commission_schema': configuration.formulaire_commission_schema or {},
            }
        )

    schema = request.data.get('formulaire_commission_schema', {})
    if not isinstance(schema, dict):
        return Response(
            {'error': 'formulaire_commission_schema doit etre un objet JSON'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    for key in ['required_fields', 'required_documents']:
        if key in schema and not isinstance(schema[key], list):
            return Response(
                {'error': f'{key} doit etre une liste'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    configuration.formulaire_commission_schema = schema
    configuration.save(update_fields=['formulaire_commission_schema', 'updated_at'])

    return Response(
        {
            'success': True,
            'master_id': configuration.master_id,
            'formulaire_commission_schema': configuration.formulaire_commission_schema,
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculer_score_candidature(request, candidature_id):
    try:
        candidature = Candidature.objects.get(id=candidature_id)
        donnees_academiques = candidature.donnees_academiques
        score = donnees_academiques.calculer_et_sauvegarder_score()
        return Response({'success': True, 'score': score, 'candidature_id': candidature.id})
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvee'}, status=status.HTTP_404_NOT_FOUND)
    except DonneesAcademiques.DoesNotExist:
        return Response(
            {'error': 'Donnees academiques non renseignees'},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generer_listes_admission(request, master_id):
    if request.user.role not in ['admin', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    try:
        master = Master.objects.get(id=master_id)
    except Master.DoesNotExist:
        return Response({'error': 'Master non trouve'}, status=status.HTTP_404_NOT_FOUND)

    iteration = int(request.data.get('iteration', 1))

    if iteration == 1:
        resultats = SelectionCandidatsService.selectionner_candidats_par_specialite(master)
        principale = resultats['liste_principale']
        attente = resultats['liste_attente']

        annee = timezone.now().year
        annee_universitaire = request.data.get('annee_universitaire', f'{annee}/{annee+1}')
        capacite = master.configuration.capacite_accueil
        capacite_attente = master.configuration.capacite_liste_attente

        liste_principale = ListeAdmission.objects.create(
            master=master,
            type_liste='principale',
            iteration=1,
            annee_universitaire=annee_universitaire,
            capacite_accueil=capacite,
            places_restantes=max(0, capacite - len(principale)),
            active=True,
            publiee=False,
        )

        for i, candidature in enumerate(principale, start=1):
            CandidatListe.objects.create(
                liste=liste_principale,
                candidature=candidature,
                position=i,
                score=candidature.score,
            )
            candidature.statut = 'preselectionne'
            candidature.save(update_fields=['statut', 'updated_at'])

        liste_attente = ListeAdmission.objects.create(
            master=master,
            type_liste='attente',
            iteration=1,
            annee_universitaire=annee_universitaire,
            capacite_accueil=capacite_attente,
            places_restantes=max(0, capacite_attente - min(len(attente), capacite_attente)),
            active=True,
            publiee=False,
        )

        for i, candidature in enumerate(attente[:capacite_attente], start=1):
            CandidatListe.objects.create(
                liste=liste_attente,
                candidature=candidature,
                position=i,
                score=candidature.score,
            )
            candidature.statut = 'en_attente'
            candidature.save(update_fields=['statut', 'updated_at'])

        return Response(
            {
                'success': True,
                'message': 'Listes principale et attente (itération 1) générées avec succès',
                'liste_principale_id': liste_principale.id,
                'liste_attente_id': liste_attente.id,
                'nb_principale': liste_principale.candidats.count(),
                'nb_attente': liste_attente.candidats.count(),
                'tri': 'score decroissant, puis date soumission',
                'classement': 'par specialite avec priorite choix 1 puis 2 puis 3',
            }
        )

    precedente = ListeAdmission.objects.filter(
        master=master,
        type_liste='principale',
        iteration=iteration - 1,
        active=True,
    ).first()
    if not precedente:
        return Response(
            {'error': f'Liste principale itération {iteration - 1} introuvable'},
            status=status.HTTP_404_NOT_FOUND,
        )

    places_liberees = int(request.data.get('places_liberees', 0))
    if places_liberees > 0:
        precedente.places_restantes = places_liberees
        precedente.save(update_fields=['places_restantes'])

    nouvelle_liste = GestionListesService.generer_liste_suivante_si_necessaire(precedente)
    if not nouvelle_liste:
        return Response(
            {
                'success': False,
                'message': 'Aucune nouvelle liste à générer (pas de places libérées ou liste attente vide).',
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {
            'success': True,
            'message': f'Liste principale itération {nouvelle_liste.iteration} générée depuis la liste d’attente.',
            'liste_id': nouvelle_liste.id,
            'nb_candidats': nouvelle_liste.candidats.count(),
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cloturer_ou_relancer_admission(request, master_id):
    """
    Point 13:
    - si capacite atteinte => cloture + publication definitive
    - sinon => relance (generation itération suivante) jusqu a capacite max
    """
    if getattr(request.user, 'role', None) not in ['admin', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    try:
        master = Master.objects.select_related('configuration').get(id=master_id)
    except Master.DoesNotExist:
        return Response({'error': 'Master non trouve'}, status=status.HTTP_404_NOT_FOUND)

    resultat = VerificationPaiementService.evaluer_cloture_ou_relance(master)
    return Response({'success': True, **resultat})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publier_liste(request, liste_id):
    if getattr(request.user, 'role', None) not in ['admin', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    try:
        liste = ListeAdmission.objects.get(id=liste_id)
    except ListeAdmission.DoesNotExist:
        return Response({'error': 'Liste non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    if liste.publiee:
        return Response({'error': 'Liste deja publiee'}, status=status.HTTP_400_BAD_REQUEST)

    liste.publiee = True
    liste.date_publication = timezone.now()
    liste.save()

    resultats_notifications = {'envoyes': 0, 'echoues': 0, 'total': 0}
    try:
        resultats_notifications = envoyer_notifications_masse(liste)
    except Exception as exc:
        logger.exception("Erreur envoi notifications liste %s: %s", liste.id, exc)

    return Response(
        {
            'success': True,
            'message': (
                'Liste publiee: '
                f"{resultats_notifications.get('envoyes', 0)} emails envoyes, "
                f"{resultats_notifications.get('echoues', 0)} echecs"
            ),
            'notifications': resultats_notifications,
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importer_paiements(request):
    if request.user.role not in ['admin', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    if 'fichier' not in request.FILES:
        return Response({'error': 'Aucun fichier fourni'}, status=status.HTTP_400_BAD_REQUEST)

    fichier = request.FILES['fichier']
    extension = os.path.splitext(fichier.name)[1].lower()
    if extension not in ['.xlsx', '.xls']:
        return Response(
            {'error': 'Format invalide. Utilisez un fichier Excel (.xlsx ou .xls).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension, dir=temp_dir) as tmp:
        for chunk in fichier.chunks():
            tmp.write(chunk)
        temp_path = tmp.name

    try:
        resultats_import = ImportPaiementService.importer_fichier_excel(temp_path)
        master_id = request.data.get('master_id')
        statuts = VerificationPaiementService.consulter_statuts_inscription(master_id=master_id)
        return Response(
            {
                'success': True,
                'message': 'Import paiements execute avec verification de delai commission.',
                'import': resultats_import,
                'inscriptions': statuts,
            }
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consulter_inscriptions_administratives(request):
    """
    Point 13:
    - consultation liste candidats ayant finalise l'inscription administrative
    - consultation liste candidats inscription incomplete
    - extraction CSV via ?export=csv
    """
    if request.user.role not in ['admin', 'commission', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    master_id = request.query_params.get('master_id')
    export_format = (request.query_params.get('export') or '').lower()

    resultats = VerificationPaiementService.consulter_statuts_inscription(master_id=master_id)

    if export_format != 'csv':
        return Response(resultats)

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="inscriptions_administratives.csv"'
    writer = csv.writer(response)
    writer.writerow(
        [
            'groupe',
            'candidature_id',
            'numero',
            'cin',
            'email',
            'master',
            'statut_candidature',
            'paiement_statut',
            'date_paiement',
            'date_limite_paiement',
            'motif',
        ]
    )

    for row in resultats['inscription_finalisee']:
        writer.writerow(
            [
                'inscription_finalisee',
                row.get('candidature_id'),
                row.get('numero'),
                row.get('cin'),
                row.get('email'),
                row.get('master'),
                row.get('statut_candidature'),
                row.get('paiement_statut'),
                row.get('date_paiement'),
                row.get('date_limite_paiement'),
                row.get('motif'),
            ]
        )

    for row in resultats['inscription_incomplete']:
        writer.writerow(
            [
                'inscription_incomplete',
                row.get('candidature_id'),
                row.get('numero'),
                row.get('cin'),
                row.get('email'),
                row.get('master'),
                row.get('statut_candidature'),
                row.get('paiement_statut'),
                row.get('date_paiement'),
                row.get('date_limite_paiement'),
                row.get('motif'),
            ]
        )

    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def lister_concours(request):
    """Retourne la liste des concours pour l'interface d'administration."""
    qs = Concours.objects.all().order_by('-created_at')
    type_filter = request.query_params.get('type_concours')
    if type_filter:
        qs = qs.filter(type_concours=type_filter)

    payload = [
        {
            'id': concours.id,
            'nom': concours.nom,
            'description': concours.description,
            'type_concours': concours.type_concours,
            'date_ouverture': concours.date_ouverture,
            'date_cloture': concours.date_cloture,
            'places_disponibles': concours.places_disponibles,
            'actif': concours.actif,
            'conditions_admission': concours.conditions_admission,
            'created_at': concours.created_at,
            'updated_at': concours.updated_at,
        }
        for concours in qs
    ]
    return Response(payload)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def exporter_liste_pdf(request, liste_id):
    try:
        ListeAdmission.objects.get(id=liste_id)
    except ListeAdmission.DoesNotExist:
        return Response({'error': 'Liste non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    response = HttpResponse(b'', content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="liste_{liste_id}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def exporter_liste_excel(request, liste_id):
    try:
        ListeAdmission.objects.get(id=liste_id)
    except ListeAdmission.DoesNotExist:
        return Response({'error': 'Liste non trouvee'}, status=status.HTTP_404_NOT_FOUND)

    response = HttpResponse(
        b'',
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = f'attachment; filename="liste_{liste_id}.xlsx"'
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def reglement_concours_ingenieur_reference(request):
    """Retourne la version structuree du reglement de reference pour integration front/back."""
    return Response(REGLEMENT_CONCOURS_INGENIEUR_REFERENCE_2025_2026)


@api_view(['GET'])
@permission_classes([AllowAny])
def reglement_masters_reference(request):
    """Retourne le referentiel masters officiel 2025/2026 (MPGL, MRGL, MPDS)."""
    return Response(REFERENTIEL_MASTERS_ISIMM_2025_2026)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def appliquer_reglement_reference_concours(request, concours_id):
    """
    Applique le reglement de reference dans un concours existant.
    - met a jour conditions_admission avec une structure complete exploitable.
    - permet surcharge de date_ouverture/date_cloture/places_disponibles.
    """
    if getattr(request.user, 'role', None) not in ['admin', 'commission', 'responsable_commission']:
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    try:
        concours = Concours.objects.get(id=concours_id)
    except Concours.DoesNotExist:
        return Response({'error': 'Concours non trouve'}, status=status.HTTP_404_NOT_FOUND)

    if concours.type_concours != 'ingenieur':
        return Response(
            {'error': 'Ce reglement de reference ne peut etre applique qu a un concours ingenieur.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payload = REGLEMENT_CONCOURS_INGENIEUR_REFERENCE_2025_2026.copy()

    # Permet d injecter des sections supplementaires ou corrections sans casser le standard.
    sections_personnalisees = request.data.get('sections_personnalisees', {})
    if isinstance(sections_personnalisees, dict) and sections_personnalisees:
        payload.update(sections_personnalisees)

    concours.conditions_admission = payload

    if request.data.get('date_ouverture'):
        concours.date_ouverture = request.data.get('date_ouverture')
    if request.data.get('date_cloture'):
        concours.date_cloture = request.data.get('date_cloture')
    if request.data.get('places_disponibles') is not None:
        concours.places_disponibles = request.data.get('places_disponibles')

    concours.save(update_fields=['conditions_admission', 'date_ouverture', 'date_cloture', 'places_disponibles', 'updated_at'])

    return Response(
        {
            'success': True,
            'concours_id': concours.id,
            'nom': concours.nom,
            'type_concours': concours.type_concours,
            'message': 'Reglement de reference integre avec succes dans le concours.',
            'conditions_admission': concours.conditions_admission,
        }
    )
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def soumettre_paiement_enligne(request):
    """
    Candidat soumet son justificatif de paiement
    """
    candidature_id = request.data.get('candidature_id')
    reference = request.data.get('reference_paiement')
    montant = request.data.get('montant')
    
    if 'fichier_paiement' not in request.FILES:
        return Response(
            {'error': 'Fichier de paiement requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        candidature = Candidature.objects.get(
            id=candidature_id,
            candidat=request.user
        )
    except Candidature.DoesNotExist:
        return Response(
            {'error': 'Candidature non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier que candidat est sélectionné
    if candidature.statut != 'selectionne':
        return Response(
            {'error': 'Vous devez être sélectionné pour soumettre un paiement'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    fichier = request.FILES['fichier_paiement']
    
    # Vérifier format fichier
    extension = fichier.name.split('.')[-1].lower()
    if extension not in ['pdf', 'jpg', 'jpeg', 'png']:
        return Response(
            {'error': 'Format invalide. Formats acceptés: PDF, JPG, PNG'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Créer ou mettre à jour inscription
    inscription, created = InscriptionEnLigne.objects.get_or_create(
        candidature=candidature,
        defaults={
            'reference_paiement': reference,
            'montant_paye': montant
        }
    )
    
    if not created:
        inscription.reference_paiement = reference
        inscription.montant_paye = montant
    
    inscription.fichier_paiement = fichier
    inscription.statut = 'paiement_soumis'
    inscription.save()
    
    return Response({
        'success': True,
        'message': 'Paiement soumis avec succès',
        'inscription_id': inscription.id,
        'statut': inscription.statut
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def valider_paiement_enligne(request, inscription_id):
    """
    Admin/Commission valide le paiement soumis
    """
    if request.user.role not in ['admin', 'commission', 'responsable_commission']:
        return Response(
            {'error': 'Permission refusée'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        inscription = InscriptionEnLigne.objects.get(id=inscription_id)
    except InscriptionEnLigne.DoesNotExist:
        return Response(
            {'error': 'Inscription non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    action = request.data.get('action')  # 'valider' ou 'refuser'
    commentaire = request.data.get('commentaire', '')
    
    if action == 'valider':
        inscription.statut = 'valide'
        inscription.valide_par = request.user
        inscription.date_validation = timezone.now()
        inscription.commentaire_validation = commentaire
        inscription.save()
        
        # Mettre à jour candidature
        inscription.candidature.statut = 'inscrit'
        inscription.candidature.save()
        
        envoyer_email_inscription_validee(inscription)
        
        return Response({
            'success': True,
            'message': 'Paiement validé'
        })
    
    elif action == 'refuser':
        inscription.statut = 'refuse'
        inscription.commentaire_validation = commentaire
        inscription.save()
        
        return Response({
            'success': True,
            'message': 'Paiement refusé'
        })
    
    return Response(
        {'error': 'Action invalide'},
        status=status.HTTP_400_BAD_REQUEST
    )
