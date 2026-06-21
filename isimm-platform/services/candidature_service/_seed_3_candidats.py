"""
Script Django Shell pour seeder exactement 3 candidats de test avec spécialités différentes.

USAGE:
  python manage.py shell < _seed_3_candidats.py

"""

from django.contrib.auth import get_user_model
from candidature_app.models import Candidature, Master, DonneesAcademiques
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

print("\n" + "="*80)
print("🗑️  NETTOYAGE — Suppression des données de test actuelles")
print("="*80)

# Supprimer tous les candidats de test (garder que les 3 finaux)
test_users = User.objects.filter(
    email__startswith='candidat',
    email__contains='test'
).exclude(is_staff=True, is_superuser=True)

print(f"📋 Utilisateurs de test trouvés: {test_users.count()}")
for user in test_users:
    print(f"  ❌ Suppression: {user.get_full_name()} ({user.email})")
    user.delete()

# Supprimer toutes les candidatures de test
candidatures_test = Candidature.objects.filter(
    candidat__email__startswith='candidat',
    candidat__email__contains='test'
).exclude(candidat__is_staff=True, candidat__is_superuser=True)

print(f"\n📋 Candidatures de test: {candidatures_test.count()}")
for cand in candidatures_test:
    print(f"  ❌ Suppression: {cand.numero}")
    cand.delete()

print("\n" + "="*80)
print("✨ CRÉATION — 3 candidats avec spécialités différentes")
print("="*80)

# Récupérer ou créer les masters (spécialités)
masters_data = {
    'Génie Logiciel': {
        'nom': 'Master Génie Logiciel et Systèmes d\'Information',
        'specialite': 'Génie Logiciel et Systèmes d\'Information',
        'type_master': 'professionnel',
    },
    'Big Data': {
        'nom': 'Master Big Data et Analyse de Données',
        'specialite': 'Big data et Analyse de données',
        'type_master': 'professionnel',
    },
    'Business': {
        'nom': 'Master Business Computing',
        'specialite': 'Business Computing',
        'type_master': 'professionnel',
    }
}

masters = {}
for key, data in masters_data.items():
    master, created = Master.objects.get_or_create(
        nom=data['nom'],
        defaults={
            'specialite': data['specialite'],
            'type_master': data['type_master'],
            'places_disponibles': 30,
            'date_limite_candidature': timezone.now().date() + timedelta(days=30),
            'annee_universitaire': '2025-2026',
            'actif': True,
            'coeff_bac': 0.4,
            'coeff_licence': 0.6,
        }
    )
    masters[key] = master
    status = "✓ Créé" if created else "✓ Existe"
    print(f"{status}: {master.nom}")

print("\n" + "-"*80)

# Créer 3 candidats
candidats_data = [
    {
        'first_name': 'Ahmed',
        'last_name': 'Ben Ali',
        'email': 'candidat.test.1@isimm.tn',
        'master_key': 'Génie Logiciel',
        'score': 14.17,
    },
    {
        'first_name': 'Fatima',
        'last_name': 'Amira',
        'email': 'candidat.test.2@isimm.tn',
        'master_key': 'Big Data',
        'score': 15.50,
    },
    {
        'first_name': 'Marwen',
        'last_name': 'Gharbi',
        'email': 'candidat.test.3@isimm.tn',
        'master_key': 'Business',
        'score': 13.80,
    }
]

created_candidatures = []

for i, data in enumerate(candidats_data, 1):
    # Créer ou récupérer l'utilisateur
    user, created_user = User.objects.get_or_create(
        email=data['email'],
        defaults={
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'username': data['email'].split('@')[0],
            'is_active': True,
        }
    )

    # Créer ou récupérer la candidature
    candidature, created_cand = Candidature.objects.get_or_create(
        candidat=user,
        master=masters[data['master_key']],
        defaults={
            'nature_candidature': 'externe',
            'statut': 'selectionne',
            'score': data['score'],
            'dossier_depose': True,
            'date_depot_dossier': timezone.now(),
            'dossier_valide': True,
        }
    )

    if created_cand:
        candidature.score = data['score']
        candidature.save()

    status = "✓ Créé" if created_cand else "✓ Existe"
    print(f"\n{status}: Candidat {i}")
    print(f"  👤 {user.get_full_name()} ({user.email})")
    print(f"  🎓 {candidature.master.specialite}")
    print(f"  📊 Score: {candidature.score}")
    print(f"  🔢 N°: {candidature.numero}")

    created_candidatures.append(candidature)

print("\n" + "="*80)
print(f"✅ SUCCÈS — {len(created_candidatures)} candidats créés avec spécialités différentes")
print("="*80)
print("\n📌 RÉSUMÉ :")
for cand in created_candidatures:
    print(f"  • {cand.candidat.get_full_name():25} | {cand.master.specialite:40} | Score: {cand.score}")

print("\n" + "="*80)
print("✨ Script terminé avec succès!")
print("="*80 + "\n")
