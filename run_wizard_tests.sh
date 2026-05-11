#!/bin/bash
# Complete test of the wizard submission flow

set -e

echo "=========================================="
echo "🧪 Testing Wizard Submission Flow"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "\n${BLUE}1️⃣  Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Start services with Docker Compose
echo -e "\n${BLUE}2️⃣  Starting services with Docker Compose...${NC}"
cd isimm-platform
docker-compose down -v 2>/dev/null || true
docker-compose up -d

# Wait for services to be ready
echo -e "\n${BLUE}3️⃣  Waiting for services to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8001/api/auth/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Services are ready${NC}"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 1
done

# Run migrations
echo -e "\n${BLUE}4️⃣  Running migrations...${NC}"
docker-compose exec -T auth-service python manage.py migrate --noinput
docker-compose exec -T user-service python manage.py migrate --noinput
docker-compose exec -T candidature-service python manage.py migrate --noinput
echo -e "${GREEN}✅ Migrations completed${NC}"

# Create test user
echo -e "\n${BLUE}5️⃣  Creating test user...${NC}"
docker-compose exec -T auth-service python manage.py shell << EOF
from auth_app.models import User
user, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={'nom': 'Test', 'prenom': 'User', 'is_active': True}
)
user.set_password('TestPassword123')
user.save()
print(f"User: {user.email} ({'created' if created else 'already exists'})")
EOF
echo -e "${GREEN}✅ Test user ready${NC}"

# Run Python test
echo -e "\n${BLUE}6️⃣  Running wizard submission test...${NC}"
cd ..
python test_wizard_submission.py

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}=========================================="
    echo "✅ ALL TESTS PASSED!"
    echo "==========================================${NC}"
    exit 0
else
    echo -e "\n${RED}=========================================="
    echo "❌ TESTS FAILED"
    echo "==========================================${NC}"
    exit 1
fi
