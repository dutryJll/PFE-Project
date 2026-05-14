"""
Script Django management pour initialiser les mappages spécialités-parcours.
Contient tous les parcours Master et Ingénieur avec leurs spécialités requises.

Usage:
    python manage.py shell < init_specialites_parcours.py
    
Ou depuis Python:
    from candidature_app.management.commands.init_specialites_parcours import Command
    Command().handle()
"""

from django.utils import timezone
from candidature_app.models import SpecialiteParcoursMapping, Master

def init_specialites_parcours():
    """Initialise tous les mappages spécialités-parcours"""
    
    # Définition de tous les parcours avec leurs spécialités
    parcours_data = [
        # ============================================
        # MASTERS PROFESSIONNELS
        # ============================================
        {
            'code_parcours': 'MPDS',
            'nom_parcours': 'Master Professionnel en Sciences de Données',
            'type_formation': 'master',
            'ordre': 1,
            'specialites': [
                {
                    'nom': 'Licence en Mathématiques Appliquées (ou équivalent)',
                    'abreviation': 'LMA'
                },
                {
                    'nom': 'Licence en Sciences de l\'Informatique (ou équivalent)',
                    'abreviation': 'LSI'
                },
                {
                    'nom': 'Licence en Informatique de Gestion (ou équivalent)',
                    'abreviation': 'LIG'
                },
            ]
        },
        {
            'code_parcours': 'MPGL',
            'nom_parcours': 'Master Professionnel en Génie Logiciel',
            'type_formation': 'master',
            'ordre': 2,
            'specialites': [
                {
                    'nom': 'Licence en Informatique (ou équivalent)',
                    'abreviation': 'LI'
                },
                {
                    'nom': 'Licence en Informatique de Gestion (ou équivalent)',
                    'abreviation': 'LIG'
                },
                {
                    'nom': 'Licence en Sciences de l\'Informatique spécialité Génie Logiciel et Systèmes d\'Information (ou équivalent)',
                    'abreviation': 'LGLSI'
                },
            ]
        },
        {
            'code_parcours': 'MP3I',
            'nom_parcours': 'Master Professionnel en Ingénieries en Instrumentation Industrielle (3I)',
            'type_formation': 'master',
            'ordre': 3,
            'specialites': [
                {
                    'nom': 'Licence en Électronique, Électrotechnique et Automatique (MIM)',
                    'abreviation': 'LEEA'
                },
                {
                    'nom': 'Licence en Électronique, Électrotechnique et Automatique (SE)',
                    'abreviation': 'LEEA_SE'
                },
                {
                    'nom': 'Licence en Technologies de l\'Information et de la Communication (TIC)',
                    'abreviation': 'LTIC'
                },
                {
                    'nom': 'Licence en Mesures et Instrumentation (ou équivalent)',
                    'abreviation': 'LMI'
                },
                {
                    'nom': 'Licence en EEA spécialité Automatique et Informatique Industrielle ou Mesures et Métrologie (ou équivalent)',
                    'abreviation': 'LEEA_AIIM'
                },
                {
                    'nom': 'Licence en Génie Électrique spécialité Automatique et Informatique Industrielle (ou équivalent)',
                    'abreviation': 'LGE_AII'
                },
            ]
        },
        # ============================================
        # MASTERS RECHERCHE
        # ============================================
        {
            'code_parcours': 'MRGL',
            'nom_parcours': 'Master Recherche en Génie Logiciel',
            'type_formation': 'master',
            'ordre': 4,
            'specialites': [
                {
                    'nom': 'Licence en Informatique (ou équivalent)',
                    'abreviation': 'LI'
                },
                {
                    'nom': 'Maîtrise en Informatique (ou équivalent)',
                    'abreviation': 'MI'
                },
                {
                    'nom': 'Licence en Informatique ou Informatique de Gestion (ou équivalent)',
                    'abreviation': 'LIIG'
                },
                {
                    'nom': 'Maîtrise en Informatique ou Informatique de Gestion (ou équivalent)',
                    'abreviation': 'MIIG'
                },
            ]
        },
        {
            'code_parcours': 'MRMI',
            'nom_parcours': 'Master Recherche en Micro-électronique et Instrumentation',
            'type_formation': 'master',
            'ordre': 5,
            'specialites': [
                {
                    'nom': 'Licence en EEA, MIM (Électronique, Systèmes Embarqués, Métrologie) ou TIC (Réseaux et IoT)',
                    'abreviation': 'LEEA_MIM_TIC'
                },
                {
                    'nom': 'Licence en Électronique, Automatique ou Mesures et Instrumentation (ou équivalent)',
                    'abreviation': 'LEA_MI'
                },
                {
                    'nom': 'Réussite en 1ère année du cycle ingénieur (Électronique/Instrumentation) ou équivalent',
                    'abreviation': 'ING_1A_EI'
                },
            ]
        },
        # ============================================
        # CYCLE INGENIEUR
        # ============================================
        {
            'code_parcours': 'ING_APPLI',
            'nom_parcours': 'Ingénieur en Sciences Appliquées et Technologie: Informatique, Génie Logiciel',
            'type_formation': 'ingenieur',
            'ordre': 6,
            'specialites': [
                {
                    'nom': 'Génie Logiciel (Informatique)',
                    'abreviation': 'GL_INFO'
                },
                {
                    'nom': 'Licence en Informatique (ou équivalent)',
                    'abreviation': 'LI'
                },
            ]
        },
    ]
    
    created_count = 0
    updated_count = 0
    
    for data in parcours_data:
        obj, created = SpecialiteParcoursMapping.objects.update_or_create(
            code_parcours=data['code_parcours'],
            type_formation=data['type_formation'],
            defaults={
                'nom_parcours': data['nom_parcours'],
                'specialites': data['specialites'],
                'ordre': data['ordre'],
                'actif': True,
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Créé: {obj.nom_parcours}")
        else:
            updated_count += 1
            print(f"🔄 Mis à jour: {obj.nom_parcours}")
    
    print(f"\n📊 Résumé:")
    print(f"   - {created_count} parcours créés")
    print(f"   - {updated_count} parcours mis à jour")
    print(f"   - Total: {created_count + updated_count} parcours")
    
    return created_count, updated_count


if __name__ == '__main__':
    created, updated = init_specialites_parcours()
