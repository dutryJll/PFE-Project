#!/usr/bin/env python
"""
Initialize test data: Masters, FormuleScore, Offres
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'isimm-platform/services/candidature_service'))

django.setup()

from candidature_app.models import Master, FormuleScore, Offre
from datetime import datetime, timedelta

def init_test_data():
    print("=" * 80)
    print("🔧 Initializing test data")
    print("=" * 80)
    
    # Define masters and their formulas
    masters_config = [
        {
            'code': 'MPGL',
            'name': 'Master Professionnels Génie Logiciel',
            'formula': {
                'name': 'MPGL Standard',
                'components': [
                    {'name': 'moyenne_generale', 'coefficient': 0.6},
                    {'name': 'moyenne_specialite', 'coefficient': 0.4},
                ]
            }
        },
        {
            'code': 'MPDS',
            'name': 'Master Professionnels Développement Système',
            'formula': {
                'name': 'MPDS Standard',
                'components': [
                    {'name': 'moyenne_generale', 'coefficient': 0.5},
                    {'name': 'moyenne_specialite', 'coefficient': 0.5},
                ]
            }
        },
        {
            'code': 'MP3I',
            'name': 'Master Professionnels 3I',
            'formula': {
                'name': 'MP3I Standard',
                'components': [
                    {'name': 'moyenne_generale', 'coefficient': 0.7},
                    {'name': 'moyenne_specialite', 'coefficient': 0.3},
                ]
            }
        },
        {
            'code': 'MRGL',
            'name': 'Master Recherche Génie Logiciel',
            'formula': {
                'name': 'MRGL Standard',
                'components': [
                    {'name': 'moyenne_generale', 'coefficient': 0.8},
                    {'name': 'moyenne_specialite', 'coefficient': 0.2},
                ]
            }
        },
        {
            'code': 'MRMI',
            'name': 'Master Recherche Multimedia Internet',
            'formula': {
                'name': 'MRMI Standard',
                'components': [
                    {'name': 'moyenne_generale', 'coefficient': 0.6},
                    {'name': 'moyenne_specialite', 'coefficient': 0.4},
                ]
            }
        },
        {
            'code': 'ING_INFO_GL',
            'name': 'Master Ingénierie Informatique GL',
            'formula': {
                'name': 'ING_INFO_GL Standard',
                'components': [
                    {'name': 'moyenne_generale', 'coefficient': 0.65},
                    {'name': 'moyenne_specialite', 'coefficient': 0.35},
                ]
            }
        },
        {
            'code': 'ING_EM',
            'name': 'Master Ingénierie Entreprise Modernes',
            'formula': {
                'name': 'ING_EM Standard',
                'components': [
                    {'name': 'moyenne_generale', 'coefficient': 0.6},
                    {'name': 'moyenne_specialite', 'coefficient': 0.4},
                ]
            }
        },
    ]
    
    # Create Masters and FormuleScore
    for config in masters_config:
        print(f"\n📚 Creating {config['code']}...")
        
        master, created = Master.objects.get_or_create(
            code=config['code'],
            defaults={
                'nom': config['name'],
                'description': f'Master {config["name"]}',
                'lieu': 'ISIMM',
                'capacite': 30,
            }
        )
        
        if created:
            print(f"   ✅ Master created: {master.id}")
        else:
            print(f"   ℹ️  Master already exists: {master.id}")
        
        # Create or update FormuleScore
        formula_cfg = config['formula']
        formula, fcreated = FormuleScore.objects.get_or_create(
            master_id=master.id,
            defaults={
                'nom': formula_cfg['name'],
                'formule': 'standard',
                'composantes': formula_cfg['components'],
            }
        )
        
        if fcreated:
            print(f"   ✅ FormuleScore created: {formula.id}")
        else:
            print(f"   ℹ️  FormuleScore already exists: {formula.id}")
    
    # Create test offers
    print(f"\n📝 Creating test offers...")
    
    for master_code in ['MPGL', 'MPDS', 'MP3I', 'MRGL', 'MRMI', 'ING_INFO_GL', 'ING_EM']:
        try:
            master = Master.objects.get(code=master_code)
            
            offre, ocreated = Offre.objects.get_or_create(
                master_id=master.id,
                titre__contains=master_code,
                defaults={
                    'titre': f'{master_code} - Offre de formation',
                    'description': f'Offre de formation pour {master_code}',
                    'code': master_code,
                    'nature': 'Master',
                    'specialite': master_code,
                    'date_ouverture': datetime.now(),
                    'date_fermeture': datetime.now() + timedelta(days=90),
                    'capacite': 30,
                }
            )
            
            if ocreated:
                print(f"   ✅ Offre created for {master_code}: {offre.id}")
            else:
                print(f"   ℹ️  Offre already exists for {master_code}: {offre.id}")
                
        except Master.DoesNotExist:
            print(f"   ❌ Master {master_code} not found")
    
    print("\n" + "=" * 80)
    print("✅ Test data initialized successfully!")
    print("=" * 80)

if __name__ == "__main__":
    try:
        init_test_data()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
