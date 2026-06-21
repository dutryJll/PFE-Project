#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script pour assigner ahmed.gharbi à une commission.
Exécution: python assign_membre_commission.py
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
django.setup()

from django.contrib.auth import get_user_model
from candidature_app.models import Commission, Master, MembreCommission

User = get_user_model()

print("\n" + "="*80)
print("[ASSIGNING COMMISSION] Assign ahmed.gharbi to a commission")
print("="*80)

# 1. Find user
try:
    membre = User.objects.get(email='ahmed.gharbi@isimm.tn')
    print(f"\n[OK] User found: {membre.get_full_name()} ({membre.email})")
except User.DoesNotExist:
    print("[ERROR] User ahmed.gharbi@isimm.tn not found!")
    sys.exit(1)

# 2. Find or create Commission for "Génie Logiciel"
master_gl = Master.objects.filter(
    specialite__icontains='Génie Logiciel'
).first()

if not master_gl:
    print("[ERROR] Master 'Génie Logiciel' not found!")
    sys.exit(1)

print(f"[OK] Master found: {master_gl.nom}")

# Get or create Commission for this Master
commission, created = Commission.objects.get_or_create(
    master=master_gl,
    defaults={
        'nom': f'Commission - {master_gl.nom}',
        'description': f'Commission d\'examen pour {master_gl.nom}',
        'actif': True,
    }
)

if created:
    print(f"[CREATED] Commission: {commission.nom}")
else:
    print(f"[EXISTS] Commission: {commission.nom}")

# 3. Create MembreCommission link
membre_commission, created = MembreCommission.objects.get_or_create(
    commission=commission,
    user=membre,
    defaults={
        'role': 'membre',
        'actif': True,
    }
)

if created:
    print(f"[LINKED] {membre.email} → {commission.nom} (role: membre)")
else:
    print(f"[ALREADY LINKED] {membre.email} is already in {commission.nom}")

# 4. Also add to commissions ManyToMany field
membre_commission.commissions.add(commission)

# 5. Verify
member_commissions = MembreCommission.objects.filter(user=membre)
print(f"\n[VERIFICATION] {membre.email} is now in {member_commissions.count()} commission(s):")
for mc in member_commissions:
    print(f"  • {mc.commission.nom}")

print("\n" + "="*80)
print("[SUCCESS] Commission assignment complete!")
print("="*80 + "\n")
