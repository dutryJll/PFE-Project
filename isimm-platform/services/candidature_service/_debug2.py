import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
import django; django.setup()
from candidature_app.models import Notification, Master

# Force ASCII output
def safe(s):
    if s is None:
        return ''
    return s.encode('ascii', 'backslashreplace').decode('ascii')

sys.stdout.write("=== Last 5 notifications ===\n")
for n in Notification.objects.order_by('-id')[:5]:
    sys.stdout.write("ID {} | msg='{}'\n".format(n.id, safe(n.message)[:150]))

sys.stdout.write("\n=== All masters (name + spec) ===\n")
for m in Master.objects.all():
    sys.stdout.write("ID {} | nom='{}' | spec='{}'\n".format(m.id, safe(m.nom), safe(m.specialite)))

sys.stdout.write("\n=== Total counts ===\n")
sys.stdout.write("Notifications: {}\n".format(Notification.objects.count()))
sys.stdout.write("Masters: {}\n".format(Master.objects.count()))
