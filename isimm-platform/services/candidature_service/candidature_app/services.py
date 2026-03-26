from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import Candidature, ListeAdmission, CandidatListe, Master, Paiement
from collections import defaultdict

try:
    import pandas as pd
except ImportError:
    pd = None

class GestionListesService:
    
    @staticmethod
    @transaction.atomic
    def generer_liste_principale(master, iteration=1):
        """Générer la liste principale à partir des candidats éligibles (score croissant)."""
        annee = timezone.now().year
        config = master.configuration
        
        candidatures = Candidature.objects.filter(
            master=master,
            statut='dossier_depose',
            score__isnull=False
        ).select_related('donnees_academiques').order_by('score', 'date_soumission')
        
        if iteration > 1:
            candidatures = candidatures.exclude(statut='inscrit')
        
        liste_principale = ListeAdmission.objects.create(
            master=master,
            type_liste='principale',
            iteration=iteration,
            annee_universitaire=f"{annee}/{annee+1}",
            capacite_accueil=config.capacite_accueil,
            places_restantes=config.capacite_accueil
        )
        
        position = 1
        for candidature in candidatures[:config.capacite_accueil]:
            CandidatListe.objects.create(
                liste=liste_principale,
                candidature=candidature,
                position=position,
                score=candidature.score
            )
            
            candidature.statut = 'preselectionne'
            candidature.save()
            
            position += 1
        
        GestionListesService.generer_liste_attente(
            master, 
            candidatures[config.capacite_accueil:],
            iteration
        )
        
        return liste_principale
    
    @staticmethod
    @transaction.atomic
    def generer_liste_attente(master, candidatures_restantes, iteration=1):
        """Générer la liste d'attente"""
        annee = timezone.now().year
        config = master.configuration
        
        liste_attente = ListeAdmission.objects.create(
            master=master,
            type_liste='attente',
            iteration=iteration,
            annee_universitaire=f"{annee}/{annee+1}",
            capacite_accueil=config.capacite_liste_attente,
            places_restantes=config.capacite_liste_attente
        )
        
        position = 1
        for candidature in candidatures_restantes[:config.capacite_liste_attente]:
            CandidatListe.objects.create(
                liste=liste_attente,
                candidature=candidature,
                position=position,
                score=candidature.score
            )
            
            candidature.statut = 'en_attente'
            candidature.save()
            
            position += 1
        
        return liste_attente


class ImportPaiementService:
    
    @staticmethod
    def importer_fichier_excel(fichier_path):
        """Importer un fichier Excel de www.inscription.tn"""
        try:
            df = pd.read_excel(fichier_path)
            
            resultats = {
                'success': 0,
                'errors': 0,
                'details': []
            }
            
            for index, row in df.iterrows():
                try:
                    cin = str(row['CIN']).strip()
                    reference = str(row['Référence']).strip()
                    date_paiement_str = row['Date Paiement']
                    
                    candidature = Candidature.objects.filter(
                        candidat__cin=cin,
                        statut='selectionne'
                    ).first()
                    
                    if not candidature:
                        resultats['errors'] += 1
                        resultats['details'].append({
                            'ligne': index + 2,
                            'cin': cin,
                            'erreur': 'Candidature non trouvée'
                        })
                        continue
                    
                    paiement, created = Paiement.objects.get_or_create(
                        candidature=candidature,
                        defaults={
                            'montant': row.get('Montant', 0),
                            'statut': 'en_attente'
                        }
                    )
                    
                    paiement.marquer_comme_paye(
                        reference=reference,
                        date_paiement=pd.to_datetime(date_paiement_str)
                    )
                    
                    paiement.fichier_import = fichier_path
                    paiement.date_import = timezone.now()
                    paiement.save()
                    
                    resultats['success'] += 1
                    
                except Exception as e:
                    resultats['errors'] += 1
                    resultats['details'].append({
                        'ligne': index + 2,
                        'erreur': str(e)
                    })
            
            return resultats
            
        except Exception as e:
            return {
                'success': 0,
                'errors': 1,
                'details': [{'erreur': f'Erreur lecture fichier: {str(e)}'}]
            }


