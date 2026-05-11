#!/bin/bash
# Script de démarrage rapide pour la soutenance
# Usage: bash start_pour_soutenance.sh

set -e

echo "🎓 DÉMARRAGE PLATEFORME ISIMM POUR SOUTENANCE"
echo "=============================================="
echo ""

# === BACKEND ===
echo "1️⃣  Démarrage Backend (candidature_service)"
echo "-----------------------------------------"
cd "C:\Users\HP\Desktop\PFE\isimm-platform\services\candidature_service"

echo "✓ Checking Python environment..."
source venv/Scripts/activate

echo "✓ Applying migrations..."
python manage.py migrate

echo "✓ Initializing criteria..."
python manage.py init_criteres

echo "✓ Starting Django server..."
python manage.py runserver 8003 &
BACKEND_PID=$!

echo "✅ Backend started (PID=$BACKEND_PID)"
echo "   Available at: http://127.0.0.1:8003"
echo ""

# === FRONTEND ===
echo "2️⃣  Démarrage Frontend (Angular)"
echo "-----------------------------------"
cd "C:\Users\HP\Desktop\PFE\isimm-platform\frontend"

echo "✓ Starting Angular dev server..."
npm start &
FRONTEND_PID=$!

echo "✅ Frontend started (PID=$FRONTEND_PID)"
echo "   Available at: http://localhost:4200"
echo ""

# === VERIFICATION ===
echo "3️⃣  Vérification du système"
echo "----------------------------"
sleep 5  # Wait for servers to start

echo "✓ Testing backend..."
curl -s http://127.0.0.1:8003/api/candidatures/parcours/ > /dev/null && \
  echo "   ✅ Backend responding" || \
  echo "   ❌ Backend not responding"

echo ""
echo "🎯 PLATEFORME PRÊTE POUR LA SOUTENANCE"
echo "========================================"
echo ""
echo "Admin:"
echo "  - URL: http://localhost:4200/admin/parcours-master"
echo "  - Action: CRUD Parcours Master"
echo ""
echo "Responsable:"
echo "  - URL: http://localhost:4200/responsable/parcours"
echo "  - Action: Éditer les coefficients"
echo ""
echo "API:"
echo "  - Base: http://127.0.0.1:8003/api/candidatures/"
echo "  - Parcours: GET/POST/PATCH/DELETE /parcours/"
echo ""
echo "Logs:"
echo "  - Backend: Voir terminal service"
echo "  - Frontend: Voir npm console"
echo ""
echo "Pour arrêter:"
echo "  - kill $BACKEND_PID  (Backend)"
echo "  - kill $FRONTEND_PID (Frontend)"
echo ""

wait
