# Migration Guide: Dev Proxy → Production Gateway

## Overview

This guide explains how to transition from the Angular dev proxy (proxy.conf.json) to the production Nginx gateway.

## Phase 1: Dev Proxy (Current State)

**Current Setup**:

```
Angular Dev Server (4200)
    ↓ proxy.conf.json
    ├→ Auth Service (8001)
    ├→ User Service (8002)
    └→ Candidature Service (8003)
```

**Configuration**:

- `angular.json` uses `proxy.conf.json`
- Frontend runs on port 4200
- Proxy config rewrites URLs to individual services

## Phase 2: Production Gateway

**New Setup**:

```
Nginx Gateway (80/443)
    ├→ Auth Service (8001)
    ├→ User Service (8002)
    ├→ Candidature Service (8003)
    └→ PostgreSQL (5432)
```

**Files Created**:

- `docker-compose.yml` - Complete stack definition
- `gateway/nginx.conf` - Nginx configuration
- `.env` - Environment variables
- `deploy.sh/.ps1` - Deployment scripts

## Migration Steps

### Step 1: Stop Dev Proxy

```bash
# Stop Angular dev server
# Press Ctrl+C in Angular terminal
```

Remove from `angular.json`:

```json
// Remove or comment out:
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### Step 2: Update Frontend Configuration

**Before** (environment.ts):

```typescript
export const environment = {
  production: false,
  apiUrl: '/api', // Routed via proxy.conf.json to localhost:8001/8002/8003
};
```

**After** (environment.ts for dev with gateway):

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost/api', // Routed via Nginx gateway
};
```

**For Production** (environment.production.ts):

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.isimm.tn/api', // Nginx gateway with SSL
};
```

### Step 3: Prepare Docker Infrastructure

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec -T auth-service python manage.py migrate
docker-compose exec -T user-service python manage.py migrate
docker-compose exec -T candidature-service python manage.py migrate
```

### Step 4: Test Gateway

```bash
# Test health endpoint
curl http://localhost/health

# Test auth endpoint
curl -X POST http://localhost/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Test user endpoint
curl http://localhost/api/user/profile/

# Test candidature endpoint
curl http://localhost/api/candidatures/
```

### Step 5: Start Frontend with Gateway

```bash
# Build frontend for gateway
npm run build

# Serve with local gateway (dev environment)
npm start

# Or serve production build
npm run build -- --configuration production
# Then serve dist folder via Nginx
```

### Step 6: Update Docker Compose for Frontend

Add to `docker-compose.yml`:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: isimm-frontend
  ports:
    - '4200:80'
  depends_on:
    - gateway
  networks:
    - isimm_network
```

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/isimm-platform /usr/share/nginx/html
COPY gateway/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Comparison Table

| Aspect           | Dev Proxy       | Production Gateway    |
| ---------------- | --------------- | --------------------- |
| Entry Point      | Angular :4200   | Nginx :80/:443        |
| Proxy Config     | proxy.conf.json | gateway/nginx.conf    |
| SSL/TLS          | ❌              | ✅                    |
| Rate Limiting    | ❌              | ✅                    |
| Security Headers | ❌              | ✅                    |
| CORS             | Angular         | Nginx                 |
| WebSocket        | ✅              | ✅                    |
| Docker           | ❌              | ✅                    |
| Database         | Shared          | Single PostgreSQL     |
| Scaling          | Single instance | Horizontally scalable |

## Troubleshooting Migration

### Issue: CORS Errors

**Solution**: Update `CORS_ALLOWED_ORIGINS` in `.env`

```
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:80
```

### Issue: WebSocket Connection Fails

**Solution**: Check WebSocket route in nginx.conf

```bash
# Verify ws:// endpoint is accessible
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost/ws/candidatures/
```

### Issue: HTTPS Redirect Loop

**Solution**: Ensure only one server block redirects HTTP to HTTPS

### Issue: Frontend Calls Wrong URLs

**Solution**: Verify environment files have correct `apiUrl`

```typescript
console.log(environment.apiUrl); // Should be /api or https://api.isimm.tn/api
```

## Rollback Plan

If you need to revert to dev proxy:

1. Restore `angular.json` with proxy.conf.json
2. Stop docker-compose: `docker-compose down`
3. Update environment.ts to use `/api`
4. Start Angular dev server: `npm start`
5. Access on http://localhost:4200

## Performance Comparison

```
Dev Proxy (through Angular):
- Request: Angular → Node dev server → Reverse proxy → Service → Response
- Latency: ~50-100ms

Production Gateway (direct Nginx):
- Request: Client → Nginx → Service → Response
- Latency: ~10-30ms (3-10x faster)

With HTTP/2 and compression:
- Throughput: 50%+ improvement
- Gzip reduces payload size by 60-80%
```

## Next Steps

1. **Staging Environment**: Deploy to staging with production config
2. **Load Testing**: Test with expected user load
3. **Security Audit**: Review security headers and SSL configuration
4. **Monitoring Setup**: Configure monitoring and alerting
5. **Documentation**: Update deployment documentation
6. **Team Training**: Train team on new deployment process

## See Also

- [README_GATEWAY.md](README_GATEWAY.md) - Complete gateway documentation
- [GATEWAY_QUICK_START.md](GATEWAY_QUICK_START.md) - Quick setup guide
- [PRODUCTION_SSL_SETUP.md](PRODUCTION_SSL_SETUP.md) - SSL/TLS configuration
- [docker-compose.yml](docker-compose.yml) - Full stack definition

---

**Last Updated**: May 10, 2026
**Status**: Ready for implementation
