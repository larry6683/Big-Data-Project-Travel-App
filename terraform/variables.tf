variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

# ---------------------------------------------------------------------------
# Container images
# ---------------------------------------------------------------------------
variable "backend_image" {
  description = "Full Artifact Registry URI for the backend image"
  type        = string
}

variable "frontend_image" {
  description = "Full Artifact Registry URI for the frontend image"
  type        = string
}

# ---------------------------------------------------------------------------
# Secrets
# ---------------------------------------------------------------------------
variable "secret_key" {
  description = "JWT secret key (SECRET_KEY in backend .env)"
  type        = string
  sensitive   = true
}

variable "amadeus_client_id" {
  description = "Amadeus API client ID"
  type        = string
  sensitive   = true
}

variable "amadeus_client_secret" {
  description = "Amadeus API client secret"
  type        = string
  sensitive   = true
}

variable "weather_api_key" {
  description = "OpenWeather API key"
  type        = string
  sensitive   = true
}

variable "bdc_api_key" {
  description = "Big Data Cloud API key"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Cloud SQL PostgreSQL password"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------------------
# Tuning
# ---------------------------------------------------------------------------
variable "backend_min_instances" {
  description = "Minimum Cloud Run instances for backend (0 = scale to zero)"
  type        = number
  default     = 0
}

variable "frontend_min_instances" {
  description = "Minimum Cloud Run instances for frontend"
  type        = number
  default     = 0
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}
