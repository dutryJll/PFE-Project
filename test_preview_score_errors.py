#!/usr/bin/env python3
"""
Test preview-score endpoint with various error scenarios
"""

import requests
import json

CANDIDATURE_SERVICE_URL = "http://localhost:8003/api"

def print_header(text: str):
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")

def test_invalid_master_id():
    """Test with non-existent master_id"""
    print_header("TEST 1: Invalid Master ID (999999)")
    
    payload = {
        "master_id": 999999,  # Non-existent
        "formation_code": "MPGL",
        "academic_data": {
            "common": {"session": "Principale", "redoublements": 0},
            "glDs": {"moy1": 14.5, "moy2": 15.0, "moy3": 14.8}
        }
    }
    
    try:
        response = requests.post(
            f"{CANDIDATURE_SERVICE_URL}/candidatures/preview-score/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_missing_master_id():
    """Test with missing master_id"""
    print_header("TEST 2: Missing Master ID")
    
    payload = {
        "formation_code": "MPGL",
        "academic_data": {
            "common": {"session": "Principale", "redoublements": 0},
            "glDs": {"moy1": 14.5, "moy2": 15.0, "moy3": 14.8}
        }
    }
    
    try:
        response = requests.post(
            f"{CANDIDATURE_SERVICE_URL}/candidatures/preview-score/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_invalid_academic_data():
    """Test with malformed academic_data"""
    print_header("TEST 3: Malformed academic_data (not a dict)")
    
    payload = {
        "master_id": 1,
        "formation_code": "MPGL",
        "academic_data": "invalid_string_instead_of_dict"
    }
    
    try:
        response = requests.post(
            f"{CANDIDATURE_SERVICE_URL}/candidatures/preview-score/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_invalid_numeric_values():
    """Test with invalid numeric values"""
    print_header("TEST 4: Invalid numeric values in academic_data")
    
    payload = {
        "master_id": 1,
        "formation_code": "MPGL",
        "academic_data": {
            "common": {"session": "Principale", "redoublements": "invalid_not_a_number"},
            "glDs": {"moy1": "abc", "moy2": 15.0, "moy3": 14.8}
        }
    }
    
    try:
        response = requests.post(
            f"{CANDIDATURE_SERVICE_URL}/candidatures/preview-score/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_valid_payload():
    """Test with valid payload to confirm success"""
    print_header("TEST 5: Valid Payload (should succeed)")
    
    payload = {
        "master_id": 1,
        "formation_code": "MPGL",
        "academic_data": {
            "common": {"session": "Principale", "redoublements": 0},
            "glDs": {"moy1": 14.5, "moy2": 15.0, "moy3": 14.8}
        }
    }
    
    try:
        response = requests.post(
            f"{CANDIDATURE_SERVICE_URL}/candidatures/preview-score/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print(f"✅ SUCCESS - Score calculated: {response.json().get('score')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("\n" + "="*70)
    print("TESTING PREVIEW-SCORE ENDPOINT ERROR SCENARIOS")
    print("="*70)
    
    test_invalid_master_id()
    test_missing_master_id()
    test_invalid_academic_data()
    test_invalid_numeric_values()
    test_valid_payload()
    
    print("\n" + "="*70)
    print("TESTS COMPLETED - Check backend console for stack traces")
    print("="*70 + "\n")
