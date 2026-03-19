from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    ROLE_CHOICES = [
        ('candidat', 'Candidat'),
        ('commission', 'Membre Commission'),
        ('responsable_commission', 'Responsable Commission'),  # ✅ AJOUTER
        ('admin', 'Administrateur'),
    ]
    
    email = models.EmailField(unique=True, verbose_name="Email")
    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES, 
        default='candidat',
        verbose_name="Rôle"
    )
    
    # ✅ NOUVEAUX CHAMPS POUR VÉRIFICATION EMAIL
    is_email_verified = models.BooleanField(default=False, verbose_name="Email vérifié")
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    
    # ✅ CHAMPS POUR RÉINITIALISATION MOT DE PASSE
    reset_password_token = models.UUIDField(null=True, blank=True)
    reset_password_expire = models.DateTimeField(null=True, blank=True)
    
    # Autres champs
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    date_of_birth = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    
    # Timestamps
    date_inscription = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    derniere_connexion = models.DateTimeField(null=True, blank=True, verbose_name="Dernière connexion")
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'auth_users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-date_inscription']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"