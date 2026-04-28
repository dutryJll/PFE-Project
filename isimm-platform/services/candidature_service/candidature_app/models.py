# -*- coding: cp1252 -*-
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


def _safe_float(value, default=0.0):
    try:
        if value in [None, '']:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_text(value):
    return ''.join(ch for ch in str(value or '').lower() if ch.isalnum())

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


class OffreMaster(models.Model):
    """Offre de preinscription edition commission, synchronisee avec Master."""

    master = models.OneToOneField(Master, on_delete=models.CASCADE, related_name='offre_master')
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type_formation = models.CharField(max_length=30, default='master')
    capacite = models.IntegerField(default=30)
    date_limite = models.DateField()
    date_debut_visibilite = models.DateField(null=True, blank=True)
    date_fin_visibilite = models.DateField(null=True, blank=True)
    date_limite_preinscription = models.DateField(null=True, blank=True)
    date_limite_depot_dossier = models.DateField(null=True, blank=True)
    capacites_detaillees = models.JSONField(default=list, blank=True)
    appel_actif = models.BooleanField(default=True)
    est_publiee = models.BooleanField(default=False)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date_limite', 'titre']
        indexes = [
            models.Index(fields=['actif', 'date_limite']),
        ]

    def __str__(self):
        return self.titre

    def save(self, *args, **kwargs):
        if self.master:
            self.master.nom = self.titre
            self.master.description = self.description
            self.master.places_disponibles = self.capacite
            self.master.date_limite_candidature = self.date_limite_preinscription or self.date_limite
            self.master.actif = self.actif
            self.master.save()
        super().save(*args, **kwargs)


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
    contenu_offre_edite = models.JSONField(default=dict, blank=True)
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
        if not self.actif:
            return False

        start = getattr(self, 'date_debut_visibilite', None)
        end = getattr(self, 'date_fin_visibilite', None)

        if start and end:
            return start <= today <= end

        if start and not end:
            return start <= today

        if end and not start:
            return today <= end

        # If no bounds, fallback to active flag
        return bool(self.actif)

    def peut_candidater(self):
        today = timezone.now().date()
        if not self.actif:
            return False

        deadline = getattr(self, 'date_limite_preinscription', None)
        if not deadline:
            return True

        return today <= deadline
    
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

        # Sprint 2: recalcul automatique si les details de notes bac/licence sont disponibles.
        weighted_score = self._compute_bac_licence_weighted_score()
        if weighted_score is not None:
            self.score = weighted_score
        
        super().save(*args, **kwargs)

    def _compute_bac_licence_weighted_score(self):
        donnees = getattr(self, 'donnees_academiques', None)
        if not donnees:
            return None

        notes = donnees.notes_detaillees if isinstance(donnees.notes_detaillees, dict) else {}
        payload = notes.get('payload', {}) if isinstance(notes.get('payload'), dict) else {}

        def _avg(values):
            cleaned = [_safe_float(v, None) for v in values]
            cleaned = [v for v in cleaned if v is not None]
            if not cleaned:
                return None
            return sum(cleaned) / len(cleaned)

        formation_code = str(notes.get('formation_code') or payload.get('formation_code') or '').upper()
        common = payload.get('common', {}) if isinstance(payload.get('common'), dict) else {}
        gl_ds = payload.get('glDs', {}) if isinstance(payload.get('glDs'), dict) else {}
        i3 = payload.get('i3', {}) if isinstance(payload.get('i3'), dict) else {}
        mrgl_licence = payload.get('mrglLicence', {}) if isinstance(payload.get('mrglLicence'), dict) else {}
        mrgl_maitrise = payload.get('mrglMaitrise', {}) if isinstance(payload.get('mrglMaitrise'), dict) else {}
        mrmi_cas1 = payload.get('mrmiCas1', {}) if isinstance(payload.get('mrmiCas1'), dict) else {}
        mrmi_cas2 = payload.get('mrmiCas2', {}) if isinstance(payload.get('mrmiCas2'), dict) else {}
        ing_cas1 = payload.get('ingCas1', {}) if isinstance(payload.get('ingCas1'), dict) else {}
        ing_cas2 = payload.get('ingCas2', {}) if isinstance(payload.get('ingCas2'), dict) else {}

        moyenne_bac = notes.get('moyenne_bac', payload.get('moyenne_bac'))
        moyenne_licence = notes.get('moyenne_licence', payload.get('moyenne_licence'))

        if moyenne_bac in [None, ''] or moyenne_licence in [None, '']:
            if formation_code in ['MPGL', 'MPDS']:
                moyenne_licence = moyenne_licence if moyenne_licence not in [None, ''] else _avg([
                    gl_ds.get('moy1'), gl_ds.get('moy2'), gl_ds.get('moy3')
                ])
            elif formation_code == 'MP3I':
                moyenne_bac = moyenne_bac if moyenne_bac not in [None, ''] else i3.get('moyBac')
                moyenne_licence = moyenne_licence if moyenne_licence not in [None, ''] else _avg([
                    i3.get('moyL1'), i3.get('moyL2'), i3.get('moyL3')
                ])
            elif formation_code == 'MRGL':
                parcours = str(payload.get('mrglParcours') or '').lower()
                if parcours == 'maitrise':
                    moyenne_bac = moyenne_bac if moyenne_bac not in [None, ''] else mrgl_maitrise.get('moyBac')
                    moyenne_licence = moyenne_licence if moyenne_licence not in [None, ''] else _avg([
                        mrgl_maitrise.get('moy1'),
                        mrgl_maitrise.get('moy2'),
                        mrgl_maitrise.get('moy3'),
                        mrgl_maitrise.get('moy4'),
                    ])
                else:
                    moyenne_bac = moyenne_bac if moyenne_bac not in [None, ''] else mrgl_licence.get('moyBac')
                    moyenne_licence = moyenne_licence if moyenne_licence not in [None, ''] else _avg([
                        mrgl_licence.get('moy1'), mrgl_licence.get('moy2'), mrgl_licence.get('moy3')
                    ])
            elif formation_code == 'MRMI':
                parcours = str(payload.get('mrmiParcours') or '').lower()
                if parcours == 'cas2':
                    moyenne_licence = moyenne_licence if moyenne_licence not in [None, ''] else mrmi_cas2.get('moyIng1')
                else:
                    moyenne_bac = moyenne_bac if moyenne_bac not in [None, ''] else mrmi_cas1.get('moyBac')
                    moyenne_licence = moyenne_licence if moyenne_licence not in [None, ''] else _avg([
                        mrmi_cas1.get('moyL1'), mrmi_cas1.get('moyL2'), mrmi_cas1.get('moyL3')
                    ])
            elif formation_code in ['ING_INFO_GL', 'ING_EM']:
                parcours = str(payload.get('ingParcours') or '').lower()
                if parcours == 'cas2':
                    moyenne_licence = moyenne_licence if moyenne_licence not in [None, ''] else _avg([
                        ing_cas2.get('m1'), ing_cas2.get('m2'), ing_cas2.get('m3')
                    ])
                else:
                    moyenne_licence = moyenne_licence if moyenne_licence not in [None, ''] else _avg([
                        ing_cas1.get('moy1'), ing_cas1.get('moy2')
                    ])

        if moyenne_bac in [None, '']:
            moyenne_bac = _safe_float(getattr(donnees, 'moyenne_specialite', None), default=None)
        if moyenne_licence in [None, '']:
            moyenne_licence = _safe_float(getattr(donnees, 'moyenne_generale', None), default=None)

        bac = _safe_float(moyenne_bac, default=None)
        licence = _safe_float(moyenne_licence, default=None)

        if bac is None and licence is None:
            return None

        if bac is None:
            bac = licence
        if licence is None:
            licence = bac

        # Coefficients retenus: 40% bac + 60% licence.
        return round((0.4 * float(bac)) + (0.6 * float(licence)), 2)
    
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

    def _master_formula_key(self):
        haystack = _normalize_text(f"{self.master.nom} {self.master.specialite}")

        if 'mpgl' in haystack or 'genielogiciel' in haystack and 'recherche' not in haystack:
            return 'MPGL'
        if 'mpds' in haystack or 'sciencedesdonnees' in haystack:
            return 'MPDS'
        if '3i' in haystack or 'instrumentationindustrielle' in haystack:
            return 'MP3I'
        if 'mrgl' in haystack or ('recherche' in haystack and 'genielogiciel' in haystack):
            return 'MRGL'
        if 'mrmi' in haystack or ('recherche' in haystack and 'microelectronique' in haystack):
            return 'MRMI'
        if 'inginfo' in haystack or ('ingenieur' in haystack and 'informatique' in haystack and 'genielogiciel' in haystack):
            return 'ING_INFO_GL'
        if 'ingem' in haystack or ('ingenieur' in haystack and 'electronique' in haystack):
            return 'ING_EM'

        return 'GENERIC'

    def _session_control_count(self, *sessions):
        count = 0
        for session in sessions:
            value = _normalize_text(session)
            if not value:
                continue
            if value in {'control', 'controle', 'rattrapage', 'sessioncontrole', 'sessionrattrapage'}:
                count += 1
        return count

    def _bonus_session_principale(self, *sessions):
        control_count = self._session_control_count(*sessions)
        if control_count == 0:
            return 3.0
        if control_count == 1:
            return 2.0
        return 0.0

    def _bonus_redoublement(self, nb_redoublements):
        if nb_redoublements <= 0:
            return 5.0
        if nb_redoublements == 1:
            return 3.0
        return 0.0

    def _bonus_redoublement_mrgl(self, nb_redoublements):
        if nb_redoublements <= 0:
            return 5.0
        if nb_redoublements == 1:
            return 1.5
        return 0.0

    def _bonus_langue(self, note_francais, note_anglais, certification_b2):
        if _safe_float(note_francais) >= 12 or _safe_float(note_anglais) >= 12:
            return 1.0
        if bool(certification_b2):
            return 1.0
        return 0.0

    def _bonus_annee_diplome(self, annee_diplome):
        annee = str(annee_diplome or '').strip()
        if annee in {'2025', '2023'}:
            return 4.0
        if annee in {'2022', '2021', '2020'}:
            return 2.0
        return 0.0

    def _generic_score(self, donnees_candidat):
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

    def _score_mpgl_mpds(self, donnees_candidat):
        moyenne_generale = _safe_float(donnees_candidat.get('moyenne_generale'))
        nb_redoublements = int(_safe_float(donnees_candidat.get('nb_redoublements')))
        session_reussite = donnees_candidat.get('session_reussite') or ''

        score = moyenne_generale
        score += self._bonus_redoublement(nb_redoublements)
        score += self._bonus_session_principale(session_reussite)
        return round(score, 2)

    def _score_mp3i(self, donnees_candidat):
        payload = donnees_candidat.get('payload', {}) if isinstance(donnees_candidat.get('payload'), dict) else {}

        moyenne_bac = _safe_float(
            payload.get('moyenneBacPrincipale')
            or payload.get('moyBac')
            or donnees_candidat.get('moyenne_specialite')
        )
        moy_l1 = _safe_float(payload.get('moyenne1Annee') or payload.get('moyL1'))
        moy_l2 = _safe_float(payload.get('moyenne2Annee') or payload.get('moyL2'))
        moy_l3 = _safe_float(payload.get('moyenne3Annee') or payload.get('moyL3'))

        score = (0.5 * moyenne_bac) + (1.0 * moy_l1) + (1.5 * moy_l2) + (2.0 * moy_l3)

        nb_redoublements = int(_safe_float(payload.get('nombreRedoublement') or donnees_candidat.get('nb_redoublements')))
        if nb_redoublements > 1:
            return 0.0
        score += -4.0 * nb_redoublements

        session1 = payload.get('session1Annee') or payload.get('session1')
        session2 = payload.get('session2Annee') or payload.get('session2')
        session3 = payload.get('session3Annee') or payload.get('session3')

        if _normalize_text(session1) in {'control', 'controle'}:
            score += -1.0
        if _normalize_text(session2) in {'control', 'controle'}:
            score += -1.5
        if _normalize_text(session3) in {'control', 'controle'}:
            score += -2.0

        return round(score, 2)

    def _score_mrgl(self, donnees_candidat):
        payload = donnees_candidat.get('payload', {}) if isinstance(donnees_candidat.get('payload'), dict) else {}
        nature_diplome = _normalize_text(payload.get('natureDiplome') or payload.get('nature_diplome'))
        moyenne_bac = _safe_float(payload.get('moyenneBacPrincipale') or payload.get('moyBac'))
        note_math_bac = _safe_float(payload.get('noteMathBac') or payload.get('note_math_bac'))
        note_francais = payload.get('noteFrancaisBac') or payload.get('note_francais_bac')
        note_anglais = payload.get('noteAnglaisBac') or payload.get('note_anglais_bac')
        certification_b2 = payload.get('certificationB2') or payload.get('certification_b2')
        annee_diplome = payload.get('anneeObtentionDiplome') or payload.get('annee_obtention_diplome')

        nb_redoublements = int(_safe_float(payload.get('nombreRedoublement') or donnees_candidat.get('nb_redoublements')))
        session1 = payload.get('session1Annee')
        session2 = payload.get('session2Annee')
        session3 = payload.get('session3Annee')

        score = 0.0

        if nature_diplome == 'maitrise':
            moy1 = _safe_float(payload.get('moyenne1Annee') or payload.get('moy1'))
            moy2 = _safe_float(payload.get('moyenne2Annee') or payload.get('moy2'))
            moy3 = _safe_float(payload.get('moyenne3Annee') or payload.get('moy3'))
            moy4 = _safe_float(payload.get('moyenne4Annee') or payload.get('moy4'))
            score += (1.5 * moy1) + (2.0 * moy2) + (2.0 * moy3) + moy4
        else:
            moy1 = _safe_float(payload.get('moyenne1Annee') or payload.get('moy1'))
            moy2 = _safe_float(payload.get('moyenne2Annee') or payload.get('moy2'))
            moy3 = _safe_float(payload.get('moyenne3Annee') or payload.get('moy3'))
            score += (1.5 * moy1) + (2.0 * moy2) + moy3

        score += self._bonus_redoublement_mrgl(nb_redoublements)
        score += self._bonus_session_principale(session1, session2, session3)
        score += ((moyenne_bac + note_math_bac - 20.0) / 2.0)
        score += self._bonus_langue(note_francais, note_anglais, certification_b2)

        if nature_diplome == 'licence':
            score += self._bonus_annee_diplome(annee_diplome)

        return round(score, 2)

    def _score_mrmi(self, donnees_candidat):
        payload = donnees_candidat.get('payload', {}) if isinstance(donnees_candidat.get('payload'), dict) else {}
        parcours = _normalize_text(payload.get('mrmiParcours') or payload.get('parcours'))

        if parcours == 'cas2' or _safe_float(payload.get('moyenneIng1')):
            moyenne_ing1 = _safe_float(payload.get('moyenneIng1') or payload.get('moyIng1'))
            session = payload.get('sessionReussiteIng1') or payload.get('session_reussite_ing1')
            nb_redoublements = int(
                _safe_float(payload.get('nombreRedoublementIng1') or payload.get('nombreRedoublement'))
            )
            score = moyenne_ing1
            if _normalize_text(session) in {'control', 'controle'}:
                score -= 1.0
            score += -2.0 * nb_redoublements
            return round(score, 2)

        moyenne_bac = _safe_float(payload.get('moyenneBacPrincipale') or payload.get('moyBac'))
        moy_l1 = _safe_float(payload.get('moyenne1Annee') or payload.get('moyL1'))
        moy_l2 = _safe_float(payload.get('moyenne2Annee') or payload.get('moyL2'))
        moy_l3 = _safe_float(payload.get('moyenne3Annee') or payload.get('moyL3'))
        nb_redoublements = int(_safe_float(payload.get('nombreRedoublement') or donnees_candidat.get('nb_redoublements')))
        session1 = payload.get('session1Annee')
        session2 = payload.get('session2Annee')
        session3 = payload.get('session3Annee')

        score = (0.5 * moyenne_bac) + (1.0 * moy_l1) + (1.5 * moy_l2) + (2.0 * moy_l3)
        score += -4.0 * nb_redoublements
        if _normalize_text(session1) in {'control', 'controle'}:
            score += -1.0
        if _normalize_text(session2) in {'control', 'controle'}:
            score += -1.5
        if _normalize_text(session3) in {'control', 'controle'}:
            score += -2.0

        return round(score, 2)

    def _score_ing(self, donnees_candidat):
        payload = donnees_candidat.get('payload', {}) if isinstance(donnees_candidat.get('payload'), dict) else {}
        parcours = _normalize_text(payload.get('ingParcours') or payload.get('parcours') or 'cas1')

        rang1 = _safe_float(
            payload.get('rang1')
            or payload.get('rang_1')
            or payload.get('classement1')
            or payload.get('rank1')
        )
        rang2 = _safe_float(
            payload.get('rang2')
            or payload.get('rang_2')
            or payload.get('classement2')
            or payload.get('rank2')
        )
        effectif1 = _safe_float(payload.get('effectif1') or payload.get('effectif_1') or payload.get('total1'))
        effectif2 = _safe_float(payload.get('effectif2') or payload.get('effectif_2') or payload.get('total2'))

        if rang1 > 0 and rang2 > 0:
            moyenne1 = _safe_float(payload.get('moyenne1Annee') or payload.get('moy1'))
            moyenne2 = _safe_float(payload.get('moyenne2Annee') or payload.get('moy2'))
            moyenne3 = _safe_float(payload.get('moyenne3Annee') or payload.get('moy3'))

            ratio1 = rang1 / max(effectif1 - 1.0, 1.0)
            ratio2 = rang2 / max(effectif2 - 1.0, 1.0)
            return round(0.5 * ((2 * moyenne1) + (2 * moyenne2) + moyenne3) + 50 * (1 - ratio1) + 50 * (1 - ratio2), 2)

        if parcours == 'cas1':
            moy1 = _safe_float(payload.get('moyenne1Annee') or payload.get('moy1'))
            moy2 = _safe_float(payload.get('moyenne2Annee') or payload.get('moy2'))
            session1 = payload.get('session1Annee')
            session2 = payload.get('session2Annee')

            score = _safe_float(payload.get('moyenne2Annee') or payload.get('moy2'))

            bonus1 = 2.0 if _normalize_text(session1) in {'principale', 'principal'} else 1.5 if _normalize_text(session1) in {'control', 'controle'} else 0.0
            bonus2 = 2.0 if _normalize_text(session2) in {'principale', 'principal'} else 1.5 if _normalize_text(session2) in {'control', 'controle'} else 0.0

            if int(_safe_float(payload.get('nombreRedoublement') or donnees_candidat.get('nb_redoublements'))):
                bonus1 = 1.0 if bonus1 > 0 else 0.0
                bonus2 = 1.0 if bonus2 > 0 else 0.0

            return round(score + bonus1 + bonus2, 2)

        moyenne1 = _safe_float(payload.get('m1'))
        moyenne2 = _safe_float(payload.get('m2'))
        moyenne3 = _safe_float(payload.get('m3'))
        return round(0.5 * ((2 * moyenne1) + (2 * moyenne2) + moyenne3), 2)
    
    def calculer_score(self, donnees_candidat):
        master_key = self._master_formula_key()

        if master_key in {'MPGL', 'MPDS'}:
            return self._score_mpgl_mpds(donnees_candidat)
        if master_key == 'MP3I':
            return self._score_mp3i(donnees_candidat)
        if master_key == 'MRGL':
            return self._score_mrgl(donnees_candidat)
        if master_key == 'MRMI':
            return self._score_mrmi(donnees_candidat)
        if master_key in {'ING_INFO_GL', 'ING_EM'}:
            return self._score_ing(donnees_candidat)

        return self._generic_score(donnees_candidat)


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

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recompute candidature score whenever bac/licence data changes.
        self.calculer_et_sauvegarder_score()
    
    def calculer_et_sauvegarder_score(self):
        formule = getattr(self.candidature.master, 'formule_score', None)

        payload = {}
        if isinstance(self.notes_detaillees, dict):
            payload = self.notes_detaillees.get('payload', {})
            if not isinstance(payload, dict):
                payload = {}

        session_reussite = None
        if isinstance(self.notes_detaillees, dict):
            session_reussite = self.notes_detaillees.get('session_reussite')
        if session_reussite is None:
            session_reussite = payload.get('session')
        
        donnees = {
            'moyenne_generale': float(self.moyenne_generale),
            'moyenne_specialite': float(self.moyenne_specialite or 0),
            'note_pfe': float(self.note_pfe or 0),
            'mention': self.mention,
            'nb_redoublements': self.nb_redoublements,
            'nb_dettes': self.nb_dettes,
            'notes_detaillees': self.notes_detaillees if isinstance(self.notes_detaillees, dict) else {},
            'payload': payload,
            'session_reussite': session_reussite,
        }
        
        if formule:
            score = formule.calculer_score(donnees)
        else:
            notes = self.notes_detaillees if isinstance(self.notes_detaillees, dict) else {}
            payload = notes.get('payload', {}) if isinstance(notes.get('payload'), dict) else {}
            moyenne_bac = _safe_float(notes.get('moyenne_bac', payload.get('moyenne_bac')), default=None)
            moyenne_licence = _safe_float(notes.get('moyenne_licence', payload.get('moyenne_licence')), default=None)

            if moyenne_bac is not None or moyenne_licence is not None:
                if moyenne_bac is None:
                    moyenne_bac = moyenne_licence
                if moyenne_licence is None:
                    moyenne_licence = moyenne_bac
                score = round((0.4 * moyenne_bac) + (0.6 * moyenne_licence), 2)
            else:
                # Fallback when no custom formula is configured yet.
                score = round((0.4 * donnees['moyenne_specialite']) + (0.6 * donnees['moyenne_generale']), 2)
        
        if self.candidature.score != score:
            self.candidature.score = score
            self.candidature.save(update_fields=['score', 'updated_at'])
        
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


