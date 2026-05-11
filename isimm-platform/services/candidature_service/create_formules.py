import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
django.setup()

from candidature_app.models import FormuleScore, Master
from decimal import Decimal

# Create formulas for the candidate masters present in the test data.
for master_id in [1, 2, 3]:
    try:
        master = Master.objects.get(id=master_id)
        # Replace any existing formula for deterministic results.
        FormuleScore.objects.filter(master=master).delete()
        
        # Create generic formula
        formula = FormuleScore.objects.create(
            master=master,
            nom=f"Formule Générique - {master.nom}",
            description="Formule simple de test: 60% moyenne générale + 30% moyenne spécialité + 10% PFE",
            coef_moyenne_generale=Decimal('0.60'),
            coef_moyenne_specialite=Decimal('0.30'),
            coef_note_pfe=Decimal('0.10'),
            bonus_mention_tres_bien=Decimal('2.00'),
            bonus_mention_bien=Decimal('1.00'),
            bonus_mention_assez_bien=Decimal('0.50'),
            malus_redoublement=Decimal('-1.00'),
            malus_dette=Decimal('-0.50'),
            actif=True
        )
        print(f"✓ Created FormuleScore for Master {master_id} ({master.nom})")
    except Master.DoesNotExist:
        print(f"✗ Master {master_id} not found")
    except Exception as e:
        print(f"✗ Error for Master {master_id}: {e}")

print("\nFormulas created successfully!")
