from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class Master(models.Model):
    TYPE_CHOICES = [
        ('professionnel', 'Professionnel'),
        ('recherche', 'Recherche'),
    ]
    
    nom = models.CharField(max_length=200)
    type_master = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField(blank=True)
    specialite = models.CharField(max_length=200)
    
    places_disponibles = models.IntegerField(default=30)
    date_limite_candidature = models.DateField()
    annee_universitaire = models.CharField(max_length=20)
    
    actif = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nom']
        indexes = [
            models.Index(fields=['actif', 'date_limite_candidature']),
        ]
    
    def __str__(self):
        return self.nom


class Commission(models.Model):
    master = models.OneToOneField(Master, on_delete=models.CASCADE, related_name='commission')
    nom = models.CharField(max_length=200)
    date_creation = models.DateField(auto_now_add=True)
    actif = models.BooleanField(default=True)
    
    delai_preselection = models.IntegerField(default=7, help_text="Jours")
    delai_depot_dossier = models.IntegerField(default=14, help_text="Jours")
    delai_paiement = models.IntegerField(default=7, help_text="Jours")
    
    def __str__(self):
        return f"Commission {self.master.nom}"


class MembreCommission(models.Model):
    ROLE_CHOICES = [
        ('responsable', 'Responsable'),
        ('membre', 'Membre'),
    ]
    
    commission = models.ForeignKey(Commission, on_delete=models.CASCADE, related_name='membres')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commissions')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    date_nomination = models.DateField(auto_now_add=True)
    actif = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['commission', 'user']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.commission.nom}"


class ConfigurationAppel(models.Model):
    master = models.OneToOneField(Master, on_delete=models.CASCADE, related_name='configuration')
    
    date_debut_visibilite = models.DateField(help_text="Date à partir de laquelle l'appel est visible")
    date_fin_visibilite = models.DateField(help_text="Date de fin de visibilité de l'appel")
    
    date_limite_preinscription = models.DateField()
    date_limite_depot_dossier = models.DateField(null=True, blank=True)
    date_limite_paiement = models.DateField(null=True, blank=True)
    
    delai_modification_candidature_jours = models.IntegerField(default=7)
    delai_depot_dossier_preselectionnes_jours = models.IntegerField(default=14)
    
    capacite_accueil = models.IntegerField()
    capacite_liste_attente = models.IntegerField(default=50)
    capacite_interne = models.IntegerField(default=0)
    capacite_externe = models.IntegerField(default=0)
    document_officiel_pdf = models.FileField(upload_to='offres/', null=True, blank=True)
    est_cache = models.BooleanField(default=False)

    # Schema configurable du formulaire de depot dossier par master.
    # Exemple:
    # {
    #   "required_fields": ["cin", "telephone"],
    #   "required_documents": ["releve_notes", "diplome"]
    # }
    formulaire_commission_schema = models.JSONField(default=dict, blank=True)
    
    actif = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['actif', 'date_limite_preinscription']),
            models.Index(fields=['date_debut_visibilite', 'date_fin_visibilite']),
        ]
    
    def __str__(self):
        return f"Configuration {self.master.nom}"
    
    def est_visible(self):
        today = timezone.now().date()
        return self.actif and self.date_debut_visibilite <= today <= self.date_fin_visibilite
    
    def peut_candidater(self):
        today = timezone.now().date()
        return self.actif and today <= self.date_limite_preinscription


