# ---------------------------------------------------------------------------
# Cloud Run — FastAPI Backend
# ---------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.environment}-travel-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend_sa.email

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
          cpu    = "2"
          memory = "2048Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
      }

      env {
        name  = "BACKEND_CORS_ORIGINS"
        value = "[\"*\"]" # Wildcard for now to avoid CORS errors during testing
      }

      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.profile_images.name
      }

      # --- SENSITIVE ENV VARS ---
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

      # Add this inside the env {} sections in cloud_run.tf for the backend
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "PUBSUB_TOPIC_NAME"
        value = "${var.environment}-trip-notifications"
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
        name = "SMTP_USERNAME"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["smtp-username"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SMTP_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["smtp-password"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "FROM_EMAIL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["from-email"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["openai-api-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "MAPBOX_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["mapbox-api-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "DUFFEL_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["duffel-api-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "GEOAPIFY_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["geoapify-api-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SERPAPI_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["serpapi-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AIRLABS_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.backend_secrets["airlabs-api-key"].secret_id
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

resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------------------------------------------------------------------------
# Cloud Run — Next.js Frontend
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
          cpu    = "2"       # Increased CPU for boot performance
          memory = "2048Mi"  # Increased RAM to prevent OOM
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      # REQUIRED: Tell the browser where to find the backend
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = "${google_cloud_run_v2_service.backend.uri}/api/v1"
      }

      # Backend URL for server-side requests
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
        initial_delay_seconds = 30 # Give Next.js more time to boot
        period_seconds        = 10
        failure_threshold     = 10
      }
    }
  }

  depends_on = [
    google_cloud_run_v2_service.backend,
    google_project_service.apis,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}