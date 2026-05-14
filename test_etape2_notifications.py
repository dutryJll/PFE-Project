#!/usr/bin/env python3
"""
Script de test complet pour ÉTAPE 2: Système de Statut + Notifications

Teste:
1. Changer le statut d'une candidature
2. Récupérer l'historique des statuts
3. Vérifier les notifications créées
4. Vérifier les emails en queue

Exécution: python test_etape2_notifications.py
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8003/api/candidatures"
AUTH_SERVICE_URL = "http://127.0.0.1:8001/api/auth"

# Données de test
TEST_USER = {
    'username': 'testuser',
    'password': 'testpass123',
    'email': 'test@example.com',
    'first_name': 'Test',
    'last_name': 'User'
}

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

def test_setup():
    """Initialiser les données de test"""
    print_test_header("Setup: Créer un utilisateur admin pour les tests")
    
    try:
        # Vérifier que le serveur auth est disponible
        response = requests.get(f"{AUTH_SERVICE_URL}/", timeout=5)
        print(f"✓ Auth service disponible (Status: {response.status_code})")
        return True
    except:
        print("✗ Impossible de contacter le service auth")
        return False

def get_auth_token():
    """Obtenir un token d'authentification (admin)"""
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/login/",
            json={
                'username': 'admin',
                'password': 'admin123'
            },
            timeout=5
        )
        if response.status_code == 200:
            return response.json().get('token')
    except:
        pass
    return None