class Candidature(models.Model):
    STATUT_CHOICES = [
        ('soumis', 'Soumis'),
        ('annule', 'Annulé'),
        ('sous_examen', 'Sous examen'),
        ('rejete', 'Rejeté/Invalide'),
        ('preselectionne', 'Présélectionné'),
        ('en_attente_dossier', 'En attente de dossier numérique'),
        ('dossier_non_depose', 'Dossier non déposé'),
        ('dossier_depose', 'Dossier déposé'),
        ('en_attente', 'En attente'),
        ('selectionne', 'Sélectionné/Admis'),
        ('inscrit', 'Inscrit')
    ]
    
    numero = models.CharField(max_length=50, unique=True, blank=True)
    candidat = models.ForeignKey(User, on_delete=models.CASCADE, related_name='candidatures')
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='candidatures')
    
    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default='soumis')
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    classement = models.IntegerField(null=True, blank=True)
    
    date_soumission = models.DateTimeField(auto_now_add=True)
    date_limite_modification = models.DateTimeField(null=True, blank=True)
    date_changement_statut = models.DateTimeField(null=True, blank=True)
    
    dossier_valide = models.BooleanField(default=False)
    dossier_depose = models.BooleanField(default=False)
    date_depot_dossier = models.DateTimeField(null=True, blank=True)
    
    choix_priorite = models.IntegerField(default=1)
    
    peut_modifier = models.BooleanField(default=True)
    notification_envoyee = models.BooleanField(default=False)
    
    motif_rejet = models.TextField(blank=True)
    date_annulation = models.DateTimeField(null=True, blank=True)
    annule_par_candidat = models.BooleanField(default=False)
    
    delai_depot_dossier = models.DateField(null=True, blank=True)
    prolongation_delai = models.BooleanField(default=False)
    
    historique = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    concours = models.ForeignKey(
        'Concours', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='candidatures_concours'
    )
    class Meta:
        unique_together = ['candidat', 'master']
        ordering = ['-date_soumission']
        indexes = [
            models.Index(fields=['candidat', 'statut']),
            models.Index(fields=['master', 'statut']),
            models.Index(fields=['statut', 'date_soumission']),
            models.Index(fields=['concours', 'statut']),
        ]
    
    def __str__(self):
        return f"{self.numero} - {self.candidat.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self.generer_numero_candidature()
        
        if not self.date_limite_modification and self.statut == 'soumis':
            self.date_limite_modification = timezone.now() + timedelta(days=7)
        
        if self.statut in ['sous_examen', 'preselectionne', 'selectionne']:
            self.peut_modifier = False
        
        super().save(*args, **kwargs)
    
    def generer_numero_candidature(self):
        now = timezone.now()
        annee = str(now.year)[-2:]
        mois = f"{now.month:02d}"
        
        # Déterminer le type (Master ou Ingénieur)
        if hasattr(self, 'concours') and self.concours:
            # Si c'est un concours ingénieur
            type_prefix = "ING"
        else:
            # Si c'est un master
            master_nom = self.master.nom.upper()
            type_prefix = self._generer_abreviation(master_nom)
        
        prefix = f"{annee}{mois}"
        count = Candidature.objects.filter(numero__startswith=prefix).count() + 1
        compteur = f"{count:05d}"
        
        return f"{prefix}-{compteur}-{type_prefix}"
    
    def _generer_abreviation(self, nom_master):
        mots_ignores = {'master', 'de', 'des', 'et', 'en', 'pour', 'la', 'le'}
        mots = [mot for mot in nom_master.split() if mot.lower() not in mots_ignores]
        
        if len(mots) == 0:
            return "XXX"
        elif len(mots) == 1:
            return mots[0][:3]
        else:
            return ''.join([mot[0] for mot in mots[:3]])
    
    def peut_etre_modifie(self):
        if not self.peut_modifier:
            return False
        if self.statut != 'soumis':
            return False
        if timezone.now() > self.date_limite_modification:
            return False
        return True
    
    def ajouter_historique(self, ancien_statut, nouveau_statut, user, commentaire=''):
        self.historique.append({
            'date': timezone.now().isoformat(),
            'ancien_statut': ancien_statut,
            'nouveau_statut': nouveau_statut,
            'modifie_par': user.get_full_name(),
            'commentaire': commentaire
        })
        self.save()
    
    def peut_etre_annulee(self):
        return self.statut in ['soumis', 'en_attente']
    
    def est_dans_corbeille(self):
        return self.statut == 'annule' and self.annule_par_candidat


