#!/usr/bin/env python3
"""
Diagnostic script to check available test users and commission setup
Run this to see what test data exists before running the main test suite
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, r'c:\Users\HP\Desktop\PFE\isimm-platform\services\auth-service')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

print("\n" + "="*80)
print("DIAGNOSTIC: Available Users and Commission Setup")
print("="*80 + "\n")

# 1. List all users
print("📋 ALL USERS IN AUTH-SERVICE:")
print("-" * 80)
users = User.objects.all()
if users.exists():
    for user in users:
        print(f"  ID: {user.id:3} | Email: {user.email:30} | Role: {user.role:20} | Active: {user.is_active}")
else:
    print("  ❌ No users found!")

print(f"\nTotal users: {users.count()}\n")

# 2. Look for commission users
print("🔍 COMMISSION/RESPONSABLE USERS:")
print("-" * 80)
commission_users = User.objects.filter(
    Q(role='commission') | Q(role='responsable_commission') | Q(role='admin')
)
if commission_users.exists():
    for user in commission_users:
        print(f"  ✅ {user.email:30} | Role: {user.role}")
else:
    print("  ❌ No commission users found!")

print(f"\nTotal commission users: {commission_users.count()}\n")

# 3. Check candidature service
print("🔗 CHECKING CANDIDATURE SERVICE:")
print("-" * 80)
try:
    sys.path.insert(0, r'c:\Users\HP\Desktop\PFE\isimm-platform\services\candidature_service')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    from isimm_platform.models import Commission, MembreCommission
    
    commissions = Commission.objects.all()
    print(f"Total commissions: {commissions.count()}")
    
    if commissions.exists():
        print("\nCommissions:")
        for comm in commissions:
            members = MembreCommission.objects.filter(commission=comm, actif=True).count()
            print(f"  ✅ {comm.nom:40} | Members: {members}")
    else:
        print("  ❌ No commissions found!")
        
except Exception as e:
    print(f"  ⚠️  Could not check candidature service: {e}")

print("\n" + "="*80)
print("END DIAGNOSTIC")
print("="*80 + "\n")

# 4. Recommendations
print("📝 RECOMMENDATIONS:")
print("-" * 80)

if not commission_users.exists():
    print("""
❌ ISSUE: No commission users found!

To run the tests, you need:
1. A user with role='commission' or 'responsable_commission'
2. That user must be a member of at least one Commission
3. The Commission must exist in candidature_service

Quick setup:
  python manage.py shell
  > from django.contrib.auth import get_user_model
  > User = get_user_model()
  > u = User.objects.create_user(
  >   email='commission@isimm.tn',
  >   password='TestPassword123!',
  >   role='responsable_commission'
  > )
  > u.save()
    """)
else:
    print(f"✅ Found {commission_users.count()} commission user(s) - Tests should work!")
    if commission_users.exists():
        first_user = commission_users.first()
        print(f"\n   Suggested test credentials:")
        print(f"   Email: {first_user.email}")
        print(f"   Note: Use actual password for this user")

print("="*80 + "\n")
