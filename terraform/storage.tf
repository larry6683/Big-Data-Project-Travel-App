# ---------------------------------------------------------------------------
# GCS Bucket — profile photo storage
# ---------------------------------------------------------------------------
resource "google_storage_bucket" "profile_images" {
  name          = "${var.project_id}-${var.environment}-profiles"
  location      = var.region
  force_destroy = var.environment != "prod"

  # Serve images publicly (profile photos are not sensitive)
  public_access_prevention = "inherited"

  uniform_bucket_level_access = false

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 365 # delete orphaned uploads after 1 year
    }
  }

  labels = {
    environment = var.environment
    app         = "travel-app"
  }
}

# Allow public read on all objects in the bucket
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.profile_images.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Allow backend SA to upload/delete profile photos
resource "google_storage_bucket_iam_member" "backend_write" {
  bucket = google_storage_bucket.profile_images.name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.backend_sa.email}"
}
