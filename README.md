# CHW Care Platform

![Architecture Diagram](file:///C:/Users/krisa/.gemini/antigravity-ide/brain/35ff8135-93e6-4f9c-96de-0fd683c9ff0f/architecture_diagram_1787792878338.png)

## Execution Confirmation

The development database will be reset, migrations applied, and seed data populated to provide realistic test data for all admin roles. The full scope of admin portal implementation will be executed autonomously.

All UI components, API endpoints, and RBAC protections will be finalized. Subsequent verification will include automated API tests and manual UI walkthroughs.

## Overview

This repository contains a full-stack web application for Community Health Worker (CHW) care management. The frontend is built with **React**, **TypeScript**, and **Vite**. The backend is a **FastAPI** service written in **Python**. Data is persisted in a **PostgreSQL** database. All components are containerised and orchestrated with **Docker Compose**.

## Repository Structure

- `/frontend` – React + Vite front‑end application.
- `/backend` – FastAPI service (Python) with migrations, seed data and tests.
- `docker-compose.yml` – Orchestrates PostgreSQL, backend, and frontend containers.
- `README.md` – This file.

## Quick Start (Docker Compose)

```bash
# Clone the repository
git clone <repo-url>
cd CWST

# (Optional) Create a .env file for backend configuration – see .env.example
cp backend/.env.example backend/.env

# Build and start all services
docker-compose up --build -d
```

The services will be available at:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8000>
- PostgreSQL: `postgres://chw_app:changeme@localhost:5432/chw_care_db`
- Admin portals:
  - Super Admin: http://localhost:5173/admin/super
  - Regional Admin: http://localhost:5173/admin/regional
  - Programme Manager: http://localhost:5173/admin/manager

After containers start, the backend will automatically run migrations and seed the database with demo users for each role.

## Backend Details

- **Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **Database**: PostgreSQL (docker service `postgres`)
- **Initial Data**: Place SQL or shell scripts in `cwst_postgres_data/`; they will be executed automatically on container startup.
- **Migrations**: Handled via Alembic scripts in `backend/app/db/migrations` (run `alembic upgrade head`).
- **Environment Variables** (defined in `backend/.env`):
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
  - `JWT_SECRET`
  - `DEMO_MODE`

## Frontend Details

- **Framework**: React with TypeScript
- **Bundler**: Vite
- **Styling**: TailwindCSS (optional) – modify `src/index.css`.
- **API Base URL**: Adjust `VITE_API_URL` in `.env` if needed.

## Development Workflow

1. **Backend**: Edit Python code under `backend/app`. Run tests with `pytest` inside the backend container or virtualenv.
2. **Frontend**: Run `npm install` then `npm run dev` inside the `frontend` directory for hot‑module reloading.
3. **Database Migrations**: Use `docker exec -it chw_care_backend alembic upgrade head`.
4. **Seeding Data**: Run `docker exec -it chw_care_backend python -m backend.app.db.seed` to populate demo data.

## Stopping the Stack

```bash
docker-compose down
```

## License

MIT License – see `LICENSE` for details.