class InscriptionRapprochementAudit(models.Model):
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inscription_rapprochements',
    )
    master = models.ForeignKey(
        Master,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inscription_rapprochements',
    )
    source_filename = models.CharField(max_length=255, blank=True)
    total_rows = models.PositiveIntegerField(default=0)
    valide_rows = models.PositiveIntegerField(default=0)
    incoherent_rows = models.PositiveIntegerField(default=0)
    absent_rows = models.PositiveIntegerField(default=0)
    payload_rows = models.JSONField(default=list, blank=True)
    result_rows = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Rapprochement inscriptions #{self.id} ({self.total_rows} lignes)"


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
class DocumentType(models.Model):
    """Types de documents accept�s par master"""
    TYPE_CHOICES = [
        ('diplome', 'Dipl�me'),
        ('releve_notes', 'Relev� de notes'),
        ('cv', 'Curriculum Vitae'),
        ('lettre_motivation', 'Lettre de motivation'),
        ('certificat_langue', 'Certificat de langue'),
        ('attestation_travail', 'Attestation de travail'),
        ('autre', 'Autre'),
    ]
    
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='types_documents')
    type_document = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    obligatoire = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    taille_max_mb = models.IntegerField(default=5)
    formats_acceptes = models.JSONField(default=list, help_text="Ex: ['pdf', 'jpg', 'png']")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['master', 'type_document']
        ordering = ['type_document']
    
    def __str__(self):
        return f"{self.master.nom} - {self.get_type_document_display()}"