class VerificationPaiementService:
    
    @staticmethod
    @transaction.atomic
    def verifier_paiements_liste(liste_admission):
        """Vérifier les paiements pour une liste"""
        resultats = {
            'verifies': 0,
            'payes': 0,
            'non_payes_elimines': 0,
            'inscrits_ailleurs_elimines': 0,
            'places_liberees': 0
        }
        
        candidats_liste = liste_admission.candidats.all()
        
        for candidat_liste in candidats_liste:
            candidature = candidat_liste.candidature
            resultats['verifies'] += 1
            
            if VerificationPaiementService._est_inscrit_ailleurs(candidature):
                candidat_liste.delete()
                candidature.statut = 'inscrit'
                candidature.save()
                
                resultats['inscrits_ailleurs_elimines'] += 1
                resultats['places_liberees'] += 1
                continue
            
            try:
                paiement = Paiement.objects.get(candidature=candidature)
                
                if paiement.statut == 'paye':
                    candidat_liste.a_paye = True
                    candidat_liste.date_paiement = paiement.date_paiement
                    candidat_liste.save()
                    resultats['payes'] += 1
                else:
                    date_limite = liste_admission.date_publication + timedelta(days=7)
                    
                    if timezone.now().date() > date_limite.date():
                        candidat_liste.delete()
                        candidature.statut = 'en_attente'
                        candidature.save()
                        
                        resultats['non_payes_elimines'] += 1
                        resultats['places_liberees'] += 1
            
            except Paiement.DoesNotExist:
                date_limite = liste_admission.date_publication + timedelta(days=7)
                
                if timezone.now().date() > date_limite.date():
                    candidat_liste.delete()
                    candidature.statut = 'en_attente'
                    candidature.save()
                    
                    resultats['non_payes_elimines'] += 1
                    resultats['places_liberees'] += 1
        
        liste_admission.places_restantes = resultats['places_liberees']
        liste_admission.save()
        
        return resultats
    
    @staticmethod
    def _est_inscrit_ailleurs(candidature):
        """Vérifier si le candidat est déjà inscrit dans un autre master"""
        candidatures_candidat = Candidature.objects.filter(
            candidat=candidature.candidat,
            statut='inscrit'
        ).exclude(id=candidature.id)
        
        if not candidatures_candidat.exists():
            return False
        
        for autre_candidature in candidatures_candidat:
            if autre_candidature.choix_priorite < candidature.choix_priorite:
                return True
        
        return False

    @staticmethod
    @transaction.atomic
    def generer_liste_suivante_si_necessaire(liste_admission):
        """
        Génère automatiquement une 2ème/3ème liste principale si des places sont libérées,
        en puisant dans la liste d'attente active.
        """
        if liste_admission.type_liste != 'principale':
            return None

        places_a_combler = max(0, int(liste_admission.places_restantes or 0))
        if places_a_combler == 0:
            return None

        if liste_admission.iteration >= 3:
            return None

        liste_attente_active = ListeAdmission.objects.filter(
            master=liste_admission.master,
            type_liste='attente',
            active=True,
        ).order_by('-iteration', '-date_creation').first()

        if not liste_attente_active:
            return None

        attente_qs = liste_attente_active.candidats.select_related('candidature').order_by('position')
        promus = list(attente_qs[:places_a_combler])
        if not promus:
            return None

        nouvelle_iteration = liste_admission.iteration + 1
        annee = timezone.now().year

        nouvelle_liste = ListeAdmission.objects.create(
            master=liste_admission.master,
            type_liste='principale',
            iteration=nouvelle_iteration,
            annee_universitaire=f"{annee}/{annee+1}",
            capacite_accueil=len(promus),
            places_restantes=0,
            active=True,
            publiee=False,
        )

        for idx, candidat_liste in enumerate(promus, start=1):
            candidature = candidat_liste.candidature
            CandidatListe.objects.create(
                liste=nouvelle_liste,
                candidature=candidature,
                position=idx,
                score=candidat_liste.score,
            )
            candidature.statut = 'selectionne'
            candidature.save(update_fields=['statut', 'updated_at'])
            candidat_liste.delete()

        reste_attente = list(attente_qs[len(promus):])
        if reste_attente:
            nouvelle_attente = ListeAdmission.objects.create(
                master=liste_admission.master,
                type_liste='attente',
                iteration=nouvelle_iteration,
                annee_universitaire=f"{annee}/{annee+1}",
                capacite_accueil=len(reste_attente),
                places_restantes=len(reste_attente),
                active=True,
                publiee=False,
            )
            for idx, old_item in enumerate(reste_attente, start=1):
                CandidatListe.objects.create(
                    liste=nouvelle_attente,
                    candidature=old_item.candidature,
                    position=idx,
                    score=old_item.score,
                )

        liste_attente_active.active = False
        liste_attente_active.save(update_fields=['active'])

        return nouvelle_liste


class SelectionCandidatsService:
    
    @staticmethod
    def selectionner_candidats_par_specialite(master):
        """
        Sélectionner candidats (article 12):
        - classement par spécialité exigée du master
        - sous-classement par diplôme
        - tri final par score croissant
        """
        config = master.configuration
        
        candidatures_eligibles = Candidature.objects.filter(
            master=master,
            statut='dossier_depose',
            score__isnull=False
        ).select_related('candidat', 'donnees_academiques')
        
        candidatures_par_specialite = defaultdict(list)
        
        for candidature in candidatures_eligibles:
            specialite = (candidature.master.specialite or '').strip().lower() or 'non_renseignee'
            diplome = 'non_renseigne'
            if hasattr(candidature, 'donnees_academiques') and candidature.donnees_academiques:
                diplome = (
                    candidature.donnees_academiques.notes_detaillees.get('diplome')
                    or candidature.donnees_academiques.notes_detaillees.get('diplome_exige')
                    or 'non_renseigne'
                )
            candidatures_par_specialite[(specialite, str(diplome).lower())].append(candidature)
        
        liste_principale_finale = []
        liste_attente_finale = []
        
        for _, candidatures in candidatures_par_specialite.items():
            candidatures_triees = sorted(
                candidatures,
                key=lambda c: (c.score, c.date_soumission)
            )
            
            capacite_specialite = config.capacite_accueil // len(candidatures_par_specialite)
            places_disponibles = capacite_specialite
            
            # CHOIX 1 en priorité
            for candidature in candidatures_triees:
                if candidature.choix_priorite == 1 and places_disponibles > 0:
                    liste_principale_finale.append(candidature)
                    places_disponibles -= 1
            
            # CHOIX 2
            if places_disponibles > 0:
                for candidature in candidatures_triees:
                    if candidature.choix_priorite == 2 and places_disponibles > 0:
                        if candidature not in liste_principale_finale:
                            liste_principale_finale.append(candidature)
                            places_disponibles -= 1
            
            # CHOIX 3
            if places_disponibles > 0:
                for candidature in candidatures_triees:
                    if candidature.choix_priorite == 3 and places_disponibles > 0:
                        if candidature not in liste_principale_finale:
                            liste_principale_finale.append(candidature)
                            places_disponibles -= 1
            
            for candidature in candidatures_triees:
                if candidature not in liste_principale_finale:
                    liste_attente_finale.append(candidature)
        
        return {
            'liste_principale': liste_principale_finale,
            'liste_attente': liste_attente_finale
        }