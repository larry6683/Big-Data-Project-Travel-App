# ---------------------------------------------------------------------------
# VPC — private network for Redis, Cloud SQL, and VPC connector
# ---------------------------------------------------------------------------
resource "google_compute_network" "vpc" {
  name                    = "${var.environment}-travel-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.apis]
}

resource "google_compute_subnetwork" "subnet" {
  name                     = "${var.environment}-travel-subnet"
  ip_cidr_range            = "10.0.0.0/24"
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
}

# ---------------------------------------------------------------------------
# Serverless VPC Access Connector
# Lets Cloud Run services reach Redis and Cloud SQL on the private network
# ---------------------------------------------------------------------------
resource "google_vpc_access_connector" "connector" {
  name          = "${var.environment}-vpc-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
  min_instances = 2
  max_instances = 3

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# Cloud Memorystore (Redis) — replaces the local redis:alpine container
# Used by FastAPI for caching API responses (weather, flights, etc.)
# ---------------------------------------------------------------------------
resource "google_redis_instance" "cache" {
  name               = "${var.environment}-travel-cache"
  tier               = "BASIC"
  memory_size_gb     = 1
  region             = var.region
  authorized_network = google_compute_network.vpc.id
  redis_version      = "REDIS_7_0"
  display_name       = "Travel App Cache (${var.environment})"

  labels = {
    environment = var.environment
    app         = "travel-app"
  }

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# Private service access for Cloud SQL
# ---------------------------------------------------------------------------
resource "google_compute_global_address" "private_ip_range" {
  name          = "${var.environment}-private-ip-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]

  depends_on = [google_project_service.apis]
}
