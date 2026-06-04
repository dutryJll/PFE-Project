"""
Nettoyage DÉMO : ne garde QUE Ahmed Ben Ali (ahmed.benali.test@gmail.com).

Effets :
  • Supprime TOUTES les candidatures sauf celle d'Ahmed sur Master MPGL [5]
  • Supprime les utilisateurs demo (@demo.tn, gl.candidate*, copilot_test*, test_*)
  • Ahmed est repositionné en 'sous_examen' sur Master [5] avec score 14.5

Usage :
    python manage.py cleanup_demo_ahmed_only
    python manage.py cleanup_demo_ahmed_only --dry-run
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Q

from candidature_app.models import Candidature, Master, Commission

User = get_user_model()

AHMED_EMAIL = 'ahmed.benali.test@gmail.com'
MASTER_NOM  = 'Mastère Professionnel en Génie Logiciel (MPGL)'
MASTER_SPEC = 'MPGL'


class Command(BaseCommand):
    help = 'Nettoie la base pour ne garder que Ahmed Ben Ali sur Master MPGL.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        dry = options['dry_run']
        w = self.stdout.write

        w(self.style.MIGRATE_HEADING(
            '\n=======================================================\n'
            '  ISIMM — Cleanup démo : Ahmed Ben Ali uniquement\n'
            '=======================================================\n'
        ))

        # ── 1. Trouver Ahmed (réel, gmail.com) ─────────────────────────
        ahmed = User.objects.filter(email__iexact=AHMED_EMAIL).first()
        if not ahmed:
            self.stderr.write(self.style.ERROR(
                f"Utilisateur {AHMED_EMAIL} introuvable. "
                'Connectez-vous une fois avec ce compte pour le créer.'
            ))
            return
        w(f'  Ahmed trouvé : id={ahmed.id}  {ahmed.email}')

        # ── 2. Trouver Master MPGL [5] ──────────────────────────────────
        master = (Master.objects.filter(nom=MASTER_NOM, specialite=MASTER_SPEC).first()
                  or Master.objects.filter(specialite=MASTER_SPEC).first())
        if not master:
            self.stderr.write(self.style.ERROR(f'Master MPGL introuvable.'))
            return
        w(f'  Master  : [{master.id}] {master.nom}  actif={master.actif}')

        if not master.actif and not dry:
            master.actif = True
            master.save(update_fields=['actif'])
            w(self.style.WARNING('  [FIX] Master activé'))

        # ── 3. Supprimer toutes les candidatures SAUF celles d'Ahmed ──
        cands_to_del = Candidature.objects.exclude(candidat=ahmed)
        w(f'\n  Candidatures à supprimer : {cands_to_del.count()}')
        for c in cands_to_del[:20]:
            w(f'    - [{c.id}] {c.candidat.email}  master=[{c.master_id}]  statut={c.statut}')
        if cands_to_del.count() > 20:
            w(f'    ... +{cands_to_del.count() - 20} autres')

        if not dry:
            n, _ = cands_to_del.delete()
            w(self.style.SUCCESS(f'  [OK] {n} candidature(s) supprimée(s).'))

        # ── 4. Supprimer les utilisateurs démo / test ──────────────────
        demo_users = User.objects.filter(
            Q(email__endswith='@demo.tn')
            | Q(email__icontains='gl.candidate')
            | Q(email__icontains='ds.candidate')
            | Q(email__icontains='copilot_test')
            | Q(email__icontains='test_candidat')
            | Q(email__icontains='@example.com')
        ).exclude(pk=ahmed.pk)

        # On exclut aussi les comptes responsable/commission/admin
        demo_users = demo_users.exclude(
            email__in=['responsable@isimm.tn', 'commission@isimm.tn',
                       'shared.member@isimm.tn', 'local.member1@isimm.tn',
                       'responsable.member@isimm.tn']
        )

        w(f'\n  Utilisateurs démo à supprimer : {demo_users.count()}')
        for u in demo_users[:15]:
            w(f'    - id={u.id}  {u.email}')
        if demo_users.count() > 15:
            w(f'    ... +{demo_users.count() - 15} autres')

        if not dry:
            n, _ = demo_users.delete()
            w(self.style.SUCCESS(f'  [OK] {n} utilisateur(s) démo supprimé(s).'))

        # ── 5. S'assurer qu'Ahmed a UNE candidature sur Master MPGL ────
        if not dry:
            ahmed_cand, created = Candidature.objects.get_or_create(
                candidat=ahmed,
                master=master,
                defaults={
                    'numero': f'CAND-AHMED-{ahmed.id:03d}',
                    'score': 14.5,
                    'statut': 'sous_examen',
                    'dossier_depose': False,
                },
            )
            Candidature.objects.filter(pk=ahmed_cand.pk).update(
                score=14.5,
                statut='sous_examen',
                dossier_depose=False,
            )
            tag = 'CRÉÉE' if created else 'RÉINITIALISÉE'
            w(f"\n  [{tag}] Candidature Ahmed [{ahmed_cand.id}] sur Master [{master.id}] — statut=sous_examen, score=14.5")

            # Supprimer toute autre candidature d'Ahmed sur d'autres masters
            other = Candidature.objects.filter(candidat=ahmed).exclude(pk=ahmed_cand.pk)
            if other.exists():
                n, _ = other.delete()
                w(f"  [OK] {n} autre(s) candidature(s) d'Ahmed supprimée(s) (sur d'autres masters).")

        # ── 6. Résumé final ────────────────────────────────────────────
        if not dry:
            total = Candidature.objects.count()
            ahmed_count = Candidature.objects.filter(candidat=ahmed).count()
            on_master = Candidature.objects.filter(master=master).count()

            w(self.style.SUCCESS(
                f'\n[ÉTAT FINAL]'
                f'\n  Total candidatures DB        : {total}'
                f"\n  Candidatures d'Ahmed         : {ahmed_count}"
                f'\n  Candidatures sur Master [{master.id}] : {on_master}\n'
            ))
            w('Comptes démo :')
            w('  Candidat     : ahmed.benali.test@gmail.com  / TestPassword123!')
            w('  Responsable  : responsable@isimm.tn         / TestPassword123!')
            w('  Membre comm. : commission@isimm.tn          / Demo@2026!\n')
