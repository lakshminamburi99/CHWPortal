# Cloud Implementation & Deployment Guide

This document details the configuration, cloud deployment strategies, and environment settings for the **CHW Care Platform (CWST)**.

---

## 1. System Architecture Overview

- **Frontend**: React + TypeScript + Vite (Port `5173`)
- **Backend**: FastAPI (Python) running on Uvicorn (Port `8000`)
- **Database**: PostgreSQL database instance (Port `5432`)
- **Orchestration**: Docker Compose for containerized environment management

---

## 2. Environment Configuration

### Backend Setup (`backend/.env`)
Ensure your environment settings match your operational mode:

```env
POSTGRES_USER=chw_app
POSTGRES_PASSWORD=your_secure_password
POSTGRES_SERVER=postgres
POSTGRES_PORT=5432
POSTGRES_DB=chw_care_db
SECRET_KEY=your_jwt_secret_key
DEMO_MODE=false
```

### Frontend Setup (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

---

## 3. Containerized Deployment (Docker Compose)

To build and run the services in production or staging:

```bash
# Build and start all services in detached mode
docker-compose up --build -d

# View running container logs
docker-compose logs -f

# Run database migrations
docker exec -it chw_care_backend alembic upgrade head

# Seed initial admin data
docker exec -it chw_care_backend python -m app.db.seed
```

---

## 4. Cloud Platform Deployment Options

### A. AWS / GCP / Azure Container Instances
1. Push images to Container Registry (ECR / Artifact Registry / ACR).
2. Deploy backend service with connected PostgreSQL (RDS / Cloud SQL).
3. Host built frontend (`frontend/dist`) on S3/CloudFront or static web hosting.

### B. Render / Railway / Heroku
1. Provision a PostgreSQL managed database.
2. Deploy FastAPI service from `/backend` directory.
3. Deploy React frontend from `/frontend` directory with `npm run build`.

---

## 5. Continuous Integration & Repository Management

- Repository initialized on default branch `main`.
- Environment secrets (`.env`) excluded via `.gitignore`.
- Automated testing via `pytest` (`backend/tests`).
