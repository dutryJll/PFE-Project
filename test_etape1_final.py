#!/usr/bin/env python3
"""
Test de validation COMPLÈTE pour ÉTAPE 1: Spécialités Dynamiques

Tests tous les endpoints créés et vérifie que les données sont correctement stockées et exposées.
Exécution: python test_etape1_final.py
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8003/api/candidatures"

def print_test_header(test_name):
    """Affiche l'en-tête du test"""
    print(f"\n{'='*70}")
    print(f"TEST: {test_name}")
    print(f"{'='*70}")

def print_result(passed, message):
    """Affiche le résultat du test"""
    status = "✓ PASSED" if passed else "✗ FAILED"
    symbol = "✓" if passed else "✗"
    print(f"{symbol} {message}")
    return passed

def test_1_get_specialites_by_code():
    """TEST 1: Récupérer les spécialités d'un parcours par code"""
    print_test_header("Get Specialites By Parcours Code")
    
    all_passed = True
    parcours_code = "MPDS"
    url = f"{BASE_URL}/specialites/by-parcours/?parcours_code={parcours_code}"
    
    try:
        response = requests.get(url, timeout=5)
        all_passed &= print_result(response.status_code == 200, f"HTTP Status: {response.status_code} (expected 200)")
        
        if response.status_code == 200:
            data = response.json()
            
            # Vérifications structurelles
            all_passed &= print_result('code_parcours' in data, "Response contains 'code_parcours'")
            all_passed &= print_result('nom_parcours' in data, "Response contains 'nom_parcours'")
            all_passed &= print_result('specialites' in data, "Response contains 'specialites'")
            all_passed &= print_result('type_formation' in data, "Response contains 'type_formation'")
            
            if 'specialites' in data:
                specs = data['specialites']
                all_passed &= print_result(isinstance(specs, list), f"Specialites is a list (found: {type(specs).__name__})")
                all_passed &= print_result(len(specs) > 0, f"Specialites list is not empty (found: {len(specs)} items)")
                
                if specs:
                    first = specs[0]
                    all_passed &= print_result('nom' in first, "First specialty has 'nom' field")
                    all_passed &= print_result('abreviation' in first, "First specialty has 'abreviation' field")
                    
                    print(f"\n   Sample Data (First Specialty):")
                    print(f"   - Nom: {first.get('nom')}")
                    print(f"   - Abreviation: {first.get('abreviation')}")
            
            print(f"\n   Full Response:")
            print(f"   {json.dumps(data, ensure_ascii=False, indent=2)}")
    
    except Exception as e:
        all_passed = print_result(False, f"Exception: {str(e)}")
    
    return all_passed

def test_2_list_all_parcours():
    """TEST 2: Lister tous les parcours"""
    print_test_header("List All Parcours")
    
    all_passed = True
    url = f"{BASE_URL}/all-parcours/"
    
    try:
        response = requests.get(url, timeout=5)
        all_passed &= print_result(response.status_code == 200, f"HTTP Status: {response.status_code} (expected 200)")
        
        if response.status_code == 200:
            data = response.json()
            all_passed &= print_result(isinstance(data, list), f"Response is a list (found: {type(data).__name__})")
            all_passed &= print_result(len(data) >= 6, f"Response contains at least 6 parcours (found: {len(data)})")
            
            if data:
                print(f"\n   Parcours Found:")
                for parcours in data:
                    print(f"   - {parcours.get('code_parcours')}: {parcours.get('nom_parcours')} ({parcours.get('nombre_specialites')} specialites)")
    
    except Exception as e:
        all_passed = print_result(False, f"Exception: {str(e)}")
    
    return all_passed

