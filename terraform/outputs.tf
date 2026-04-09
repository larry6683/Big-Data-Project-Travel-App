output "backend_url" {
  description = "Cloud Run backend service URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "Cloud Run frontend service URL"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "redis_host" {
  description = "Redis host (private IP, only reachable from VPC)"
  value       = google_redis_instance.cache.host
}

output "postgres_private_ip" {
  description = "Cloud SQL private IP"
  value       = google_sql_database_instance.postgres.private_ip_address
  sensitive   = true
}

output "profile_bucket_name" {
  description = "GCS bucket name for profile images"
  value       = google_storage_bucket.profile_images.name
}

output "artifact_registry_repo" {
  description = "Artifact Registry repo URI for Docker images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.travel_app.repository_id}"
}

output "backend_sa_email" {
  description = "Backend service account email"
  value       = google_service_account.backend_sa.email
}
