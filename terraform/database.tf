# ---------------------------------------------------------------------------
# Cloud SQL — PostgreSQL
# Replaces the local SQLite travel_app.db used in dev 
# we inject DATABASE_URL env var via Secret Manager
# ---------------------------------------------------------------------------
resource "google_sql_database_instance" "postgres" {
  name             = "${var.environment}-travel-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"
    disk_size         = 10 # GB
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled            = true
      start_time         = "03:00"
      binary_log_enabled = false
    }

    ip_configuration {
      ipv4_enabled    = false # no public IP — only reachable via private VPC
      private_network = google_compute_network.vpc.id
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = var.environment == "prod" ? true : false

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_database" "travel_db" {
  name     = "travel_db"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app_user" {
  name     = "travel_user"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# Store the full connection URL as a secret so backend Cloud Run can consume it
resource "google_secret_manager_secret" "postgres_url" {
  secret_id = "${var.environment}-postgres-url"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "postgres_url" {
  secret = google_secret_manager_secret.postgres_url.id

  secret_data = "postgresql://travel_user:${var.db_password}@${google_sql_database_instance.postgres.private_ip_address}:5432/travel_db"
}
