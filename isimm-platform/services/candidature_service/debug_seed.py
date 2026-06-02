from candidature_app.models import Candidature, Master
from django.db.models import Count

print("=== DIAGNOSTIC SEED ===")
print(f"Total candidatures : {Candidature.objects.count()}")
print()

# Statuts presents
print("--- Par statut ---")
by_statut = Candidature.objects.values('statut').annotate(n=Count('id')).order_by('-n')
for row in by_statut:
    print(f"  {row['statut']:<30} : {row['n']}")
print()

# Masters existants
print("--- Masters en base ---")
for m in Master.objects.all():
    nb = Candidature.objects.filter(master=m).count()
    print(f"  [{m.id}] {m.nom} ({getattr(m,'code','?')}) — {nb} candidatures")
print()

# Candidatures avec master
print("--- Candidatures avec master (top 15) ---")
qs = Candidature.objects.filter(master__isnull=False).select_related('master', 'candidat__user')
for c in qs[:15]:
    nom = getattr(c.candidat, 'nom_complet', '') or getattr(c.candidat.user, 'get_full_name', lambda: '')()
    print(f"  id={c.id} statut={c.statut:<20} master={c.master.nom[:30]} nom={nom}")
print()

# Vérifier l'endpoint attendu par Angular
print("--- Commission context ---")
try:
    from candidature_app.models import Commission
    for comm in Commission.objects.all():
        print(f"  [{comm.id}] {comm.nom}")
except Exception as e:
    print(f"  Pas de modele Commission : {e}")
