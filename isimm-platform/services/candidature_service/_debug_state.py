"""Debug what's actually in DB for notifications and masters."""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')

import django
django.setup()

from candidature_app.models import Notification, Master  # noqa: E402

sys.stdout.write("=== NOTIFICATIONS contenant 'Pr' ===\n")
for n in Notification.objects.filter(message__icontains='pr')[:10]:
    sys.stdout.write("ID {} | titre={!r} | msg={!r}\n".format(n.id, n.titre, n.message[:120]))

sys.stdout.write("\n=== TOUS LES MASTERS ===\n")
for m in Master.objects.all():
    sys.stdout.write("ID {} | nom={!r} | spec={!r}\n".format(m.id, m.nom, m.specialite))