class Document(models.Model):
    """Documents soumis dans le dossier de candidature"""
    STATUT_CHOICES = [
        ('en_attente', 'En attente de traitement'),
        ('en_cours_ocr', 'OCR en cours'),
        ('valide', 'Valid�'),
        ('rejete', 'Rejet�'),
        ('erreur_ocr', 'Erreur lors de l\'OCR'),
    ]
    
    candidature = models.ForeignKey(Candidature, on_delete=models.CASCADE, related_name='documents')
    type_document = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    
    fichier = models.FileField(upload_to='candidatures/%Y/%m/%d/')
    nom_fichier_original = models.CharField(max_length=255)
    taille_bytes = models.BigIntegerField()
    format_fichier = models.CharField(max_length=10)
    
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    description = models.TextField(blank=True)
    
    donnees_extraites = models.JSONField(default=dict, blank=True)
    score_ocr = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    erreur_ocr = models.TextField(blank=True)
    
    date_upload = models.DateTimeField(auto_now_add=True)
    date_traitement_ocr = models.DateTimeField(null=True, blank=True)
    celery_task_id = models.CharField(max_length=255, blank=True)
    
    checksum_sha256 = models.CharField(max_length=64, unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_upload']
        indexes = [
            models.Index(fields=['candidature', 'statut']),
            models.Index(fields=['type_document', 'statut']),
        ]
    
    def __str__(self):
        return f"{self.candidature.numero} - {self.type_document.get_type_document_display()}"


class ValidationDocument(models.Model):
    """Audit des validations de documents"""
    STATUS_CHOICES = [
        ('accepte', 'Accept�'),
        ('rejete', 'Rejet�'),
        ('en_attente', 'En attente de r�vision'),
    ]
    
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='validation')
    
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente')
    commentaires = models.TextField(blank=True)
    
    valide_par = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='validations_documents')
    date_validation = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.document} - {self.get_statut_display()}"


