# 🌍 WanderPlan US | Big Data Travel Planner

WanderPlan US is a comprehensive, full-stack travel planning application that leverages big data to generate highly customized itineraries. It aggregates flights, driving routes, local stays, real-time weather, attractions, and local tours into a single, seamless, and responsive interface.

## 🏗️ Project Architecture

This project is structured as a monorepo containing two primary environments:

* **`/frontend`**: A Next.js (React) application styled with Tailwind CSS, featuring interactive routing, responsive layouts, and dynamic maps via Leaflet.
* **`/backend`**: A robust Python FastAPI backend that handles external API integrations, geographic calculations, and data aggregations.

## ✨ Core Features
* **Multi-Modal Travel**: Compare flight data vs. driving routes (including distance, time, and waypoints).
* **Interactive Mapping**: Dynamic Leaflet maps with custom markers for visualizing trips.
* **Comprehensive Itineraries**: View hotels, attractions, tours, and weather forecasts tailored to specific travel dates and budgets.
* **Responsive UI**: A universal layout with a collapsible sidebar for mobile/tablet and a side-by-side persistent map for desktop views.

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Python](https://www.python.org/) (3.10+)
* [Docker](https://www.docker.com/) (Optional, for containerized deployments)

### Running the Project Locally

1.  **Start the Backend**:
    Navigate to the `backend` directory, install the Python dependencies, and run the FastAPI server. (See `backend/README.md` for detailed instructions).
2.  **Start the Frontend**:
    Navigate to the `frontend` directory, install the Node modules, and run the Next.js development server. (See `frontend/README.md` for detailed instructions).

## 🐳 Docker Setup
Both the frontend and backend include `Dockerfile` and `docker-compose.yml` configurations. You can spin up the individual services using Docker to ensure consistent environments.

Alternatively you can spin up a singular Docker parent container using ./start.sh