class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Succès'),
        ('warning', 'Avertissement'),
        ('danger', 'Danger'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    titre = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    lue = models.BooleanField(default=False)
    dedup_key = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'dedup_key'],
                name='unique_notification_dedup_per_user',
            )
        ]
        indexes = [
            models.Index(fields=['user', 'lue', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.titre}"


class FormuleScore(models.Model):
    master = models.OneToOneField(Master, on_delete=models.CASCADE, related_name='formule_score')
    
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    coef_moyenne_generale = models.DecimalField(max_digits=5, decimal_places=2, default=0.60)
    coef_moyenne_specialite = models.DecimalField(max_digits=5, decimal_places=2, default=0.30)
    coef_note_pfe = models.DecimalField(max_digits=5, decimal_places=2, default=0.10)
    
    bonus_mention_tres_bien = models.DecimalField(max_digits=5, decimal_places=2, default=2.00)
    bonus_mention_bien = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)
    bonus_mention_assez_bien = models.DecimalField(max_digits=5, decimal_places=2, default=0.50)
    
    malus_redoublement = models.DecimalField(max_digits=5, decimal_places=2, default=-1.00)
    malus_dette = models.DecimalField(max_digits=5, decimal_places=2, default=-0.50)
    
    criteres_specifiques = models.JSONField(default=dict, blank=True)
    
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Formule {self.master.nom}"
    
    def calculer_score(self, donnees_candidat):
        score = 0.0
        
        score += donnees_candidat.get('moyenne_generale', 0) * float(self.coef_moyenne_generale)
        score += donnees_candidat.get('moyenne_specialite', 0) * float(self.coef_moyenne_specialite)
        score += donnees_candidat.get('note_pfe', 0) * float(self.coef_note_pfe)
        
        mention = donnees_candidat.get('mention', '').lower()
        if mention == 'tres_bien':
            score += float(self.bonus_mention_tres_bien)
        elif mention == 'bien':
            score += float(self.bonus_mention_bien)
        elif mention == 'assez_bien':
            score += float(self.bonus_mention_assez_bien)
        
        nb_redoublements = donnees_candidat.get('nb_redoublements', 0)
        score += nb_redoublements * float(self.malus_redoublement)
        
        nb_dettes = donnees_candidat.get('nb_dettes', 0)
        score += nb_dettes * float(self.malus_dette)
        
        for critere, config in self.criteres_specifiques.items():
            if critere in donnees_candidat:
                valeur = donnees_candidat[critere]
                coef = config.get('coefficient', 0)
                score += valeur * coef
        
        return round(score, 2)


class DonneesAcademiques(models.Model):
    MENTION_CHOICES = [
        ('passable', 'Passable'),
        ('assez_bien', 'Assez Bien'),
        ('bien', 'Bien'),
        ('tres_bien', 'Très Bien'),
    ]
    
    candidature = models.OneToOneField(Candidature, on_delete=models.CASCADE, related_name='donnees_academiques')
    
    moyenne_generale = models.DecimalField(max_digits=5, decimal_places=2)
    moyenne_specialite = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    note_pfe = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    mention = models.CharField(max_length=20, choices=MENTION_CHOICES, blank=True)
    nb_redoublements = models.IntegerField(default=0)
    nb_dettes = models.IntegerField(default=0)
    
    notes_detaillees = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Données académiques - {self.candidature.numero}"
    
    def calculer_et_sauvegarder_score(self):
        formule = self.candidature.master.formule_score
        
        donnees = {
            'moyenne_generale': float(self.moyenne_generale),
            'moyenne_specialite': float(self.moyenne_specialite or 0),
            'note_pfe': float(self.note_pfe or 0),
            'mention': self.mention,
            'nb_redoublements': self.nb_redoublements,
            'nb_dettes': self.nb_dettes,
        }
        
        score = formule.calculer_score(donnees)
        
        self.candidature.score = score
        self.candidature.save()
        
        return score


class ListeAdmission(models.Model):
    TYPE_CHOICES = [
        ('principale', 'Liste Principale'),
        ('attente', 'Liste d\'Attente'),
    ]
    
    ITERATION_CHOICES = [
        (1, 'Première Liste'),
        (2, 'Deuxième Liste'),
        (3, 'Troisième Liste'),
        (4, 'Quatrième Liste'),
    ]
    
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='listes')
    type_liste = models.CharField(max_length=20, choices=TYPE_CHOICES)
    iteration = models.IntegerField(choices=ITERATION_CHOICES, default=1)
    
    annee_universitaire = models.CharField(max_length=20)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_publication = models.DateTimeField(null=True, blank=True)
    
    publiee = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    
    capacite_accueil = models.IntegerField()
    places_restantes = models.IntegerField()
    
    class Meta:
        unique_together = ['master', 'type_liste', 'iteration', 'annee_universitaire']
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.get_type_liste_display()} - {self.master.nom} - Itération {self.iteration}"


