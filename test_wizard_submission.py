#!/usr/bin/env python
"""
Test wizard submission flow:
1. Login
2. Fetch an offer
3. Calculate score
4. Submit candidature with score
"""

import requests
import json
import time
from typing import Optional

BASE_URL = "http://localhost"
AUTH_SERVICE = "http://localhost:8001"
CANDIDATURE_SERVICE = "http://localhost:8003"

def test_wizard_flow():
    print("=" * 80)
    print("🧪 Testing Wizard Submission Flow")
    print("=" * 80)
    
    # 1. Login
    print("\n1️⃣  Logging in...")
    login_payload = {
        "email": "test@example.com",
        "password": "TestPassword123"
    }
    
    login_response = requests.post(
        f"{AUTH_SERVICE}/api/auth/login/",
        json=login_payload
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return False
    
    token = login_response.json().get('access')
    print(f"✅ Login successful. Token: {token[:20]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Get offers
    print("\n2️⃣  Fetching offers...")
    offers_response = requests.get(
        f"{CANDIDATURE_SERVICE}/api/candidature/offres/",
        headers=headers
    )
    
    if offers_response.status_code != 200:
        print(f"❌ Failed to fetch offers: {offers_response.status_code}")
        print(offers_response.text)
        return False
    
    offers = offers_response.json()
    if not offers or len(offers) == 0:
        print("❌ No offers found")
        return False
    
    offer = offers[0]
    print(f"✅ Fetched {len(offers)} offers. Using: {offer.get('titre', 'Unknown')}")
    
    # 3. Calculate score
    print("\n3️⃣  Calculating score...")
    
    score_payload = {
        "master_id": offer.get('master_id') or offer.get('id'),
        "formation_code": offer.get('code', '').upper(),
        "academic_data": {
            "common": {
                "session": "Main",
                "redoublements": 0
            },
            "glDs": {
                "moy1": 15.5,
                "moy2": 16.0,
                "moy3": 14.5
            }
        },
        "moyenneBac": 15.5,
        "noteMathBac": 16.0,
        "noteFrancaisBac": 15.5,
        "noteAnglaisBac": 14.5,
        "moyenne1": 15.5,
        "moyenne2": 16.0,
        "moyenne3": 14.5,
    }
    
    print(f"  Payload: {json.dumps(score_payload, indent=2)}")
    
    score_response = requests.post(
        f"{CANDIDATURE_SERVICE}/api/candidature/preview-score/",
        json=score_payload,
        headers=headers
    )
    
    if score_response.status_code != 200:
        print(f"❌ Score calculation failed: {score_response.status_code}")
        print(score_response.text)
        return False
    
    score_data = score_response.json()
    score = score_data.get('score')
    print(f"✅ Score calculated: {score}")
    
    # 4. Submit candidature
    print("\n4️⃣  Submitting candidature...")
    
    submit_payload = {
        "offre_id": offer.get('id'),
        "nature_candidature": "Étudiant ISIMM",
        "academic_data": score_payload.get('academic_data'),
        "formation_code": score_payload.get('formation_code'),
        "score_previsualisation": score,
    }
    
    submit_response = requests.post(
        f"{CANDIDATURE_SERVICE}/api/candidature/create/",
        json=submit_payload,
        headers=headers
    )
    
    if submit_response.status_code not in [200, 201]:
        print(f"❌ Submission failed: {submit_response.status_code}")
        print(submit_response.text)
        return False
    
    result = submit_response.json()
    print(f"✅ Submission successful!")
    print(f"  Candidature ID: {result.get('id')}")
    print(f"  Status: {result.get('status')}")
    
    print("\n" + "=" * 80)
    print("✅ All tests passed!")
    print("=" * 80)
    
    return True

if __name__ == "__main__":
    try:
        success = test_wizard_flow()
        exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
