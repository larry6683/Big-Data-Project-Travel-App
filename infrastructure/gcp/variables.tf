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

variable "backend_image" {
  description = "Full Artifact Registry URI for the backend image"
  type        = string
}

variable "frontend_image" {
  description = "Full Artifact Registry URI for the frontend image"
  type        = string
}

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

# ---------------------------------------------------------------------------
# Secrets
# ---------------------------------------------------------------------------
variable "secret_key" {
  type      = string
  sensitive = true
}

variable "amadeus_client_id" {
  type      = string
  sensitive = true
}

variable "amadeus_client_secret" {
  type      = string
  sensitive = true
}

variable "weather_api_key" {
  type      = string
  sensitive = true
}

variable "bdc_api_key" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

# --- NEW KEYS ADDED ---
variable "smtp_username" {
  type      = string
  sensitive = true
}

variable "smtp_password" {
  type      = string
  sensitive = true
}

variable "from_email" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "mapbox_api_key" {
  type      = string
  sensitive = true
}

variable "duffel_api_key" {
  type      = string
  sensitive = true
}

variable "geoapify_api_key" {
  type      = string
  sensitive = true
}

variable "serpapi_key" {
  type      = string
  sensitive = true
}

variable "airlabs_api_key" {
  type      = string
  sensitive = true
}