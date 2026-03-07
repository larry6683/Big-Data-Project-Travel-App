

# ✈️ AI-Powered Travel Planner

A modern, full-stack travel orchestration platform built with **Next.js 15**, **FastAPI**, and **Elasticsearch**. This project uses a modular Docker architecture to manage independent frontend and backend lifecycles.

## 🏗️ System Architecture

* **Frontend**: Next.js 15 (App Router) with Tailwind CSS and Lucide icons.
* **Backend**: FastAPI (Python 3.10) with asynchronous request handling.
* **Search Engine**: Elasticsearch 8.x for `search-as-you-type` city and airport autocomplete.
* **Cache/Analytics**: Redis for tracking trending locations and session caching.
* **Data Sources**: Amadeus API (Flights/Hotels) and OpenStreetMap (GPS Reverse Geocoding).

---

## 🚀 Getting Started

### 1. Prerequisites

* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
* An Amadeus Developer API Key.

### 2. Network & Volume Setup

Before launching the containers, create the shared infrastructure:

```bash
# Create the bridge network for inter-container communication
docker network create travel-app-network

# Create the persistent volume for Elasticsearch data
docker volume create travel_es_data

```

### 3. Backend & Database Launch

```bash
cd backend
# Add your AMADEUS_CLIENT_ID and SECRET to .env
docker compose up --build -d

```

* **API Documentation**: `http://localhost:8000/docs`
* **Elasticsearch Status**: `http://localhost:9200`

### 4. Frontend Launch

```bash
cd frontend
docker compose up --build -d

```

* **Application URL**: `http://localhost:3000`

---

## 🛠️ Key Features

### 🔍 Smart Search Service

Uses Elasticsearch to provide instant city and airport suggestions.

* **City Detection**: Internal Elasticsearch index with fuzzy matching.
* **Airport Detection**: Fallback to Amadeus API for IATA codes.
* **GPS Support**: One-click "Nearest City" detection using the browser Geolocation API and Nominatim.

### 🍪 Global State Persistence

The search state (source, destination, dates, budget) is synchronized across the application using `js-cookie`. This allows the Trip Generator and Map services to access user preferences without redundant API calls.

---

## 📂 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/             # API Endpoints (locations, trips)
│   │   ├── core/            # Config, Security, and DB init
│   │   └── services/        # Third-party API integrations
│   ├── Dockerfile           # Python 3.10-slim + Build tools
│   └── docker-compose.yml   # FastAPI + Redis + Elasticsearch
├── frontend/
│   ├── app/
│   │   ├── components/      # Sidebar.tsx, Map.tsx, UI elements
│   │   └── layout.tsx       # Global Sidebar integration
│   ├── Dockerfile           # Node 20-alpine
│   └── docker-compose.yml   # Next.js Service
└── README.md

```

---

## 🔧 Troubleshooting

| Issue | Solution |
| --- | --- |
| **"ModuleNotFoundError: elasticsearch"** | Ensure `elasticsearch` is in `backend/requirements.txt` and run `docker compose build --no-cache`. |
| **"Next.js requires Node >=20"** | The provided `frontend/Dockerfile` uses `node:20-alpine` to satisfy this. |
| **GPS not working** | Browsers require `localhost` or `HTTPS` for geolocation. Ensure your API_BASE_URL is correct. |
| **Elasticsearch not reachable** | Verify both compose files are using the same external network: `travel-app-network`. |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Would you like me to add a "Contribution Guide" section explaining how to add new API endpoints to the backend?**