class CandidatListe(models.Model):
    liste = models.ForeignKey(ListeAdmission, on_delete=models.CASCADE, related_name='candidats')
    candidature = models.ForeignKey(Candidature, on_delete=models.CASCADE)
    
    position = models.IntegerField()
    score = models.DecimalField(max_digits=5, decimal_places=2)
    
    a_paye = models.BooleanField(default=False)
    date_paiement = models.DateTimeField(null=True, blank=True)
    
    a_confirme_inscription = models.BooleanField(default=False)
    date_confirmation = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['liste', 'candidature']
        ordering = ['position']
    
    def __str__(self):
        return f"{self.position}. {self.candidature.candidat.get_full_name()} - {self.score}"


class Paiement(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('paye', 'Payé'),
        ('echoue', 'Échoué'),
        ('rembourse', 'Remboursé'),
    ]
    
    candidature = models.OneToOneField(Candidature, on_delete=models.CASCADE, related_name='paiement')
    
    montant = models.DecimalField(max_digits=10, decimal_places=3)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    
    reference_paiement = models.CharField(max_length=100, unique=True, null=True, blank=True)
    date_paiement = models.DateTimeField(null=True, blank=True)
    
    fichier_import = models.CharField(max_length=255, blank=True)
    date_import = models.DateTimeField(null=True, blank=True)
    
    methode_paiement = models.CharField(max_length=50, blank=True)
    numero_transaction = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Paiement {self.candidature.numero} - {self.statut}"
    
    def marquer_comme_paye(self, reference, date_paiement=None):
        self.statut = 'paye'
        self.reference_paiement = reference
        self.date_paiement = date_paiement or timezone.now()
        self.save()
        
        self.candidature.statut = 'inscrit'
        self.candidature.save()


class Reclamation(models.Model):
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('en_attente', 'En attente'),
        ('traitee', 'Traitée'),
    ]
    
    OBJET_CHOICES = [
        ('score', 'Score incorrect'),
        ('statut', 'Statut non mis à jour'),
        ('dossier', 'Problème de dossier'),
        ('paiement', 'Problème de paiement'),
        ('autre', 'Autre'),
    ]
    
    identifiant = models.CharField(max_length=50, unique=True, blank=True)
    candidature = models.ForeignKey(Candidature, on_delete=models.CASCADE, related_name='reclamations')
    
    objet = models.CharField(max_length=50, choices=OBJET_CHOICES)
    master_concerne = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='reclamations')
    
    motif = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    
    reponse = models.TextField(blank=True)
    traitee_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reclamations_traitees')
    date_traitement = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.identifiant:
            annee = timezone.now().year
            count = Reclamation.objects.filter(created_at__year=annee).count() + 1
            self.identifiant = f"RECL-{annee}-{count:05d}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.identifiant


class Concours(models.Model):
    TYPE_CHOICES = [
        ('master', 'Master'),
        ('ingenieur', 'Cycle Ingénieur'),
    ]
    
    nom = models.CharField(max_length=200)
    type_concours = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField()
    
    date_ouverture = models.DateField()
    date_cloture = models.DateField()
    
    places_disponibles = models.IntegerField()
    actif = models.BooleanField(default=True)
    document_officiel_pdf = models.FileField(upload_to='offres/', null=True, blank=True)
    
    conditions_admission = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['actif', 'date_cloture']),
        ]
    
    def __str__(self):
        return f"{self.nom} ({self.get_type_concours_display()})"


