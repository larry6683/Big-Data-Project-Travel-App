# ---------------------------------------------------------------------------
# Cloud Run — FastAPI Backend
# Mirrors docker-compose backend service: port 8000, reads from .env
# ---------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.environment}-travel-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend_sa.email

    # Connect to VPC so the backend can reach Redis and Cloud SQL
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = var.backend_min_instances
      max_instance_count = 5
    }

    containers {
      image = var.backend_image
      name  = "backend"

      ports {
        container_port = 8000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true  # only use CPU during requests (cost saving)
        startup_cpu_boost = true  # faster cold starts
      }

      # ---------------------------------------------------------------------------
      # Non-sensitive env vars — set directly
      # ---------------------------------------------------------------------------
      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
      }

      # TODO hardcoded for now :(
      env {
        name  = "BACKEND_CORS_ORIGINS"
        value = "[\"https://prod-travel-frontend-n2yisjprxa-uc.a.run.app\"]"
      }

      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.profile_images.name
      }

      # ---------------------------------------------------------------------------
      # Sensitive env vars — pulled from Secret Manager at runtime
      # ---------------------------------------------------------------------------
      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["secret-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AMADEUS_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["amadeus-client-id"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AMADEUS_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["amadeus-client-secret"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "WEATHER_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["weather-api-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "BDC_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["bdc-api-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "POSTGRES_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.postgres_url.secret_id
            version = "latest"
          }
        }
      }

      # Startup probe — wait for FastAPI to be ready before sending traffic
      startup_probe {
        http_get {
          path = "/health"
          port = 8000
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 10
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8000
        }
        period_seconds    = 30
        failure_threshold = 3
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.backend_secret_versions,
    google_secret_manager_secret_version.postgres_url,
    google_redis_instance.cache,
    google_vpc_access_connector.connector,
  ]
}

# Allow unauthenticated requests to the backend (frontend calls it publicly)
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------------------------------------------------------------------------
# Cloud Run — Next.js Frontend
# Mirrors docker-compose frontend service: port 3000
# ---------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "frontend" {
  name     = "${var.environment}-travel-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.frontend_sa.email

    scaling {
      min_instance_count = var.frontend_min_instances
      max_instance_count = 5
    }

    containers {
      image = var.frontend_image
      name  = "frontend"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      # Backend URL used by Next.js server-side components
      env {
        name  = "BACKEND_URL"
        value = "${google_cloud_run_v2_service.backend.uri}/api/v1"
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      startup_probe {
        http_get {
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 10
        period_seconds        = 5
        failure_threshold     = 12
      }
    }
  }

  depends_on = [
    google_cloud_run_v2_service.backend,
    google_project_service.apis,
  ]
}

# Allow unauthenticated access to the frontend
resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
