"""
Seed script pour la démo workflow complet MPGL.

Distribution des 12 candidats selon la State Machine :
  - 3 x 'sous_examen'    → onglet Présélection (responsable valide → preselectionne)
  - 1 x 'sous_examen'    → Ahmed Ben Ali (démo OCR live + flux complet)
  - 4 x 'dossier_depose' → onglet Sélection (responsable valide → selectionne / rejete)
  - 4 x 'selectionne'    → liste des admis (candidat voit le bouton inscription)

Statuts valides Django :
  soumis | sous_examen | preselectionne | en_attente_dossier
  dossier_depose | selectionne | rejete | inscrit

Usage :
    python manage.py seed_workflow_demo
    python manage.py seed_workflow_demo --reset
    python manage.py seed_workflow_demo --dry-run
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from candidature_app.models import Candidature, DonneesAcademiques, Master

User = get_user_model()

# ---------------------------------------------------------------------------
# DONNÉES : 3 + 1 + 4 + 4 = 12 candidats MPGL
# ---------------------------------------------------------------------------

# Onglet PRÉSÉLECTION → responsable les voit et les valide en 'preselectionne'
PRESELECTEES = [
    {
        "prenom": "Yassine", "nom": "Ben Ammar",
        "email": "yassine.benammar@demo.tn",
        "score": 16.85, "statut": "sous_examen", "depose": False,
        "spec": "Licence en Sciences de l'Informatique genie logiciel",
    },
    {
        "prenom": "Nour", "nom": "Zouari",
        "email": "nour.zouari@demo.tn",
        "score": 15.20, "statut": "sous_examen", "depose": False,
        "spec": "Licence en Sciences de l'Informatique genie logiciel",
    },
    {
        "prenom": "Rania", "nom": "Mabrouk",
        "email": "rania.mabrouk@demo.tn",
        "score": 17.10, "statut": "sous_examen", "depose": False,
        "spec": "Informatique de Gestion (uniquement)",
    },
]

# Candidat démo OCR live (flux complet devant le prof)
AHMED = {
    "prenom": "Ahmed", "nom": "Ben Ali",
    "email": "ahmed.benali.test@demo.tn",
    "score": 14.50, "statut": "sous_examen", "depose": False,
    "spec": "Licence en Sciences de l'Informatique genie logiciel",
}

# Onglet SELECTION → responsable vérifie et valide en 'selectionne' ou 'rejete'
DOSSIERS_DEPOSES = [
    {
        "prenom": "Mohamed", "nom": "Jlassi",
        "email": "mohamed.jlassi@demo.tn",
        "score": 14.90, "statut": "dossier_depose", "depose": True,
        "spec": "Informatique de Gestion (uniquement)",
    },
    {
        "prenom": "Sonia", "nom": "Trabelsi",
        "email": "sonia.trabelsi@demo.tn",
        "score": 15.75, "statut": "dossier_depose", "depose": True,
        "spec": "Genie Logiciel et Systemes d'Information",
    },
    {
        "prenom": "Marwen", "nom": "Gharbi",
        "email": "marwen.gharbi@demo.tn",
        "score": 13.25, "statut": "dossier_depose", "depose": True,
        "spec": "Genie Logiciel et Systemes d'Information",
    },
    {
        "prenom": "Amira", "nom": "Dridi",
        "email": "amira.dridi@demo.tn",
        "score": 16.40, "statut": "dossier_depose", "depose": True,
        "spec": "Genie Logiciel",
    },
]

# Liste ADMIS → candidat voit son statut 'selectionne' + bouton inscription
SELECTIONNES = [
    {
        "prenom": "Fedi", "nom": "Khamassi",
        "email": "fedi.khamassi@demo.tn",
        "score": 15.60, "statut": "selectionne", "depose": True,
        "spec": "Licence en Sciences de l'Informatique genie logiciel",
    },
    {
        "prenom": "Hamza", "nom": "Ayari",
        "email": "hamza.ayari@demo.tn",
        "score": 14.80, "statut": "selectionne", "depose": True,
        "spec": "Genie Logiciel",
    },
    {
        "prenom": "Farah", "nom": "Ellouze",
        "email": "farah.ellouze@demo.tn",
        "score": 16.10, "statut": "selectionne", "depose": True,
        "spec": "Licence Appliquee en Developpement des Systemes Informatiques",
    },
    {
        "prenom": "Oussema", "nom": "Saidi",
        "email": "oussema.saidi@demo.tn",
        "score": 15.60, "statut": "selectionne", "depose": True,
        "spec": "Licence Appliquee en Developpement des Systemes Informatiques",
    },
]

ALL_DEMO = PRESELECTEES + [AHMED] + DOSSIERS_DEPOSES + SELECTIONNES


class Command(BaseCommand):
    help = (
        "Seed demo workflow MPGL : 3 sous_examen + Ahmed + 4 dossier_depose + 4 selectionne. "
        "Master MPGL (specialite='MPGL') doit exister en base."
    )

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true",
                            help="Affiche sans ecrire.")
        parser.add_argument("--reset", action="store_true",
                            help="Supprime et re-seed les candidats demo.tn.")

    def handle(self, *args, **options):
        dry = options["dry_run"]
        reset = options["reset"]

        self.stdout.write(self.style.MIGRATE_HEADING(
            "\n=======================================================\n"
            "  ISIMM - Seed WORKFLOW demo MPGL\n"
            "=======================================================\n"
        ))
        if dry:
            self.stdout.write(self.style.WARNING("Mode DRY-RUN - aucune ecriture.\n"))

        # 1. Master MPGL
        try:
            master = Master.objects.get(specialite="MPGL")
        except Master.DoesNotExist:
            self.stderr.write(self.style.ERROR(
                "Aucun Master specialite='MPGL'. Creez-le via l'admin."
            ))
            return
        except Master.MultipleObjectsReturned:
            master = Master.objects.filter(specialite="MPGL").order_by("id").first()

        self.stdout.write(f"  Master : [{master.id}] {master.nom}\n")

        # 2. Reset
        if reset and not dry:
            emails = [c["email"] for c in ALL_DEMO]
            users = User.objects.filter(email__in=emails)
            deleted_cand, _ = Candidature.objects.filter(
                candidat__in=users, master=master
            ).delete()
            users.delete()
            self.stdout.write(self.style.WARNING(
                f"  [RESET] {deleted_cand} candidature(s) supprimee(s).\n"
            ))

        # 3. Seed helper
        def seed_one(data: dict, suffix: str) -> None:
            label = (
                f"{data['prenom']} {data['nom']} "
                f"[{data['statut']}] score={data['score']}"
            )
            if dry:
                self.stdout.write(f"  DRY  {label}")
                return

            u, u_created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username": data["email"].split("@")[0].replace(".", "_")[:150],
                    "first_name": data["prenom"],
                    "last_name": data["nom"],
                    "is_active": True,
                },
            )
            if u_created:
                u.set_password("Demo@2026!")
                u.save()

            cand, c_created = Candidature.objects.get_or_create(
                candidat=u,
                master=master,
                defaults={
                    "numero": f"CAND-WF-{suffix}",
                    "score": data["score"],
                    "statut": data["statut"],
                    "dossier_depose": data["depose"],
                    "date_soumission": timezone.now(),
                },
            )

            DonneesAcademiques.objects.update_or_create(
                candidature=cand,
                defaults={
                    "moyenne_generale": data["score"],
                    "notes_detaillees": {
                        "specialite_diplome": data["spec"],
                        "payload": {"specialite_diplome": data["spec"]},
                    },
                },
            )

            # DonneesAcademiques.save() re-calcule le score via signal.
            # On force les valeurs correctes avec un UPDATE direct (bypass signal).
            Candidature.objects.filter(pk=cand.pk).update(
                score=data["score"],
                statut=data["statut"],
                dossier_depose=data["depose"],
            )

            tag = self.style.SUCCESS("CREE  ") if c_created else self.style.NOTICE("MAJ   ")
            self.stdout.write(f"  {tag} {label}")

        # 4. Seed par groupe
        self.stdout.write("\n-- Groupe Preselectees (sous_examen) -------------------")
        for i, d in enumerate(PRESELECTEES, start=100):
            seed_one(d, str(i))

        self.stdout.write("\n-- Ahmed Ben Ali (sous_examen - demo live) -------------")
        seed_one(AHMED, "OCR")

        self.stdout.write("\n-- Groupe Dossiers deposes (dossier_depose) ------------")
        for i, d in enumerate(DOSSIERS_DEPOSES, start=200):
            seed_one(d, str(i))

        self.stdout.write("\n-- Groupe Selectionnes (selectionne) -------------------")
        for i, d in enumerate(SELECTIONNES, start=300):
            seed_one(d, str(i))

        # 5. Resume
        if not dry:
            def count(s):
                return Candidature.objects.filter(master=master, statut=s).count()

            total = Candidature.objects.filter(master=master).count()
            self.stdout.write(self.style.SUCCESS(
                f"\n[OK] {total} candidature(s) pour MPGL\n"
                f"     sous_examen={count('sous_examen')}  "
                f"dossier_depose={count('dossier_depose')}  "
                f"selectionne={count('selectionne')}\n"
            ))
            self.stdout.write(
                ">>> Ahmed (ahmed.benali.test@demo.tn) : sous_examen, "
                "dossier_depose=False → pret pour demo flux complet.\n"
            )