class InscriptionEnLigne(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente de paiement'),
        ('paiement_soumis', 'Paiement soumis'),
        ('valide', 'Validé'),
        ('refuse', 'Refusé'),
    ]
    
    candidature = models.OneToOneField(Candidature, on_delete=models.CASCADE, related_name='inscription_enligne')
    
    fichier_paiement = models.FileField(upload_to='paiements/%Y/%m/', null=True, blank=True)
    
    reference_paiement = models.CharField(max_length=100, blank=True)
    montant_paye = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    
    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default='en_attente')
    
    valide_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inscriptions_validees')
    date_validation = models.DateTimeField(null=True, blank=True)
    commentaire_validation = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Inscription {self.candidature.numero} - {self.statut}"


class HistoriqueCandidature(models.Model):
    candidat_nom = models.CharField(max_length=200)
    candidat_email = models.EmailField()
    
    numero = models.CharField(max_length=50)
    master_nom = models.CharField(max_length=200)
    annee_universitaire = models.CharField(max_length=20)
    
    statut_final = models.CharField(max_length=30)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    classement = models.IntegerField(null=True)
    
    date_soumission = models.DateTimeField()
    date_decision = models.DateTimeField(null=True)
    
    a_ete_admis = models.BooleanField(default=False)
    a_confirme_inscription = models.BooleanField(default=False)
    
    archive_le = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-annee_universitaire', '-date_soumission']
        verbose_name = 'Historique Candidature'
        verbose_name_plural = 'Historique des Candidatures'
    
    def __str__(self):
        return f"{self.numero} - {self.candidat_nom} ({self.annee_universitaire})"
class HistoriqueCandidature(models.Model):
    """Archive des candidatures des années précédentes"""
    
    # Données candidat (anonymisées si nécessaire)
    candidat_nom = models.CharField(max_length=200)
    candidat_email = models.EmailField()
    
    # Données candidature
    numero = models.CharField(max_length=50)
    master_nom = models.CharField(max_length=200)
    annee_universitaire = models.CharField(max_length=20)
    
    statut_final = models.CharField(max_length=30)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    classement = models.IntegerField(null=True)
    
    date_soumission = models.DateTimeField()
    date_decision = models.DateTimeField(null=True)
    
    # Résultat
    a_ete_admis = models.BooleanField(default=False)
    a_confirme_inscription = models.BooleanField(default=False)
    
    # Métadonnées
    archive_le = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-annee_universitaire', '-date_soumission']
        verbose_name = 'Historique Candidature'
        verbose_name_plural = 'Historique des Candidatures'
    
    def __str__(self):
        return f"{self.numero} - {self.candidat_nom} ({self.annee_universitaire})"


def archiver_candidatures_annee_precedente():
    """
    Tâche à exécuter chaque début d'année universitaire
    Archive les candidatures de l'année N-1
    """
    from django.utils import timezone
    from datetime import timedelta
    
    # Année universitaire précédente
    annee_actuelle = timezone.now().year
    annee_precedente = f"{annee_actuelle - 1}/{annee_actuelle}"
    
    # Candidatures à archiver (statut final atteint)
    candidatures = Candidature.objects.filter(
        master__configuration__annee_universitaire=annee_precedente,
        statut__in=['inscrit', 'rejete', 'annule', 'en_attente']
    )
    
    count_archive = 0
    
    for candidature in candidatures:
        # Créer entrée historique
        HistoriqueCandidature.objects.create(
            candidat_nom=candidature.candidat.get_full_name(),
            candidat_email=candidature.candidat.email,
            numero=candidature.numero,
            master_nom=candidature.master.nom,
            annee_universitaire=annee_precedente,
            statut_final=candidature.statut,
            score=candidature.score,
            classement=candidature.classement,
            date_soumission=candidature.date_soumission,
            date_decision=candidature.date_changement_statut,
            a_ete_admis=(candidature.statut == 'inscrit'),
            a_confirme_inscription=(candidature.statut == 'inscrit')
        )
        
        count_archive += 1
    
    return count_archive