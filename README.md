# GeoSphere Backend & Database Service (Machine 1)

Enterprise-grade GIS & Telemetry Backend API service, powered by Next.js App Router, Drizzle ORM, and PostgreSQL + PostGIS.

## Prerequisites
- Node.js 20.x or newer
- Docker & Docker Compose

## Quick Start on Machine 1

### 1. Start PostgreSQL + PostGIS Database
```bash
cd database
docker-compose up -d
cd ..
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` matches your PostgreSQL credentials and add your Web App machine IP to `CORS_ORIGIN`:
```env
CORS_ORIGIN=http://<MACHINE_2_WEB_IP>:3000,http://localhost:3000
```

### 3. Install Dependencies & Run Database Setup
```bash
npm install
npm run db:setup
```

### 4. Start the Backend API Server
```bash
npm run dev
```
The backend will listen on `0.0.0.0:3000`, accepting requests from both local and remote machines.

### 5. Health Check
Test that the API is reachable:
```bash
curl http://localhost:3000/api/v1/health
```

## Key Endpoints
- `GET  /api/v1/health` - System health & database connectivity
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/telemetry/gps` - Ingest mobile GPS telemetry
- `GET  /api/v1/vehicles` - List tracked fleet vehicles
- `GET  /api/v1/workspaces` - Multi-tenant workspace management
