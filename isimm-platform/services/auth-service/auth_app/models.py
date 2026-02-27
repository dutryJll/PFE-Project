from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('candidat', 'Candidat'),
        ('commission', 'Commission'),
        ('admin', 'Administrateur'),
        ('directeur', 'Directeur'),  # ← AJOUTÉ
        ('secretaire_general', 'Secrétaire Général'),  # ← AJOUTÉ
    ]
    
    email = models.EmailField(unique=True, verbose_name="Email")
    role = models.CharField(
        max_length=30,  # ← CHANGÉ de 20 à 30
        choices=ROLE_CHOICES, 
        default='candidat',
        verbose_name="Rôle"
    )
    date_inscription = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    derniere_connexion = models.DateTimeField(null=True, blank=True, verbose_name="Dernière connexion")
    user_service_id = models.IntegerField(null=True, blank=True, verbose_name="ID User Service")
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'auth_users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-date_inscription']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"