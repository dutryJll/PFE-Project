import requests

BASE = 'http://localhost:8001/api/auth'

print("\n🧪 TEST 1: Connexion Admin")
print("=" * 50)

response = requests.post(f'{BASE}/login/', json={
    'email': 'admin@isimm.tn',
    'password': 'Admin2026!'
})

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Connexion réussie !")
    print(f"   Nom: {data['user']['first_name']} {data['user']['last_name']}")
    print(f"   Rôle: {data['user']['role']}")
    print(f"   Token: {data['access'][:50]}...")
else:
    print(f"❌ Erreur: {response.json()}")