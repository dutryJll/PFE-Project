#!/usr/bin/env python3
"""
Test preview-score endpoint to reproduce the 500 error
"""

import requests
import json
from typing import Dict, Any, Optional

# Configuration
AUTH_SERVICE_URL = "http://localhost:8001/api/auth"
CANDIDATURE_SERVICE_URL = "http://localhost:8003/api"

# Test credentials (modify based on your test users)
TEST_USER_EMAIL = "candidat@test.tn"
TEST_USER_PASSWORD = "TestPassword123!"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text: str):
    print(f"\n{BLUE}{'='*60}")
    print(f"{text}")
    print(f"{'='*60}{RESET}\n")

def print_success(text: str):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text: str):
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text: str):
    print(f"{YELLOW}⚠️  {text}{RESET}")

def print_info(text: str):
    print(f"{BLUE}ℹ️  {text}{RESET}")

class PreviewScoreTester:
    def __init__(self):
        self.auth_token: Optional[str] = None
        self.session = requests.Session()
        self.session.timeout = 10

    def login(self) -> bool:
        """Test login to get JWT token"""
        print_header("STEP 1: Login to Auth Service")
        
        try:
            print_info(f"Attempting login with: {TEST_USER_EMAIL}")
            response = self.session.post(
                f"{AUTH_SERVICE_URL}/login/",
                json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                }
            )
            
            print_info(f"Login response status: {response.status_code}")
            print_info(f"Login response body: {response.text[:500]}")
            
            if response.status_code != 200:
                print_error(f"Login failed with status {response.status_code}")
                return False
            
            data = response.json()
            self.auth_token = data.get('access') or data.get('token')
            
            if not self.auth_token:
                print_error("No auth token received")
                return False
            
            print_success(f"Login successful!")
            print_info(f"Token: {self.auth_token[:50]}...")
            return True
        
        except requests.exceptions.RequestException as e:
            print_error(f"Login request failed: {e}")
            return False

    def test_preview_score(self) -> bool:
        """Test preview-score endpoint with sample payload"""
        print_header("STEP 2: Test preview-score Endpoint")
        
        if not self.auth_token:
            print_error("No auth token available. Please login first.")
            return False
        
        # Minimal payload to test the endpoint
        payload = {
            "master_id": 1,  # Assuming master ID 1 exists
            "formation_code": "MPGL",
            "academic_data": {
                "common": {
                    "session": "Principale",
                    "redoublements": 0
                },
                "glDs": {
                    "moy1": 14.5,
                    "moy2": 15.0,
                    "moy3": 14.8
                }
            },
            "payload": {
                "common": {
                    "session": "Principale",
                    "redoublements": 0
                },
                "glDs": {
                    "moy1": 14.5,
                    "moy2": 15.0,
                    "moy3": 14.8
                }
            },
            "moyenneBac": 16.5,
            "noteMathBac": 18.0,
            "noteFrancaisBac": 15.5,
            "noteAnglaisBac": 16.0,
            "certificationB2": True,
            "moyenne1": 14.5,
            "moyenne2": 15.0,
            "moyenne3": 14.8,
            "session_reussite": "Principale"
        }
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        try:
            print_info(f"Posting to: {CANDIDATURE_SERVICE_URL}/candidatures/preview-score/")
            print_info(f"Payload: {json.dumps(payload, indent=2)[:500]}...")
            
            response = self.session.post(
                f"{CANDIDATURE_SERVICE_URL}/candidatures/preview-score/",
                json=payload,
                headers=headers
            )
            
            print_info(f"Response status: {response.status_code}")
            print_info(f"Response headers: {dict(response.headers)}")
            print_info(f"Response body: {response.text[:1000]}")
            
            if response.status_code == 200:
                print_success("Preview score calculation successful!")
                data = response.json()
                print_info(f"Score: {data.get('score')}")
                return True
            else:
                print_error(f"Preview score failed with status {response.status_code}")
                if response.status_code == 500:
                    print_error("🔴 INTERNAL SERVER ERROR - Stack trace should be in backend logs")
                return False
        
        except requests.exceptions.RequestException as e:
            print_error(f"Preview score request failed: {e}")
            return False

    def test_preview_score_no_auth(self) -> bool:
        """Test preview-score endpoint WITHOUT auth (since it's AllowAny)"""
        print_header("STEP 3: Test preview-score (No Auth - should work with AllowAny)")
        
        # Minimal payload
        payload = {
            "master_id": 1,
            "formation_code": "MPGL",
            "academic_data": {
                "common": {
                    "session": "Principale",
                    "redoublements": 0
                },
                "glDs": {
                    "moy1": 14.5,
                    "moy2": 15.0,
                    "moy3": 14.8
                }
            },
            "payload": {
                "common": {
                    "session": "Principale",
                    "redoublements": 0
                },
                "glDs": {
                    "moy1": 14.5,
                    "moy2": 15.0,
                    "moy3": 14.8
                }
            },
            "moyenneBac": 16.5,
            "noteMathBac": 18.0,
            "noteFrancaisBac": 15.5,
            "noteAnglaisBac": 16.0,
            "certificationB2": True
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        try:
            print_info(f"Posting to: {CANDIDATURE_SERVICE_URL}/candidatures/preview-score/")
            print_info("Note: No Authorization header (endpoint is AllowAny)")
            
            response = self.session.post(
                f"{CANDIDATURE_SERVICE_URL}/candidatures/preview-score/",
                json=payload,
                headers=headers
            )
            
            print_info(f"Response status: {response.status_code}")
            print_info(f"Response body: {response.text[:1000]}")
            
            if response.status_code == 200:
                print_success("Preview score calculation successful!")
                data = response.json()
                print_info(f"Score: {data.get('score')}")
                print_info(f"Full response: {json.dumps(data, indent=2)}")
                return True
            else:
                print_error(f"Preview score failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    print_error(f"Error response: {json.dumps(error_data, indent=2)}")
                except:
                    print_error(f"Error response: {response.text}")
                return False
        
        except requests.exceptions.RequestException as e:
            print_error(f"Preview score request failed: {e}")
            return False

if __name__ == "__main__":
    tester = PreviewScoreTester()
    
    # Try with auth first
    print("\n" + "="*60)
    print("SCENARIO 1: With Authentication")
    print("="*60)
    if tester.login():
        tester.test_preview_score()
    
    # Try without auth (since endpoint is AllowAny)
    print("\n" + "="*60)
    print("SCENARIO 2: Without Authentication (AllowAny)")
    print("="*60)
    tester.test_preview_score_no_auth()
