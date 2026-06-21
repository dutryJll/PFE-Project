#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
django.setup()

from django.contrib.auth import get_user_model
from candidature_app.models import Commission, Master, MembreCommission

User = get_user_model()

print("\n[CLEAN] Cleaning duplicate users with ahmed.gharbi@isimm.tn")

# Find all users with this email
users = User.objects.filter(email='ahmed.gharbi@isimm.tn')
print(f"Found {users.count()} users")

for i, u in enumerate(users):
    print(f"  {i+1}. {u.id} | {u.get_full_name()} | Active: {u.is_active} | Staff: {u.is_staff}")

if users.count() > 1:
    # Keep the one with is_staff=False (regular user), delete others
    regular_users = users.filter(is_staff=False, is_superuser=False)

    if regular_users.count() == 1:
        membre = regular_users.first()
        print(f"\n[KEEP] {membre.id} | {membre.get_full_name()}")

        # Delete duplicates
        users_to_delete = users.exclude(id=membre.id)
        for u in users_to_delete:
            print(f"[DELETE] {u.id} | {u.get_full_name()}")
            u.delete()
    else:
        print("[ERROR] Cannot determine which user to keep")
        sys.exit(1)
else:
    membre = users.first()

# Now assign to commission
print(f"\n[ASSIGN] {membre.get_full_name()} to commission")

master_gl = Master.objects.filter(
    specialite__icontains='Génie Logiciel'
).first()

if not master_gl:
    print("[ERROR] Master not found")
    sys.exit(1)

commission, _ = Commission.objects.get_or_create(
    master=master_gl,
    defaults={
        'nom': f'Commission - {master_gl.nom}',
        'actif': True,
    }
)

membre_commission, created = MembreCommission.objects.get_or_create(
    commission=commission,
    user=membre,
    defaults={'role': 'membre', 'actif': True}
)

membre_commission.commissions.add(commission)

print(f"[OK] {membre.email} → {commission.nom}")
print("\n[DONE]\n")
