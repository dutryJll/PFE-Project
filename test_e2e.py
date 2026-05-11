"""
End-to-end integration test for candidate dashboard.
Tests: login, preview-score, create candidature, WebSocket connection.
"""
import asyncio
import json
from playwright.async_api import async_playwright

async def test_e2e():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            base_url="http://localhost:4200",
            ignore_https_errors=True
        )
        page = await context.new_page()
        
        # Track network requests
        requests = []
        responses = {}
        
        async def on_response(response):
            url = response.url
            status = response.status
            try:
                body = await response.text() if response.status < 500 else None
                responses[url] = {'status': status, 'body': body[:200] if body else ''}
            except:
                pass
        
        page.on("response", on_response)
        
        print("=" * 60)
        print("E2E TEST: Candidate Dashboard Integration")
        print("=" * 60)
        
        # 1. Load homepage
        print("\n[1] Loading homepage...")
        await page.goto("/", wait_until="networkidle")
        print("✓ Homepage loaded")
        
        # 2. Check localStorage and environment
        print("\n[2] Checking frontend environment...")
        env = await page.evaluate("""() => {
            const env = window.__ENVIRONMENT__ || {};
            return {
                apiUrl: env.candidatureServiceUrl || localStorage.getItem('api_url'),
                hasAccess: localStorage.getItem('access_token') ? 'yes' : 'no'
            };
        }""")
        print(f"  API URL: {env.get('apiUrl', 'NOT SET')}")
        print(f"  Has Access Token: {env.get('hasAccess', 'no')}")
        
        # 3. Test login (if not already logged in)
        if env.get('hasAccess') != 'yes':
            print("\n[3] Testing login...")
            try:
                await page.click('a:has-text("Connexion")', timeout=5000)
                print("✓ Navigated to login page")
            except:
                await page.goto("/auth/login", wait_until="networkidle")
                print("✓ Navigated to login page")
            
            # Fill login form
            await page.fill('input[name="email"]', 'copilot_test_20260510005122@example.com')
            await page.fill('input[name="password"]', 'Test12345!')
            await page.click('button[type="submit"]')
            await page.wait_for_url("**/candidat/**", timeout=10000)
            print("✓ Login successful")
        
        # 4. Test preview-score endpoint
        print("\n[4] Testing preview-score endpoint...")
        access_token = await page.evaluate("() => localStorage.getItem('access_token')")
        try:
            preview_resp = await page.evaluate("""async (token) => {
                const resp = await fetch('http://localhost:8003/api/candidatures/preview-score/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        master_id: 1,
                        moyenne_generale: 15.5,
                        moyenne_specialite: 14.0,
                        note_pfe: 16.0
                    })
                });
                const data = await resp.json();
                return { status: resp.status, data: data };
            }""", access_token)
            
            if preview_resp['status'] == 200:
                score = preview_resp['data'].get('score')
                print(f"✓ preview-score returned: score={score}")
            else:
                print(f"✗ preview-score failed: {preview_resp['status']}")
        except Exception as e:
            print(f"✗ preview-score error: {e}")
        
        # 5. Test create candidature
        print("\n[5] Testing create candidature...")
        try:
            create_resp = await page.evaluate("""async (token) => {
                const resp = await fetch('http://localhost:8003/api/candidatures/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ master_id: 1 })
                });
                const data = await resp.json();
                return { status: resp.status, data: data };
            }""", access_token)
            
            if create_resp['status'] == 201:
                cand_id = create_resp['data'].get('id')
                cand_num = create_resp['data'].get('numero')
                print(f"✓ Candidature created: id={cand_id}, numero={cand_num}")
            else:
                print(f"✗ Create failed: {create_resp['status']}")
        except Exception as e:
            print(f"✗ Create error: {e}")
        
        # 6. Test WebSocket connection
        print("\n[6] Testing WebSocket connection...")
        try:
            ws_result = await page.evaluate("""async () => {
                return new Promise((resolve) => {
                    const ws = new WebSocket('ws://localhost:8003/ws/candidatures/');
                    const timeout = setTimeout(() => {
                        ws.close();
                        resolve({ connected: false, reason: 'timeout' });
                    }, 3000);
                    
                    ws.onopen = () => {
                        clearTimeout(timeout);
                        ws.send(JSON.stringify({ type: 'test' }));
                        setTimeout(() => ws.close(), 500);
                        resolve({ connected: true });
                    };
                    
                    ws.onerror = (e) => {
                        clearTimeout(timeout);
                        resolve({ connected: false, reason: String(e) });
                    };
                });
            }""")
            
            if ws_result['connected']:
                print("✓ WebSocket connection successful")
            else:
                print(f"✗ WebSocket failed: {ws_result.get('reason', 'unknown')}")
        except Exception as e:
            print(f"✗ WebSocket error: {e}")
        
        # 7. Test candidate-live-metrics
        print("\n[7] Testing candidate-live-metrics endpoint...")
        try:
            metrics_resp = await page.evaluate("""async (token) => {
                const resp = await fetch('http://localhost:8003/api/candidatures/candidate-live-metrics/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await resp.json();
                return { status: resp.status, data: data };
            }""", access_token)
            
            if metrics_resp['status'] == 200:
                count = len(metrics_resp['data'].get('data', []))
                print(f"✓ candidate-live-metrics returned {count} candidatures")
            else:
                print(f"✗ candidate-live-metrics failed: {metrics_resp['status']}")
        except Exception as e:
            print(f"✗ candidate-live-metrics error: {e}")
        
        print("\n" + "=" * 60)
        print("E2E TEST COMPLETE")
        print("=" * 60)
        
        await browser.close()

# Run the test
if __name__ == "__main__":
    asyncio.run(test_e2e())
