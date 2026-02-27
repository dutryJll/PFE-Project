from django.db import models

class Candidature(models.Model):
    TYPE_CHOICES = [
        ('master', 'Master'),
        ('ingenieur', 'Cycle Ingénieur'),
    ]
    
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('en_attente', 'En attente de validation'),
        ('validee', 'Validée'),
        ('rejetee', 'Rejetée'),
        ('preselectionne', 'Présélectionné'),
    ]
    
    # Lien avec auth-service
    auth_user_id = models.IntegerField(unique=True)
    email = models.EmailField(unique=True)
    
    # Informations de base
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    cin = models.CharField(max_length=8, unique=True)
    telephone = models.CharField(max_length=20)
    date_naissance = models.DateField()
    
    # Moyennes (3 ans de licence)
    moyenne_l1 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    moyenne_l2 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    moyenne_l3 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    moyenne_generale = models.DecimalField(max_digits=4, decimal_places=2)  # Moyenne calculée
    moyenne_bac = models.DecimalField(max_digits=4, decimal_places=2)
    
    # Type de candidature
    type_candidature = models.CharField(max_length=10, choices=TYPE_CHOICES)
    
    # Pour Masters (JSON)
    voeux = models.JSONField(null=True, blank=True)
    
    # Pour Ingénieur
    specialite = models.CharField(max_length=50, null=True, blank=True)
    
    # Statut
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    
    # Score et classement
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    classement = models.IntegerField(null=True, blank=True)
    
    # Dates
    date_soumission = models.DateTimeField(auto_now_add=True)
    date_limite_modification = models.DateTimeField(null=True, blank=True)
    
    # Commentaires
    commentaire_rejet = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'candidatures'
        ordering = ['-date_soumission']
    
    def save(self, *args, **kwargs):
        # Calculer la moyenne générale
        moyennes = [self.moyenne_l1, self.moyenne_l2, self.moyenne_l3]
        moyennes_valides = [m for m in moyennes if m is not None]
        if moyennes_valides:
            self.moyenne_generale = sum(moyennes_valides) / len(moyennes_valides)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.type_candidature}"


class Document(models.Model):
    TYPE_CHOICES = [
        ('cin', 'CIN'),
        ('releves_l1', 'Relevés L1'),
        ('releves_l2', 'Relevés L2'),
        ('releves_l3', 'Relevés L3'),
        ('diplome', 'Diplôme'),
        ('photo', 'Photo d\'identité'),
        ('cv', 'CV'),
        ('lettre_motivation', 'Lettre de motivation'),
    ]
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    ]
    
    candidature = models.ForeignKey(Candidature, on_delete=models.CASCADE, related_name='documents')
    type_document = models.CharField(max_length=20, choices=TYPE_CHOICES)
    fichier_nom = models.CharField(max_length=255)
    fichier_path = models.FileField(upload_to='documents/')
    date_upload = models.DateTimeField(auto_now_add=True)
    statut_verification = models.CharField(max_length=15, choices=STATUT_CHOICES, default='en_attente')
    commentaire = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'documents'
    
    def __str__(self):
        return f"{self.candidature} - {self.type_document}"