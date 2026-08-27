#!/usr/bin/env bash
# ==============================================================================
# CHW Care Platform (CWST) — GCP Automated Deployment Script
# ==============================================================================
# Usage:
#   chmod +x deploy_gcp.sh
#   ./deploy_gcp.sh
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Configuration Defaults (Override via environment variables if desired)
# ------------------------------------------------------------------------------
REGION="${REGION:-us-central1}"
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"
DB_INSTANCE="${DB_INSTANCE:-chw-db-instance}"
DB_NAME="${DB_NAME:-chw_care_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-India@202608!}"
REPO_NAME="${REPO_NAME:-chw-repo}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo "SecretJWTKeyForCWSTPlatform2026")}"

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ -z "$PROJECT_ID" ]; then
    log_error "No active GCP Project ID set. Please run 'gcloud config set project YOUR_PROJECT_ID' or set PROJECT_ID environment variable."
    exit 1
fi

log_info "Starting GCP Deployment for CHW Care Platform..."
log_info "Project ID: ${PROJECT_ID}"
log_info "Region: ${REGION}"

# ------------------------------------------------------------------------------
# Step 1: Enable GCP Service APIs
# ------------------------------------------------------------------------------
log_info "Step 1: Enabling required GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    --project="${PROJECT_ID}"

# ------------------------------------------------------------------------------
# Step 2: Create Artifact Registry Repository
# ------------------------------------------------------------------------------
log_info "Step 2: Ensuring Docker repository exists in Artifact Registry..."
if ! gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
    gcloud artifacts repositories create "${REPO_NAME}" \
        --repository-format=docker \
        --location="${REGION}" \
        --description="Docker repository for CHW Care Platform" \
        --project="${PROJECT_ID}"
    log_success "Artifact Registry repository '${REPO_NAME}' created."
else
    log_info "Artifact Registry repository '${REPO_NAME}' already exists."
fi

# ------------------------------------------------------------------------------
# Step 3: Create Cloud SQL Instance & Database
# ------------------------------------------------------------------------------
log_info "Step 3: Checking Cloud SQL PostgreSQL instance..."
if ! gcloud sql instances describe "${DB_INSTANCE}" --project="${PROJECT_ID}" &>/dev/null; then
    log_info "Creating Cloud SQL PostgreSQL 15 instance '${DB_INSTANCE}' (this may take 3-5 minutes)..."
    gcloud sql instances create "${DB_INSTANCE}" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="${REGION}" \
        --root-password="${DB_PASSWORD}" \
        --project="${PROJECT_ID}"
    log_success "Cloud SQL instance '${DB_INSTANCE}' created."
else
    log_info "Cloud SQL instance '${DB_INSTANCE}' already exists."
fi

log_info "Ensuring application database '${DB_NAME}' exists..."
if ! gcloud sql databases describe "${DB_NAME}" --instance="${DB_INSTANCE}" --project="${PROJECT_ID}" &>/dev/null; then
    gcloud sql databases create "${DB_NAME}" --instance="${DB_INSTANCE}" --project="${PROJECT_ID}"
    log_success "Database '${DB_NAME}' created."
else
    log_info "Database '${DB_NAME}' already exists."
fi

INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe "${DB_INSTANCE}" --project="${PROJECT_ID}" --format="value(connectionName)")
log_info "Cloud SQL Connection Name: ${INSTANCE_CONNECTION_NAME}"

# ------------------------------------------------------------------------------
# Step 4: Build Container Images with Cloud Build
# ------------------------------------------------------------------------------
log_info "Step 4: Submitting container builds to Cloud Build..."
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=_LOCATION="${REGION}",_REPO_NAME="${REPO_NAME}" \
    --project="${PROJECT_ID}" .

BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:latest"
FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:latest"

# ------------------------------------------------------------------------------
# Step 5: Deploy Backend Service to Cloud Run
# ------------------------------------------------------------------------------
log_info "Step 5: Deploying Backend (FastAPI) to Cloud Run..."
DB_SOCKET_URI="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

gcloud run deploy chw-backend \
    --image="${BACKEND_IMAGE}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=8000 \
    --add-cloudsql-instances="${INSTANCE_CONNECTION_NAME}" \
    --set-env-vars="DATABASE_URL=${DB_SOCKET_URI},POSTGRES_USER=${DB_USER},POSTGRES_PASSWORD=${DB_PASSWORD},POSTGRES_DB=${DB_NAME},POSTGRES_SERVER=/cloudsql/${INSTANCE_CONNECTION_NAME},JWT_SECRET=${JWT_SECRET},ENVIRONMENT=production,DEMO_MODE=true" \
    --project="${PROJECT_ID}"

BACKEND_URL=$(gcloud run services describe chw-backend --region="${REGION}" --project="${PROJECT_ID}" --format="value(status.url)")
log_success "Backend deployed successfully at: ${BACKEND_URL}"

# ------------------------------------------------------------------------------
# Step 6: Deploy Frontend Service to Cloud Run
# ------------------------------------------------------------------------------
log_info "Step 6: Deploying Frontend (React + Nginx) to Cloud Run..."
gcloud run deploy chw-frontend \
    --image="${FRONTEND_IMAGE}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=80 \
    --project="${PROJECT_ID}"

FRONTEND_URL=$(gcloud run services describe chw-frontend --region="${REGION}" --project="${PROJECT_ID}" --format="value(status.url)")
log_success "Frontend deployed successfully at: ${FRONTEND_URL}"

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
echo ""
echo "=============================================================================="
log_success "CHW CARE PLATFORM DEPLOYMENT COMPLETE!"
echo "=============================================================================="
echo -e "Frontend Web App:  ${GREEN}${FRONTEND_URL}${NC}"
echo -e "Backend API:       ${GREEN}${BACKEND_URL}${NC}"
echo -e "API Swagger Docs:  ${GREEN}${BACKEND_URL}/docs${NC}"
echo -e "Database Connection Name: ${INSTANCE_CONNECTION_NAME}"
echo "=============================================================================="
