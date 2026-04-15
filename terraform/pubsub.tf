# terraform/pubsub.tf

# 1. Create the Pub/Sub Topic (The Mailbox)
resource "google_pubsub_topic" "trip_notifications" {
  name = "${var.environment}-trip-notifications"
}

# 2. Create the Push Subscription (The Mailman)
# This automatically pushes messages to your backend worker endpoint
resource "google_pubsub_subscription" "trip_notifications_push" {
  name  = "${var.environment}-trip-notifications-push"
  topic = google_pubsub_topic.trip_notifications.name

  push_config {
    # This points to the new endpoint we are about to create in trips.py!
    push_endpoint = "${google_cloud_run_v2_service.backend.uri}/api/v1/trips/notification-worker"
  }
}

# 3. Give your Backend permission to publish messages
resource "google_pubsub_topic_iam_member" "publisher" {
  topic  = google_pubsub_topic.trip_notifications.name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.backend_sa.email}"
}