class Dossier(models.Model):
    """Dossier de candidat pour un master"""
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('soumis', 'Soumis'),
        ('en_verification', 'En v�rification'),
        ('incomplet', 'Incomplet'),
        ('complet', 'Complet'),
        ('rejete', 'Rejet�'),
    ]
    
    candidature = models.OneToOneField(Candidature, on_delete=models.CASCADE, related_name='dossier')
    
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    
    date_depot = models.DateTimeField(null=True, blank=True)
    date_limite_depot = models.DateTimeField(null=True, blank=True)
    date_derniere_modification = models.DateTimeField(auto_now=True)
    
    nb_documents_attendus = models.IntegerField()
    nb_documents_soumis = models.IntegerField(default=0)
    
    score_completude = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    feedback = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dossier"
        verbose_name_plural = "Dossiers"
        ordering = ['-date_depot']
    
    def __str__(self):
        return f"Dossier {self.candidature.numero}"
    
    def calculer_completude(self):
        """Calcule le pourcentage de compl�tude du dossier"""
        if self.nb_documents_attendus == 0:
            return 100
            
        docs_valides = self.candidature.documents.filter(
            statut='valide'
        ).count()
        
        self.score_completude = (docs_valides / self.nb_documents_attendus) * 100
        self.nb_documents_soumis = self.candidature.documents.exclude(
            statut__in=['en_attente', 'erreur_ocr']
        ).count()
        
        if self.score_completude == 100:
            self.statut = 'complet'
        elif self.score_completude > 0:
            self.statut = 'incomplet'
        
        self.save()
        return self.score_completude
