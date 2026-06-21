import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
django.setup()

from candidature_app.models import Candidature
from candidature_app.views_pdf_official import _candidature_to_dict

for c in Candidature.objects.all():
    data = _candidature_to_dict(c)
    print(f"Candidat: {c.candidat.get_full_name()} | Num: {c.numero}")
    print(f"  type_candidat: {data.get('type_candidat')}")
    print(f"  specialite_candidat: {repr(data.get('specialite_candidat'))}")
    print(f"  master specialite: {repr(getattr(c.master, 'specialite', ''))}")
    print(f"  master nom: {repr(getattr(c.master, 'nom', ''))}")
    print("-" * 50)
