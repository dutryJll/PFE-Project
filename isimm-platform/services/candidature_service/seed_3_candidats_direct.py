#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script direct pour seeder 3 candidats de test.
Exécution: python seed_3_candidats_direct.py
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
django.setup()

from django.contrib.auth import get_user_model
from candidature_app.models import Candidature, Master
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

print("\n" + "="*80)
print("[CLEANING] Remove old test data")
print("="*80)

# Nettoyer les utilisateurs de test
deleted_users = 0
for email in ['candidat.test.1@isimm.tn', 'candidat.test.2@isimm.tn', 'candidat.test.3@isimm.tn']:
    try:
        user = User.objects.get(email=email)
        print(f"  [DELETED] {user.get_full_name()} ({user.email})")
        user.delete()
        deleted_users += 1
    except User.DoesNotExist:
        pass

print(f"[OK] {deleted_users} users deleted")

print("\n" + "="*80)
print("[CREATING] 3 candidates with different specialities")
print("="*80)

# Créer les masters (spécialités)
masters_config = [
    {
        'nom': 'Master Génie Logiciel et Systèmes d\'Information',
        'specialite': 'Génie Logiciel et Systèmes d\'Information',
    },
    {
        'nom': 'Master Big Data et Analyse de Données',
        'specialite': 'Big data et Analyse de données',
    },
    {
        'nom': 'Master Business Computing',
        'specialite': 'Business Computing',
    }
]

masters = []
for config in masters_config:
    master, created = Master.objects.get_or_create(
        nom=config['nom'],
        defaults={
            'specialite': config['specialite'],
            'type_master': 'professionnel',
            'places_disponibles': 30,
            'date_limite_candidature': timezone.now().date() + timedelta(days=30),
            'annee_universitaire': '2025-2026',
            'actif': True,
            'coeff_bac': 0.4,
            'coeff_licence': 0.6,
        }
    )
    masters.append(master)
    status = "[CREATED]" if created else "[EXISTS]"
    print(f"{status}: {master.nom}")

print("\n" + "-"*80)

# Créer 3 candidats
candidats_config = [
    {
        'first_name': 'Ahmed',
        'last_name': 'Ben Ali',
        'email': 'candidat.test.1@isimm.tn',
        'master': masters[0],
        'score': 14.17,
    },
    {
        'first_name': 'Fatima',
        'last_name': 'Amira',
        'email': 'candidat.test.2@isimm.tn',
        'master': masters[1],
        'score': 15.50,
    },
    {
        'first_name': 'Marwen',
        'last_name': 'Gharbi',
        'email': 'candidat.test.3@isimm.tn',
        'master': masters[2],
        'score': 13.80,
    }
]

created_candidatures = []

for i, config in enumerate(candidats_config, 1):
    # Créer l'utilisateur
    user, created_user = User.objects.get_or_create(
        email=config['email'],
        defaults={
            'first_name': config['first_name'],
            'last_name': config['last_name'],
            'username': config['email'].split('@')[0],
            'is_active': True,
        }
    )

    # Créer la candidature
    candidature, created_cand = Candidature.objects.get_or_create(
        candidat=user,
        master=config['master'],
        defaults={
            'nature_candidature': 'externe',
            'statut': 'selectionne',
            'score': config['score'],
            'dossier_depose': True,
            'date_depot_dossier': timezone.now(),
            'dossier_valide': True,
        }
    )

    if created_cand or candidature.score != config['score']:
        candidature.score = config['score']
        candidature.save()

    status = "[CREATED]" if created_cand else "[EXISTS]"
    print(f"\n{status}: Candidate {i}")
    print(f"  Name: {user.get_full_name()} ({user.email})")
    print(f"  Speciality: {candidature.master.specialite}")
    print(f"  Score: {candidature.score}")
    print(f"  Number: {candidature.numero}")

    created_candidatures.append(candidature)

print("\n" + "="*80)
print(f"[SUCCESS] {len(created_candidatures)} candidates created with different specialities")
print("="*80)
print("\nSUMMARY:")
for cand in created_candidatures:
    print(f"  • {cand.candidat.get_full_name():25} | {cand.master.specialite:40} | Score: {cand.score}")

print("\n" + "="*80)
