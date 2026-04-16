# ---------------------------------------------------------------------------
# Secret Manager
# ---------------------------------------------------------------------------

locals {
  backend_secrets = {
    secret-key            = var.secret_key
    amadeus-client-id     = var.amadeus_client_id
    amadeus-client-secret = var.amadeus_client_secret
    weather-api-key       = var.weather_api_key
    bdc-api-key           = var.bdc_api_key
    
    # --- NEW KEYS ADDED ---
    smtp-username         = var.smtp_username
    smtp-password         = var.smtp_password
    from-email            = var.from_email
    openai-api-key        = var.openai_api_key
    mapbox-api-key        = var.mapbox_api_key
    duffel-api-key        = var.duffel_api_key
    geoapify-api-key      = var.geoapify_api_key
    serpapi-key           = var.serpapi_key
    airlabs-api-key       = var.airlabs_api_key
  }
}

resource "google_secret_manager_secret" "backend_secrets" {
  for_each  = local.backend_secrets
  secret_id = "${var.environment}-${each.key}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "backend_secret_versions" {
  for_each    = local.backend_secrets
  secret      = google_secret_manager_secret.backend_secrets[each.key].id
  secret_data = each.value
}

# ---------------------------------------------------------------------------
# Grant the backend service account access to all secrets
# ---------------------------------------------------------------------------
resource "google_secret_manager_secret_iam_member" "backend_secret_access" {
  for_each = merge(
    { for k, v in local.backend_secrets : k => google_secret_manager_secret.backend_secrets[k].secret_id },
    { "postgres-url" = google_secret_manager_secret.postgres_url.secret_id }
  )

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend_sa.email}"
}
