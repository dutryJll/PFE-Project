#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
sys.path.insert(0, 'c:\\Users\\HP\\Desktop\\PFE\\isimm-platform\\services\\candidature_service')

django.setup()

from candidature_app.models import Candidature, Master
from django.utils import timezone

# Get or create a master
masters = Master.objects.all()
if not masters.exists():
    print("Aucun master trouvé. Création de masters de test...")
    master = Master.objects.create(
        nom="Master Génie Logiciel",
        specialite="Ingénierie Logicielle",
        type_cycle="master",
        description="Master spécialisé en génie logiciel",
        statut="actif"
    )
else:
    master = masters.first()
    print(f"Master trouvé: {master.nom}")

# Create some test candidatures
candidatures_data = [
    ("TEST-001", "Ali Ahmed", "ali@test.com", "selectionne", 85.5),
    ("TEST-002", "Fatma Ben", "fatma@test.com", "inscrit", 88.0),
    ("TEST-003", "Mohamed Hassan", "mohamed@test.com", "preselectionne", 82.0),
    ("TEST-004", "Noor Karim", "noor@test.com", "rejete", 60.0),
    ("TEST-005", "Salma Khalil", "salma@test.com", "selectionne", 90.0),
]

for numero, nom, email, statut, score in candidatures_data:
    cand, created = Candidature.objects.get_or_create(
        numero=numero,
        defaults={
            "candidat_nom": nom,
            "candidat_email": email,
            "master": master,
            "specialite": master.specialite,
            "score": score,
            "statut": statut,
            "type_concours": "masters",
            "dossier_depose": statut in ["inscrit", "selectionne"],
            "date_submission": timezone.now(),
        }
    )
    if created:
        print(f"✓ Créé: {numero} - {nom}")
    else:
        print(f"✗ Existe déjà: {numero}")

print(f"\nTotal candidatures maintenant: {Candidature.objects.count()}")
