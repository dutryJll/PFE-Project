import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
django.setup()

from candidature_app.models import FormuleScore
from decimal import Decimal

# Get the formula
formula = FormuleScore.objects.get(master_id=1)
print(f"Formula: {formula.nom}")
print(f"Coefficients: moy_gen={formula.coef_moyenne_generale}, moy_spec={formula.coef_moyenne_specialite}, pfe={formula.coef_note_pfe}")

# Test data
test_data = {
    'moyenne_generale': 15.5,
    'moyenne_specialite': 14.0,
    'note_pfe': 16.0
}

score = formula.calculer_score(test_data)
print(f"Test score with {test_data}: {score}")
print(f"Score type: {type(score)}")

# Debug: what formula key is detected?
formula_key = formula._master_formula_key()
print(f"Detected formula key: {formula_key}")

# Expected score calculation (generic): 15.5 * 0.60 + 14.0 * 0.30 + 16.0 * 0.10
expected = float(Decimal('15.5') * Decimal('0.60') + Decimal('14.0') * Decimal('0.30') + Decimal('16.0') * Decimal('0.10'))
print(f"Expected score: {expected}")
