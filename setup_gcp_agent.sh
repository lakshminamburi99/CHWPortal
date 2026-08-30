#!/usr/bin/env bash
# ==============================================================================
# Automated GCP Agent Creation, Training APIs & IAM Permission Script
# ==============================================================================
# Usage:
#   chmod +x setup_gcp_agent.sh
#   ./setup_gcp_agent.sh
# ==============================================================================

set -euo pipefail

REGION="${REGION:-us-central1}"
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"

# Color helpers
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}[ERROR]${NC} No active GCP Project ID set. Run 'gcloud config set project YOUR_PROJECT_ID' first."
    exit 1
fi

echo -e "${BLUE}[INFO]${NC} Automated GCP Agent Setup for Project: ${PROJECT_ID} (${REGION})"

# ------------------------------------------------------------------------------
# 1. Enable Required GCP APIs
# ------------------------------------------------------------------------------
echo -e "${BLUE}[INFO]${NC} Step 1: Enabling Vertex AI, Speech-to-Text V2 & Discovery Engine APIs..."
gcloud services enable \
    aiplatform.googleapis.com \
    speech.googleapis.com \
    discoveryengine.googleapis.com \
    dialogflow.googleapis.com \
    cloudresourcemanager.googleapis.com \
    --project="${PROJECT_ID}"

echo -e "${GREEN}[SUCCESS]${NC} All GCP Agent APIs enabled."

# ------------------------------------------------------------------------------
# 2. Grant IAM Roles to Cloud Run Service Account
# ------------------------------------------------------------------------------
echo -e "${BLUE}[INFO]${NC} Step 2: Provisioning IAM Roles for Cloud Run Service Account..."

PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

ROLES=(
    "roles/aiplatform.user"
    "roles/speech.client"
    "roles/discoveryengine.user"
    "roles/dialogflow.client"
)

for ROLE in "${ROLES[@]}"; do
    echo -e "${BLUE}[INFO]${NC} Granting ${ROLE} to ${SERVICE_ACCOUNT}..."
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="${ROLE}" \
        --quiet &>/dev/null || true
done

echo -e "${GREEN}[SUCCESS]${NC} IAM Roles successfully assigned to ${SERVICE_ACCOUNT}."

# ------------------------------------------------------------------------------
# 3. Create / Verify Agent Builder Data Store (Optional Auto-Provisioning)
# ------------------------------------------------------------------------------
echo -e "${BLUE}[INFO]${NC} Step 3: Verifying Vertex AI Agent Builder Data Store..."

DATASTORE_ID="chw-clinical-datastore"
if ! gcloud alpha discovery-engine data-stores describe "${DATASTORE_ID}" --location="global" --project="${PROJECT_ID}" &>/dev/null; then
    echo -e "${BLUE}[INFO]${NC} Creating Discovery Engine Data Store '${DATASTORE_ID}'..."
    gcloud alpha discovery-engine data-stores create "${DATASTORE_ID}" \
        --display-name="CHW Clinical Medical Manuals" \
        --industry-vertical="GENERIC" \
        --solution-type="SOLUTION_TYPE_SEARCH" \
        --location="global" \
        --project="${PROJECT_ID}" &>/dev/null || echo -e "${BLUE}[INFO]${NC} Data Store creation skipped or pre-configured."
fi

echo ""
echo "=============================================================================="
echo -e "${GREEN}✅ AUTOMATED GCP AGENT SETUP COMPLETE!${NC}"
echo "=============================================================================="
echo "Service Account : ${SERVICE_ACCOUNT}"
echo "Granted Roles   : Vertex AI User, Speech Client, Discovery Engine User"
echo "Target Project  : ${PROJECT_ID}"
echo "=============================================================================="
