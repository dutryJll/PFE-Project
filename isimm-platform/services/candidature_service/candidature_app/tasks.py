from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Candidature
from .emails import envoyer_email_changement_statut
import logging

logger = logging.getLogger(__name__)

@shared_task
def verifier_dossiers_non_deposes():
    """
    Vérifier les candidatures présélectionnées 
    sans dossier déposé après le délai
    """
    candidatures = Candidature.objects.filter(
        statut='en_attente_dossier',
        dossier_depose=False,
        delai_depot_dossier__lt=timezone.now().date()
    )
    
    for candidature in candidatures:
        if not candidature.prolongation_delai:
            ancien_statut = candidature.statut
            candidature.statut = 'dossier_non_depose'
            candidature.save()
            
            envoyer_email_changement_statut(
                candidature, 
                ancien_statut, 
                'dossier_non_depose'
            )


@shared_task
def purger_donnees_candidats_non_admis():
    """
    RGPD - Supprimer les données personnelles 
    des candidats non admis 2 mois après clôture
    """
    date_limite = timezone.now() - timedelta(days=60)
    
    candidatures = Candidature.objects.filter(
        statut__in=['rejete', 'dossier_non_depose', 'annule'],
        date_changement_statut__lt=date_limite
    )
    
    count_purge = 0
    
    for candidature in candidatures:
        try:
            user = candidature.candidat
            
            # Anonymiser
            user.first_name = "ANONYME"
            user.last_name = "ANONYME"
            user.email = f"purge_{user.id}@anonyme.local"
            user.is_active = False
            user.save()
            
            count_purge += 1
            logger.info(f"Données purgées pour candidature {candidature.numero}")
            
        except Exception as e:
            logger.error(f"Erreur purge candidature {candidature.numero}: {e}")
    
    logger.info(f"RGPD: {count_purge} candidatures purgées")
    return count_purge


@shared_task
def verifier_paiements_listes_actives():
    """
    Tâche Celery : Vérifier les paiements des listes actives
    Exécuté quotidiennement
    """
    from .models import ListeAdmission
    from .services import VerificationPaiementService
    
    listes_actives = ListeAdmission.objects.filter(
        publiee=True,
        active=True,
        type_liste='principale'
    )
    
    for liste in listes_actives:
        resultats = VerificationPaiementService.verifier_paiements_liste(liste)
        
        if resultats['places_liberees'] > 0:
            VerificationPaiementService.generer_liste_suivante_si_necessaire(liste)