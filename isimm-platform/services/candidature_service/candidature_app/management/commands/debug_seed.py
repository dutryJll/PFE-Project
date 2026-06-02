from django.core.management.base import BaseCommand
from candidature_app.models import Candidature, Master
from django.db.models import Count


class Command(BaseCommand):
    help = 'Debug seed results'

    def handle(self, *args, **options):
        w = self.stdout.write

        w("=== DIAGNOSTIC SEED ===")
        w(f"Total candidatures en base : {Candidature.objects.count()}")

        w("\n--- Par statut ---")
        for row in Candidature.objects.values('statut').annotate(n=Count('id')).order_by('-n'):
            w(f"  {row['statut']:<30} : {row['n']}")

        w("\n--- Masters en base ---")
        for m in Master.objects.all():
            nb = Candidature.objects.filter(master=m).count()
            code = getattr(m, 'code', '?')
            w(f"  [{m.id}] {m.nom} ({code}) - {nb} candidatures")

        w("\n--- Candidatures avec master (top 15) ---")
        qs = Candidature.objects.filter(master__isnull=False).select_related('master', 'candidat__user')
        for c in qs[:15]:
            try:
                nom = c.candidat.user.get_full_name() or c.candidat.user.username
            except Exception:
                nom = '?'
            w(f"  id={c.id} statut={c.statut:<20} master={str(c.master.nom)[:25]} nom={nom}")

        w("\n--- Endpoint candidatures-master-commission ---")
        try:
            from candidature_app.models import Commission
            for comm in Commission.objects.all():
                w(f"  [{comm.id}] {comm.nom}")
        except Exception as e:
            w(f"  Pas de modele Commission : {e}")

        w("\n--- Verification champ 'commission' sur Candidature ---")
        try:
            sample = Candidature.objects.filter(master__isnull=False).first()
            if sample:
                w(f"  Champs dispo : {[f.name for f in sample._meta.get_fields()]}")
        except Exception as e:
            w(f"  Erreur : {e}")
