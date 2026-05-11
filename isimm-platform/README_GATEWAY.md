# ISIMM Platform - Production Gateway Setup

## Overview

This document describes the production-grade API Gateway setup for the ISIMM Platform. The gateway uses **Nginx** as a reverse proxy to route requests to three independent microservices while providing centralized authentication, rate limiting, and WebSocket support.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Angular)                         │
│                      http://localhost:80/                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────▼───────────┐
                │   Nginx Gateway        │
                │   (Port 80/443)        │
                └────────┬───┬───┬───┬──┘
         ┌──────────────┼─┐ │   │   └─────────┐
         │              │ │ │   │             │
    ┌────▼──┐  ┌───────▼┐ │ │ ┌▼─────┐  ┌──▼──────┐
    │ Auth  │  │ User   │ │ │ │Candi-│  │WebSocket│
    │ Srv   │  │ Srv    │ │ │ │dature│  │  /ws/   │
    │:8001  │  │ :8002  │ │ │ │ Srv  │  │:8003    │
    │       │  │        │ │ │ │:8003 │  │         │
    └───────┘  └────────┘ │ │ └──────┘  └─────────┘
                           │ │
                      ┌────▼─▼────┐
                      │ PostgreSQL │
                      │ (Port 5432)│
                      └────────────┘
