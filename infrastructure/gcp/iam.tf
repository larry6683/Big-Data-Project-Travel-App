# ---------------------------------------------------------------------------
# Service Accounts
# ---------------------------------------------------------------------------

resource "google_service_account" "backend_sa" {
  account_id   = "${var.environment}-backend-sa"
  display_name = "Travel App Backend (${var.environment})"
}

resource "google_service_account" "frontend_sa" {
  account_id   = "${var.environment}-frontend-sa"
  display_name = "Travel App Frontend (${var.environment})"
}

resource "google_service_account" "cloudbuild_sa" {
  account_id   = "${var.environment}-cloudbuild-sa"
  display_name = "Cloud Build CI/CD (${var.environment})"
}

# ---------------------------------------------------------------------------
# Backend SA permissions
# ---------------------------------------------------------------------------

# Read from GCS (profile photo uploads)
resource "google_project_iam_member" "backend_storage_object_user" {
  project = var.project_id
  role    = "roles/storage.objectUser"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# Connect to Cloud SQL
resource "google_project_iam_member" "backend_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# Access Secret Manager (individual secret grants are in secrets.tf)
resource "google_project_iam_member" "backend_secret_viewer" {
  project = var.project_id
  role    = "roles/secretmanager.viewer"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# ---------------------------------------------------------------------------
# Cloud Build SA permissions
# ---------------------------------------------------------------------------

# Deploy to Cloud Run
resource "google_project_iam_member" "cloudbuild_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

# Push images to Artifact Registry
resource "google_project_iam_member" "cloudbuild_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

# Act as Cloud Run service accounts during deploy
resource "google_service_account_iam_member" "cloudbuild_acts_as_backend" {
  service_account_id = google_service_account.backend_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

resource "google_service_account_iam_member" "cloudbuild_acts_as_frontend" {
  service_account_id = google_service_account.frontend_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

# ---------------------------------------------------------------------------
# Artifact Registry — Docker image repository
# ---------------------------------------------------------------------------
resource "google_artifact_registry_repository" "travel_app" {
  location      = var.region
  repository_id = "travel-app"
  description   = "Travel App Docker images"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}
