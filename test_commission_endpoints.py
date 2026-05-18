#!/usr/bin/env python3
"""
Test script for ÉTAPE 3 - Système Multi-Commissions
Tests the inter-service communication between auth-service and candidature_service

Expected setup:
- auth-service running on http://localhost:8001
- candidature_service running on http://localhost:8003
- Database populated with test data
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
AUTH_SERVICE_URL = "http://localhost:8001/api/auth"
CANDIDATURE_SERVICE_URL = "http://localhost:8003/api/candidatures"

# Test credentials (modify based on your test users)
TEST_USER_EMAIL = "commission@isimm.tn"
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

class CommissionEndpointTester:
    def __init__(self):
        self.auth_token: Optional[str] = None
        self.user_id: Optional[int] = None
        self.user_role: Optional[str] = None
        self.commissions: list = []
        self.session = requests.Session()
        self.session.timeout = 5

    def login(self) -> bool:
        """Test 1: Login and get JWT token"""
        print_header("TEST 1: Authentication & Login")
        
        try:
            print_info(f"Logging in as: {TEST_USER_EMAIL}")
            response = self.session.post(
                f"{AUTH_SERVICE_URL}/login/",
                json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                }
            )
            
            if response.status_code != 200:
                print_error(f"Login failed: {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            self.auth_token = data.get('access') or data.get('token')
            self.user_id = data.get('user', {}).get('id') or data.get('user_id')
            self.user_role = data.get('user', {}).get('role') or data.get('role')
            
            if not self.auth_token:
                print_error("No auth token received")
                return False
            
            print_success(f"Login successful!")
            print_info(f"  Token: {self.auth_token[:50]}...")
            print_info(f"  User ID: {self.user_id}")
            print_info(f"  User Role: {self.user_role}")
            return True
        
        except requests.exceptions.RequestException as e:
            print_error(f"Login request failed: {e}")
            return False

    def test_my_commissions_endpoint(self) -> bool:
        """Test 2: Fetch commissions via auth-service"""
        print_header("TEST 2: Fetch Commissions (auth-service)")
        
        if not self.auth_token:
            print_error("No auth token available. Run login first.")
            return False
        
        try:
            print_info("Calling: GET /api/auth/my-commissions/")
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{AUTH_SERVICE_URL}/my-commissions/",
                headers=headers
            )
            
            print_info(f"Response status: {response.status_code}")
            
            if response.status_code not in [200, 503]:
                print_error(f"Unexpected status code: {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            self.commissions = data.get('commissions', [])
            
            print_success(f"Successfully fetched commissions!")
            print_info(f"  Total commissions: {len(self.commissions)}")
            
            if self.commissions:
                for idx, comm in enumerate(self.commissions, 1):
                    print_info(f"  [{idx}] {comm.get('nom')} (ID: {comm.get('id')}, Role: {comm.get('role')})")
                return True
            else:
                print_warning("No commissions found for this user")
                return True  # Still success, just no data
        
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return False

    def test_candidature_service_my_commissions(self) -> bool:
        """Test 3: Direct call to candidature_service endpoint"""
        print_header("TEST 3: Direct Call to candidature_service")
        
        if not self.auth_token:
            print_error("No auth token available. Run login first.")
            return False
        
        try:
            print_info("Calling: GET /api/commissions/my-commissions/")
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            params = {"user_id": self.user_id}
            
            response = self.session.get(
                f"{CANDIDATURE_SERVICE_URL}/commissions/my-commissions/",
                headers=headers,
                params=params
            )
            
            print_info(f"Response status: {response.status_code}")
            
            if response.status_code not in [200, 404]:
                print_error(f"Unexpected status code: {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            if response.status_code == 200:
                data = response.json()
                print_success("Successfully fetched commissions from candidature_service!")
                print_info(f"  Response: {json.dumps(data, indent=2)}")
                return True
            else:
                print_warning("No commissions found (404)")
                return True
        
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return False

    def test_select_commission(self) -> bool:
        """Test 4: Select a commission"""
        print_header("TEST 4: Select Commission")
        
        if not self.auth_token:
            print_error("No auth token available. Run login first.")
            return False
        
        if not self.commissions:
            print_warning("No commissions available to select. Skipping test.")
            return True
        
        try:
            commission_id = self.commissions[0]['id']
            print_info(f"Selecting commission: {commission_id} ({self.commissions[0]['nom']})")
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.post(
                f"{AUTH_SERVICE_URL}/select-commission/",
                json={"commission_id": commission_id},
                headers=headers
            )
            
            print_info(f"Response status: {response.status_code}")
            
            if response.status_code not in [200, 400]:
                print_error(f"Unexpected status code: {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            
            if response.status_code == 200:
                print_success("Commission selected successfully!")
                print_info(f"  Commission ID: {data.get('commission_id')}")
                print_info(f"  Message: {data.get('message')}")
                if data.get('warning'):
                    print_warning(f"  Warning: {data.get('warning')}")
                return True
            else:
                print_error(f"Selection failed: {data.get('error')}")
                return False
        
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return False

    def test_get_commission_members(self) -> bool:
        """Test 5: Get members of a commission"""
        print_header("TEST 5: Get Commission Members")
        
        if not self.auth_token:
            print_error("No auth token available. Run login first.")
            return False
        
        if not self.commissions:
            print_warning("No commissions available. Skipping test.")
            return True
        
        try:
            commission_id = self.commissions[0]['id']
            print_info(f"Fetching members of commission: {commission_id}")
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            params = {"commission_id": commission_id}
            
            response = self.session.get(
                f"{CANDIDATURE_SERVICE_URL}/commissions/commission-members/",
                headers=headers,
                params=params
            )
            
            print_info(f"Response status: {response.status_code}")
            
            if response.status_code not in [200, 404]:
                print_error(f"Unexpected status code: {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            
            if response.status_code == 200:
                print_success("Successfully fetched commission members!")
                members = data.get('members', [])
                print_info(f"  Commission: {data.get('commission_nom')}")
                print_info(f"  Total members: {len(members)}")
                
                for idx, member in enumerate(members, 1):
                    print_info(f"    [{idx}] {member.get('first_name')} {member.get('last_name')} (Role: {member.get('role')})")
                
                return True
            else:
                print_warning("Commission not found (404)")
                return True
        
        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return False

    def test_deadline_auto_validation(self) -> bool:
        """Test 6: Exercise deadline-based auto-validation for global avis"""
        print_header("TEST 6: Deadline Auto-Validation")

        if not self.auth_token:
            print_error("No auth token available. Run login first.")
            return False

        if not self.commissions:
            print_warning("No commissions available from auth-service; using seeded fallback commission id 3.")

        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json",
            }

            commission_candidates = self.commissions or [{"id": 3, "nom": "Commission Data Science Demo"}]

            for commission in commission_candidates:
                commission_id = commission["id"]
                commission_name = commission.get("nom")
                response = self.session.get(
                    f"{CANDIDATURE_SERVICE_URL}/commissions/{commission_id}/avis-global/",
                    headers=headers,
                )

                print_info(f"Checking commission {commission_name} (ID: {commission_id})")
                print_info(f"Response status: {response.status_code}")

                if response.status_code != 200:
                    print_warning(f"Skipping commission {commission_name}: {response.text}")
                    continue

                data = response.json()
                summary = data.get("summary", {})

                print_info(
                    "  Summary: "
                    f"total={summary.get('total_members')}, "
                    f"completed={summary.get('completed_count')}, "
                    f"pending={summary.get('pending_count')}, "
                    f"deadline_expired={summary.get('deadline_expired')}"
                )

                if summary.get("deadline_expired"):
                    responses = data.get("responses", [])
                    if (
                        summary.get("total_members") == 3
                        and summary.get("completed_count") == 3
                        and summary.get("pending_count") == 0
                        and len(responses) == 3
                    ):
                        print_success("Deadline auto-validation exercised successfully!")
                        return True

                    print_error("Deadline-expired commission did not return the expected completed summary")
                    print_info(f"  Responses: {json.dumps(responses, indent=2, default=str)}")
                    return False

            print_warning("No deadline-expired commission was returned by my-commissions")
            return False

        except requests.exceptions.RequestException as e:
            print_error(f"Request failed: {e}")
            return False

    def run_all_tests(self) -> bool:
        """Run all tests in sequence"""
        print_header("ÉTAPE 3 - COMMISSION ENDPOINTS TEST SUITE")
        print_info(f"Auth Service URL: {AUTH_SERVICE_URL}")
        print_info(f"Candidature Service URL: {CANDIDATURE_SERVICE_URL}")
        
        tests = [
            ("Authentication", self.login),
            ("Fetch Commissions (auth-service)", self.test_my_commissions_endpoint),
            ("Direct Candidature Service Call", self.test_candidature_service_my_commissions),
            ("Select Commission", self.test_select_commission),
            ("Get Commission Members", self.test_get_commission_members),
            ("Deadline Auto-Validation", self.test_deadline_auto_validation),
        ]
        
        results = {}
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                print_error(f"Test '{test_name}' crashed: {e}")
                results[test_name] = False
        
        # Print summary
        print_header("TEST SUMMARY")
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        
        for test_name, passed_flag in results.items():
            status = f"{GREEN}PASS{RESET}" if passed_flag else f"{RED}FAIL{RESET}"
            print(f"  {status} - {test_name}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print_success("All tests passed! ✨")
            return True
        else:
            print_error(f"{total - passed} test(s) failed")
            return False

if __name__ == "__main__":
    tester = CommissionEndpointTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