```

## Components

### 1. **Nginx Gateway** (gateway/nginx.conf)

- **Port**: 80 (HTTP) and 443 (HTTPS)
- **Features**:
  - Rate limiting (100 req/s general, 10 req/min for login)
  - Request/response buffering
  - Gzip compression
  - Security headers (CSP, X-Frame-Options, etc.)
  - CORS support
  - WebSocket upgrade handling
  - Health check endpoint (/health)
  - Metrics endpoint (/metrics)

### 2. **Services**

- **Auth Service**: Port 8001 (Django + DRF)
- **User Service**: Port 8002 (Django + DRF)
- **Candidature Service**: Port 8003 (Django + Daphne ASGI)
- **Database**: PostgreSQL 16

### 3. **Routing Rules**

| Endpoint               | Target                   | Notes                    |
| ---------------------- | ------------------------ | ------------------------ |
| `/api/auth/*`          | auth-service:8001        | Login, registration, JWT |
| `/api/user/*`          | user-service:8002        | User profiles, info      |
| `/api/candidatures/*`  | candidature-service:8003 | Application submission   |
| `/api/commission/*`    | candidature-service:8003 | Commission management    |
| `/api/concours/*`      | candidature-service:8003 | Competition data         |
| `/api/ocr/*`           | candidature-service:8003 | Document processing      |
| `/api/listes/*`        | candidature-service:8003 | Admissions lists         |
| `/api/deliberations/*` | candidature-service:8003 | Deliberation results     |
| `/api/reclamations/*`  | candidature-service:8003 | User complaints          |
| `/api/commissions/*`   | candidature-service:8003 | Commission APIs          |
| `/ws/*`                | candidature-service:8003 | WebSocket connections    |

## Setup Instructions

### Prerequisites

- Docker & Docker Compose (v1.29+)
- 4GB RAM minimum
- Ports 80, 443, 5432 available

### Step 1: Prepare Environment Variables

```bash
cp .env.example .env
# Edit .env with your production values
nano .env
```

**Important variables**:

```bash
SECRET_KEY=<generate-a-strong-random-key>
JWT_SECRET=<generate-another-strong-random-key>
DB_PASSWORD=<strong-database-password>
ALLOWED_HOSTS=api.isimm.tn,www.isimm.tn
CORS_ALLOWED_ORIGINS=https://isimm.tn,https://www.isimm.tn
```

### Step 2: Build and Start Services

```bash
# Build all services
docker-compose build

# Start all services (detached mode)
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f gateway
docker-compose logs -f candidature-service
```

### Step 3: Run Migrations

```bash
# Auth service migrations
docker-compose exec auth-service python manage.py migrate

# User service migrations
docker-compose exec user-service python manage.py migrate

# Candidature service migrations
docker-compose exec candidature-service python manage.py migrate

# Create superuser (optional)
docker-compose exec auth-service python manage.py createsuperuser
```

### Step 4: Verify Gateway is Working

```bash
# Check health endpoint
curl http://localhost/health

# Test login endpoint
curl -X POST http://localhost/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Test WebSocket connection (requires wscat or similar)
wscat -c ws://localhost/ws/candidatures/
```

### Step 5: Configure SSL/TLS (Production)

For production deployment, enable HTTPS:

1. **Obtain SSL Certificate**:

   ```bash
   # Using Let's Encrypt
   certbot certonly --standalone -d api.isimm.tn -d isimm.tn

   # Certificate location: /etc/letsencrypt/live/api.isimm.tn/
   ```

2. **Update nginx.conf**:
   - Uncomment the HTTPS server block (lines ~380)
   - Set paths to SSL cert and key
   - Redirect HTTP to HTTPS

3. **Reload Nginx**:
   ```bash
   docker-compose exec gateway nginx -s reload
   ```

## Monitoring and Maintenance

### View Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f gateway
docker-compose logs -f candidature-service

# With timestamps
docker-compose logs --timestamps
```

### Health Checks

```bash
# Check gateway health
curl http://localhost/health

# Check service status
docker-compose ps

# View Nginx metrics
curl http://localhost/metrics
```

### Database Backup

```bash
# Backup PostgreSQL
docker-compose exec db pg_dump -U isimm_user isimm_db > backup.sql

# Restore from backup
docker-compose exec -T db psql -U isimm_user isimm_db < backup.sql
```

### Restart Services

```bash
# Restart a specific service
docker-compose restart candidature-service

# Restart all services
docker-compose restart

# Full restart (stop and start)
docker-compose down
docker-compose up -d
```

## Rate Limiting Configuration

The gateway implements rate limiting:

- **General API**: 100 requests/second
- **Login endpoint**: 10 requests/minute
- **Burst sizes**: Configurable per endpoint

Modify in `gateway/nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
```

## WebSocket Configuration

WebSocket is enabled with:

- **Upgrade headers**: `Upgrade: websocket`, `Connection: upgrade`
- **Timeout**: 7 days (for long-lived connections)
- **Buffering**: Disabled (for real-time data)
- **Path**: `/ws/*` routes to candidature-service

Example WebSocket connection:

```javascript
const ws = new WebSocket('ws://localhost/ws/candidatures/');
ws.addEventListener('message', (event) => {
  console.log('Message:', event.data);
});
```

## Troubleshooting

### "Address already in use" error

```bash
# Find and kill process on port 80
sudo lsof -i :80
sudo kill -9 <PID>

# Or change port in docker-compose.yml
# Modify: ports: ["8080:80"]
```

### Service not responding

```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>
```

### Database connection errors

```bash
# Check database is running
docker-compose logs db

# Verify PostgreSQL connectivity
docker-compose exec db psql -U isimm_user -d isimm_db -c "SELECT 1;"
```

### WebSocket connection fails

```bash
# Verify candidature-service is running
docker-compose exec candidature-service python manage.py shell

# Check Daphne process
docker-compose logs candidature-service | grep daphne
```

## Production Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Generate strong `SECRET_KEY` and `JWT_SECRET`
- [ ] Configure strong `DB_PASSWORD`
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Configure `CORS_ALLOWED_ORIGINS` appropriately
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring (Prometheus, Grafana, etc.)
- [ ] Configure CI/CD pipeline
- [ ] Test fail-over and recovery procedures
- [ ] Document deployment process
- [ ] Set up health monitoring alerts

## Performance Tuning

### Nginx Configuration

```nginx
# Increase worker processes
worker_processes auto;

# Increase worker connections
events {
    worker_connections 4096;
}

# Enable caching for static assets
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Django Settings

```python
# Enable database connection pooling
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 600,  # Connection timeout
    }
}

# Enable caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
```

## Scaling Considerations

For production scale, consider:

1. **Load Balancing**: Multiple Nginx instances with HAProxy
2. **Database Replication**: Master-slave or multi-master PostgreSQL
3. **Horizontal Scaling**: Multiple instances of each service
4. **Container Orchestration**: Kubernetes instead of Docker Compose
5. **CDN**: CloudFlare or similar for static assets
6. **Caching Layer**: Redis for session/query caching

Example Kubernetes deployment:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-gateway
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 80
  selector:
    app: gateway
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
        - name: gateway
          image: nginx:alpine
          ports:
            - containerPort: 80
```

## API Gateway Comparison

### Current Solution: Nginx

- ✅ Lightweight and fast
- ✅ Battle-tested in production
- ✅ Native WebSocket support
- ✅ Easy to configure
- ❌ Limited built-in features

### Alternative: Traefik

```yaml
# traefik.yml
api:
  insecure: true
  dashboard: true

entryPoints:
  web:
    address: ':80'
  websecure:
    address: ':443'

providers:
  docker:
    endpoint: 'unix:///var/run/docker.sock'
    exposedbydefault: false
```

### Alternative: Kong

- API Management + Rate Limiting
- Built-in authentication plugins
- Analytics and monitoring
- Higher complexity and resource usage

## Support and Documentation

- **Nginx Documentation**: https://nginx.org/en/docs/
- **Docker Compose**: https://docs.docker.com/compose/
- **Django Deployment**: https://docs.djangoproject.com/en/stable/howto/deployment/
- **Let's Encrypt**: https://letsencrypt.org/

---

**Last Updated**: May 10, 2026
**Maintainer**: ISIMM Platform Team
