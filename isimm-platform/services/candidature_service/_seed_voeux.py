"""Seed 3 voeux Masters for the test candidate (ahmed.benali@isimm.tn or first candidat).

Run: python _seed_voeux.py
"""
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
import django; django.setup()

from django.contrib.auth import get_user_model
from candidature_app.models import Candidature, Master
from django.utils import timezone

User = get_user_model()

# 1. Trouver un candidat
candidat = (
    User.objects.filter(email__icontains='ahmed').first()
    or User.objects.filter(role='candidat').first()
    or User.objects.filter(is_superuser=False).first()
)
if not candidat:
    sys.stdout.write("Aucun candidat trouve.\n")
    sys.exit(1)
sys.stdout.write("Candidat cible: {} (id={})\n".format(candidat.email, candidat.id))

# 2. Trouver 3 masters distincts (non ingenieur)
masters = Master.objects.exclude(specialite__istartswith='ING').order_by('id')[:3]
if len(masters) < 3:
    sys.stdout.write("Pas assez de masters non-ingenieur ({}).\n".format(len(masters)))
    sys.exit(1)

# 3. Supprimer les anciennes candidatures Masters de ce candidat pour repartir clean
deleted = Candidature.objects.filter(candidat=candidat).exclude(
    master__specialite__istartswith='ING',
).delete()
sys.stdout.write("Anciennes candidatures supprimees: {}\n".format(deleted))

# 4. Creer 3 nouvelles candidatures avec priorites 1, 2, 3
created = []
for i, master in enumerate(masters, start=1):
    c = Candidature.objects.create(
        candidat=candidat,
        master=master,
        statut='soumis',
        choix_priorite=i,
        date_soumission=timezone.now(),
    )
    created.append(c)
    sys.stdout.write(
        "Voeu {}: id={} - {} (priorite={})\n".format(
            i, c.id, master.nom.encode('ascii','backslashreplace').decode('ascii'), c.choix_priorite
        )
    )

# 5. Mettre la 1ere en preselectionne pour tester la page Dossiers
created[0].statut = 'preselectionne'
created[0].save(update_fields=['statut'])
sys.stdout.write("Voeu 1 -> preselectionne (pour tester la page Dossiers)\n")

sys.stdout.write("\nDONE - login avec {}\n".format(candidat.email))
