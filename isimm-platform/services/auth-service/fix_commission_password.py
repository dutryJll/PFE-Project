import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

NEW_PASSWORD = 'Demo@2026!'
TARGETS = ['commission@isimm.tn', 'responsable.member@isimm.tn', 'commission']

print(f"Total users in auth-service DB: {User.objects.count()}")
print()

# Show all users with commission in username or role
for u in User.objects.all()[:30]:
    role = getattr(u, 'role', '?')
    print(f"  {u.username:<40} email={u.email:<35} role={role} active={u.is_active}")

print()
print("--- Resetting passwords ---")
for target in TARGETS:
    user = User.objects.filter(username=target).first() or User.objects.filter(email=target).first()
    if user:
        user.set_password(NEW_PASSWORD)
        user.save()
        print(f"  [OK] {user.username} password reset to '{NEW_PASSWORD}'")
    else:
        print(f"  [?]  '{target}' not found in auth-service DB")
