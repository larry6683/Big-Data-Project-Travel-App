# 🌍 WanderPlan US | Big Data Travel Planner

WanderPlan US is a comprehensive, cloud-native travel planning application that leverages big data to generate highly customized itineraries. It aggregates flights, driving routes, local stays, real-time weather, attractions, and local tours into a single, seamless, and responsive interface.

Built with an enterprise-grade architecture, the application utilizes asynchronous event-driven processing, high-performance caching, and Infrastructure-as-Code (IaC) to ensure scalability and reliability.

## 🏗️ System Architecture & Tech Stack

This project is structured as a monorepo and heavily leverages **Google Cloud Platform (GCP)** for production hosting.

- **Frontend (`/frontend`)**: A Next.js (React) application styled with Tailwind CSS, featuring interactive routing, responsive layouts, and dynamic maps via Leaflet.
- **Backend (`/backend`)**: A robust Python FastAPI backend that handles a dozen external API integrations, geographic calculations, and data aggregations.
- **Infrastructure (`/terraform`)**: Complete Infrastructure-as-Code (IaC) using Terraform to provision Cloud Run, Cloud SQL, Memorystore (Redis), Pub/Sub, and Secret Manager.
- **Database**: PostgreSQL (managed via Google Cloud SQL) for persistent user and trip data.
- **Caching**: Redis (Google Cloud Memorystore) for high-speed retrieval of expensive API searches (hotels, flights).
- **Asynchronous Workers**: Google Cloud Pub/Sub decoupled architecture for heavy background tasks (e.g., generating PDF itineraries and sending automated emails).

## ✨ Core Features

- **Multi-Modal Travel**: Compare flight data vs. driving routes (including distance, time, and waypoints).
- **Interactive Mapping**: Dynamic maps with custom markers for visualizing trips using Mapbox and Protomaps.
- **Comprehensive Itineraries**: View hotels, attractions, tours, and weather forecasts tailored to specific travel dates and budgets.
- **Automated Email Delivery**: Asynchronous PDF itinerary generation and email delivery powered by GCP Pub/Sub.
- **Responsive UI**: A universal layout with a collapsible sidebar for mobile/tablet and a side-by-side persistent map for desktop views.

---

## 🚀 Getting Started (Local Development)

If you are cloning this repository to run or develop locally, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (3.10+)
- [Docker](https://www.docker.com/) & Docker Compose
- A set of API Keys (Amadeus, SerpApi, BigDataCloud, Mapbox, etc.)

### 1. Clone the Repository

```bash
git clone https://github.com/larry6683/Big-Data-Project-Travel-App.git
cd Big-Data-Project-Travel-App
```

### 2. Environment Variables

You will need to set up local `.env` files for both the frontend and backend.

- **Backend**: Navigate to `/backend` and create a `.env` file containing your API keys, database URL, and Redis URL.
- **Frontend**: Navigate to `/frontend` and create a `.env.local` file pointing `NEXT_PUBLIC_API_URL` to your local backend.

### 3. Spin Up the App (Docker)

The easiest way to run the entire stack locally (including the local PostgreSQL and Redis containers) is using the provided start script or Docker Compose:

```bash
# Using the root start script (if configured)
./start.sh

# OR using Docker Compose directly
docker-compose up --build
```

The frontend will be available at `http://localhost:3000` and the backend API docs at `http://localhost:8000/docs`.

---

## ☁️ Cloud Deployment (GCP & Terraform)

This project is built for zero-downtime deployment on Google Cloud Platform.

1.  **Authenticate**: Ensure you are logged into the `gcloud` CLI.
2.  **Initialize Terraform**:
    ```bash
    cd terraform
    terraform init
    ```
3.  **Deploy Infrastructure**:
    Provide your variables (Project ID, Region) and apply the configuration. This will build the VPC, Cloud SQL, Redis, Pub/Sub topics, and Cloud Run services.
    `bash
    terraform apply
    `
    _Note: API keys in production are injected securely at runtime via Google Secret Manager._

---

## 🧪 Testing

We use `pytest` for backend unit testing and Selenium for frontend/integration testing.

### Backend Endpoint Testing

To run the backend test suite inside the Docker container:

```bash
cd ./backend
docker compose exec backend pytest -m regression
```

### Frontend / Full-Stack Selenium Testing

Ensure the application is running locally (e.g., via `./start.sh`). Install testing dependencies, then run the tests from the root `/tests` folder:

```bash
# Run the full regression suite
pytest -m regression

# Run a quick smoke test
pytest -m smoke
```
