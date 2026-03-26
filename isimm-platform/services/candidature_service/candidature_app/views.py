import os
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Candidature,
    CandidatListe,
    ConfigurationAppel,
    DonneesAcademiques,
    FormuleScore,
    ListeAdmission,
    Master,
    InscriptionEnLigne,
)
from .services import GestionListesService, SelectionCandidatsService
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
@permission_classes([IsAuthenticated])
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
                'tri': 'score croissant, puis date soumission',
                'classement': 'par spécialité et diplôme',
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
    temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', fichier.name)
    os.makedirs(os.path.dirname(temp_path), exist_ok=True)

    with open(temp_path, 'wb+') as destination:
        for chunk in fichier.chunks():
            destination.write(chunk)

    os.remove(temp_path)
    return Response({'success': True, 'message': 'Fichier importe'})


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
