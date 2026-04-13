# Ce fichier contient les nouveaux modèles pour la gestion complète des documents
# À ajouter à models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class DocumentType(models.Model):
    """Types de documents acceptés par master"""
    TYPE_CHOICES = [
        ('diplome', 'Diplôme'),
        ('releve_notes', 'Relevé de notes'),
        ('cv', 'Curriculum Vitae'),
        ('lettre_motivation', 'Lettre de motivation'),
        ('certificat_langue', 'Certificat de langue'),
        ('attestation_travail', 'Attestation de travail'),
        ('autre', 'Autre'),
    ]
    
    master = models.ForeignKey('Master', on_delete=models.CASCADE, related_name='types_documents')
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
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
        ('erreur_ocr', 'Erreur lors de l\'OCR'),
    ]
    
    candidature = models.ForeignKey('Candidature', on_delete=models.CASCADE, related_name='documents')
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
        ('accepte', 'Accepté'),
        ('rejete', 'Rejeté'),
        ('en_attente', 'En attente de révision'),
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
        ('en_verification', 'En vérification'),
        ('incomplet', 'Incomplet'),
        ('complet', 'Complet'),
        ('rejete', 'Rejeté'),
    ]
    
    candidature = models.OneToOneField('Candidature', on_delete=models.CASCADE, related_name='dossier')
    
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
        """Calcule le pourcentage de complétude du dossier"""
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
