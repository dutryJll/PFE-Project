# ISIMM Platform - Gateway Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites

- Docker & Docker Compose installed
- Ports 80, 443, 5432 available (or adjust docker-compose.yml)

### Step 1: Setup Environment

```bash
cp .env.example .env
# Edit .env with your values (or use defaults for development)
```

### Step 2: Start All Services

**Windows (PowerShell)**:

```powershell
.\deploy.ps1 full-setup
```

**Linux/Mac (Bash)**:

```bash
chmod +x deploy.sh
./deploy.sh full-setup
```

**Or manually with Docker Compose**:

```bash
docker-compose up -d
docker-compose exec -T auth-service python manage.py migrate
docker-compose exec -T user-service python manage.py migrate
docker-compose exec -T candidature-service python manage.py migrate
```

### Step 3: Verify Everything Works

```bash
# Check services are running
docker-compose ps

# Test gateway health
curl http://localhost/health

# Test API endpoint
curl -X POST http://localhost/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📋 Common Commands

| Command                | Purpose                           |
| ---------------------- | --------------------------------- |
| `./deploy.ps1 status`  | Check if all services are running |
| `./deploy.ps1 logs`    | View service logs                 |
| `./deploy.ps1 restart` | Restart all services              |
| `./deploy.ps1 stop`    | Stop all services                 |
| `./deploy.ps1 backup`  | Backup database                   |

## 🔗 API Endpoints

- **Auth**: http://localhost/api/auth/
- **User**: http://localhost/api/user/
- **Candidatures**: http://localhost/api/candidatures/
- **WebSocket**: ws://localhost/ws/candidatures/
- **Gateway Health**: http://localhost/health
- **Nginx Metrics**: http://localhost/metrics

## 🆘 Troubleshooting

**Port 80 already in use?**

```bash
# Windows: Find process using port 80
netstat -ano | findstr :80

# Linux/Mac: Find and kill
lsof -i :80
sudo kill -9 <PID>
```

**Database connection error?**

```bash
# Check database is running
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d
```

**Services not starting?**

```bash
# View detailed logs
docker-compose logs -f candidature-service

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

## 📚 Full Documentation

See [README_GATEWAY.md](README_GATEWAY.md) for complete setup guide, monitoring, and troubleshooting.

## ✅ What's Running

- **Nginx Gateway** (Port 80/443)
  - Reverse proxy for all APIs
  - Rate limiting and security headers
  - WebSocket support

- **Auth Service** (Port 8001)
  - JWT authentication
  - User registration & login

- **User Service** (Port 8002)
  - User profile management
  - User information APIs

- **Candidature Service** (Port 8003)
  - Application submissions
  - Score calculations
  - WebSocket for real-time updates

- **PostgreSQL** (Port 5432)
  - Shared database for all services

---

**Ready to deploy?** Continue with production setup in [README_GATEWAY.md](README_GATEWAY.md)