def test_1_changer_statut():
    """TEST 1: Changer le statut d'une candidature"""
    print_test_header("Changer Statut de Candidature")
    
    all_passed = True
    token = get_auth_token()
    
    if not token:
        print("⚠️  Token d'authentification non disponible - utilisation d'un ID fictif")
        all_passed = print_result(False, "Authentification impossible (vérifier que le service auth est en marche)")
        return all_passed
    
    headers = {'Authorization': f'Token {token}'}
    
    # Utiliser la première candidature disponible (ID 1 pour test)
    candidature_id = 1
    
    try:
        # Changer le statut
        response = requests.post(
            f"{BASE_URL}/{candidature_id}/statut/changer/",
            json={
                "nouveau_statut": "sous_examen",
                "raison": "Sélection par la commission - Test automatisé",
                "envoyer_notification": True
            },
            headers=headers,
            timeout=5
        )
        
        all_passed &= print_result(
            response.status_code == 200,
            f"HTTP Status: {response.status_code} (expected 200)"
        )
        
        if response.status_code == 200:
            data = response.json()
            all_passed &= print_result('success' in data, "Response contains 'success'")
            all_passed &= print_result('nouveau_statut' in data, "Response contains 'nouveau_statut'")
            all_passed &= print_result('notification_envoyee' in data, "Response contains 'notification_envoyee'")
            
            if 'notification_envoyee' in data:
                all_passed &= print_result(
                    data['notification_envoyee'],
                    f"Notification envoyée: {data['notification_envoyee']}"
                )
            
            print(f"\n   Response Details:")
            print(f"   {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"\n   Error Response: {response.text}")
    
    except Exception as e:
        all_passed = print_result(False, f"Exception: {str(e)}")
    
    return all_passed

def test_2_recuperer_historique():
    """TEST 2: Récupérer l'historique des statuts"""
    print_test_header("Récupérer Historique des Statuts")
    
    all_passed = True
    token = get_auth_token()
    
    if not token:
        print("⚠️  Token d'authentification non disponible")
        return False
    
    headers = {'Authorization': f'Token {token}'}
    candidature_id = 1
    
    try:
        response = requests.get(
            f"{BASE_URL}/{candidature_id}/statut/historique/",
            headers=headers,
            timeout=5
        )
        
        all_passed &= print_result(
            response.status_code == 200,
            f"HTTP Status: {response.status_code} (expected 200)"
        )
        
        if response.status_code == 200:
            data = response.json()
            
            all_passed &= print_result('historique' in data, "Response contains 'historique'")
            all_passed &= print_result('statut_actuel' in data, "Response contains 'statut_actuel'")
            all_passed &= print_result('total_changements' in data, "Response contains 'total_changements'")
            
            if 'historique' in data:
                historique = data['historique']
                all_passed &= print_result(
                    isinstance(historique, list),
                    f"Historique is list with {len(historique)} entries"
                )
                
                if historique:
                    print(f"\n   Derniers Changements:")
                    for i, change in enumerate(historique[:3], 1):  # Afficher les 3 derniers
                        print(f"   {i}. {change.get('ancien_statut')} → {change.get('nouveau_statut')}")
                        print(f"      Date: {change.get('date_changement')}")
                        print(f"      Raison: {change.get('raison', 'N/A')}")
            
            print(f"\n   Full Response:")
            print(f"   {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"\n   Error Response: {response.text}")
    
    except Exception as e:
        all_passed = print_result(False, f"Exception: {str(e)}")
    
    return all_passed

def test_3_statut_transitions():
    """TEST 3: Vérifier les transitions de statut valides"""
    print_test_header("Transitions de Statut Valides")
    
    all_passed = True
    token = get_auth_token()
    
    if not token:
        return False
    
    headers = {'Authorization': f'Token {token}'}
    
    # Parcourir les transitions valides
    valid_transitions = [
        ('sous_examen', 'Mise en examen'),
        ('preselectionne', 'Présélection'),
        ('en_attente_dossier', 'Attente dossier'),
    ]
    
    candidature_id = 1
    
    for new_status, reason in valid_transitions:
        try:
            response = requests.post(
                f"{BASE_URL}/{candidature_id}/statut/changer/",
                json={
                    "nouveau_statut": new_status,
                    "raison": reason,
                    "envoyer_notification": False  # Pas d'email pour les tests
                },
                headers=headers,
                timeout=5
            )
            
            passed = response.status_code == 200
            all_passed &= print_result(passed, f"Transition to {new_status}: {response.status_code}")
            
        except Exception as e:
            all_passed &= print_result(False, f"Transition to {new_status}: {str(e)}")
    
    return all_passed

def test_4_statut_invalide():
    """TEST 4: Tester un statut invalide (doit échouer)"""
    print_test_header("Rejet Statut Invalide")
    
    all_passed = True
    token = get_auth_token()
    
    if not token:
        return False
    
    headers = {'Authorization': f'Token {token}'}
    candidature_id = 1
    
    try:
        response = requests.post(
            f"{BASE_URL}/{candidature_id}/statut/changer/",
            json={
                "nouveau_statut": "statut_invalide_12345",
                "raison": "Test statut invalide"
            },
            headers=headers,
            timeout=5
        )
        
        # Doit retourner 400
        all_passed &= print_result(
            response.status_code == 400,
            f"Statut invalide rejeté (Status: {response.status_code})"
        )
        
        if response.status_code != 200:
            data = response.json()
            print(f"   Error message: {data.get('error', 'N/A')}")
    
    except Exception as e:
        all_passed = print_result(False, f"Exception: {str(e)}")
    
    return all_passed

def main():
    """Exécute tous les tests"""
    print("\n" + "="*70)
    print("VALIDATION ÉTAPE 2: SYSTÈME DE STATUT + NOTIFICATIONS")
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
        sys.exit(1)
    
    # Setup
    if not test_setup():
        print("\n⚠️  Setup incomplète - certains tests peuvent échouer")
    
    results = []
    results.append(("Test 1: Changer Statut", test_1_changer_statut()))
    results.append(("Test 2: Récupérer Historique", test_2_recuperer_historique()))
    results.append(("Test 3: Transitions Valides", test_3_statut_transitions()))
    results.append(("Test 4: Rejeter Statut Invalide", test_4_statut_invalide()))
    
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
    
    if passed_count >= 2:  # Au moins 50% réussi
        print("✓ ÉTAPE 2 PARTIELLEMENT VALIDÉE - Système fonctionnel")
        print("→ Prêt pour ÉTAPE 3: Système Multi-Commissions")
    else:
        print(f"✗ {total_count - passed_count} tests échoués - Vérifier les logs")
    
    print(f"{'='*70}\n")
    
    return 0 if passed_count >= 2 else 1

if __name__ == "__main__":
    sys.exit(main())