def test_3_filter_by_type():
    """TEST 3: Filtrer les parcours par type de formation"""
    print_test_header("Filter Parcours By Type Formation")
    
    all_passed = True
    url = f"{BASE_URL}/all-parcours/?type_formation=master"
    
    try:
        response = requests.get(url, timeout=5)
        all_passed &= print_result(response.status_code == 200, f"HTTP Status: {response.status_code} (expected 200)")
        
        if response.status_code == 200:
            data = response.json()
            master_count = len([p for p in data if p.get('type_formation') == 'master'])
            all_passed &= print_result(master_count > 0, f"Found {master_count} master parcours")
            
            # Vérifier que tous les parcours retournés sont masters
            all_masters = all(p.get('type_formation') == 'master' for p in data)
            all_passed &= print_result(all_masters, "All returned parcours are 'master' type")
            
            print(f"\n   Master Parcours:")
            for parcours in data:
                print(f"   - {parcours.get('code_parcours')}: {parcours.get('nom_parcours')}")
    
    except Exception as e:
        all_passed = print_result(False, f"Exception: {str(e)}")
    
    return all_passed

def test_4_verify_all_have_specialites():
    """TEST 4: Vérifier que tous les parcours ont des spécialités"""
    print_test_header("Verify All Parcours Have Specialites")
    
    all_passed = True
    url = f"{BASE_URL}/all-parcours/"
    
    try:
        response = requests.get(url, timeout=5)
        all_passed &= print_result(response.status_code == 200, f"HTTP Status: {response.status_code} (expected 200)")
        
        if response.status_code == 200:
            data = response.json()
            
            parcours_sans_specs = [p for p in data if not p.get('specialites') or len(p.get('specialites', [])) == 0]
            all_passed &= print_result(
                len(parcours_sans_specs) == 0,
                f"All parcours have specialites ({len(data)} with specs, {len(parcours_sans_specs)} without)"
            )
            
            # Statistiques
            total_specs = sum(p.get('nombre_specialites', 0) for p in data)
            avg_specs = total_specs / len(data) if data else 0
            
            print(f"\n   Statistics:")
            print(f"   - Total Parcours: {len(data)}")
            print(f"   - Total Specialites: {total_specs}")
            print(f"   - Average per Parcours: {avg_specs:.1f}")
            
            if parcours_sans_specs:
                print(f"\n   ⚠ Parcours sans spécialités:")
                for p in parcours_sans_specs:
                    print(f"   - {p.get('code_parcours')}")
    
    except Exception as e:
        all_passed = print_result(False, f"Exception: {str(e)}")
    
    return all_passed

def main():
    """Exécute tous les tests"""
    print("\n" + "="*70)
    print("VALIDATION ÉTAPE 1: SPÉCIALITÉS DYNAMIQUES")
    print("="*70)
    print(f"Backend URL: {BASE_URL}")
    
    # Vérification préalable que le serveur est disponible
    try:
        response = requests.get(f"{BASE_URL}/masters/", timeout=5)
        if response.status_code != 200:
            print(f"\n❌ Erreur: Le serveur semble mal configuré (Status: {response.status_code})")
            sys.exit(1)
    except:
        print(f"\n❌ Erreur: Impossible de contacter le serveur à {BASE_URL}")
        print("Assurez-vous que le serveur candidature_service est démarré sur le port 8003")
        sys.exit(1)
    
    results = []
    results.append(("Test 1: Get Specialites By Code", test_1_get_specialites_by_code()))
    results.append(("Test 2: List All Parcours", test_2_list_all_parcours()))
    results.append(("Test 3: Filter By Type", test_3_filter_by_type()))
    results.append(("Test 4: Verify All Have Specialites", test_4_verify_all_have_specialites()))
    
    # Résumé
    print(f"\n{'='*70}")
    print("RÉSUMÉ DES TESTS")
    print(f"{'='*70}")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for test_name, passed in results:
        symbol = "✓" if passed else "✗"
        print(f"{symbol} {test_name}")
    
    print(f"\n{'='*70}")
    print(f"TOTAL: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("✓ ÉTAPE 1 VALIDATION COMPLÈTE - SUCCÈS!")
        print("→ Prêt pour ÉTAPE 2: Système de Statut + Notifications")
    else:
        print(f"✗ {total_count - passed_count} tests échoués - Correction requise")
    
    print(f"{'='*70}\n")
    
    return 0 if passed_count == total_count else 1

if __name__ == "__main__":
    sys.exit(main())
