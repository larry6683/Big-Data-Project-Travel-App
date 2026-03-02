# Big Data Travel Planning Application (API Aggregator)

A centralized, Big Data-driven travel planning application that aggregates data from multiple publicly available APIs. This project serves as an itinerary generator and cost estimator for trips, focusing on intelligent data aggregation, high-performance caching, and a clean user experience.

## Team Members

Sujith Battu, Saiteja Poluka, Emerson Liu, Jack McKinstry, Kushal Sai Ravindra, Sarthak Paithankar

## Tech Stack

- **Backend:** Python, FastAPI
- **Frontend:** React.js, Vite, Tailwind CSS
- **Caching Layer:** Redis (used for temporary data storage and all-time trending analytics)
- **External APIs:** \* Amadeus (Flights, Hotels, Activities)
- OpenWeatherMap (30-day Forecast & 1-Year Historical Estimates)
- OpenStreetMap Overpass API (Attractions & Points of Interest)
- OSRM - Open Source Routing Machine (Driving Routes)

---

## Core Microservices

The backend is decoupled into distinct domain services to ensure high availability and clean data parsing:

1. **Search Service:** Tracks global trending destinations and routes using Redis Sorted Sets.
2. **Flight Service:** Converts GPS coordinates to nearest airports and fetches round-trip itineraries.
3. **Driving Service:** Calculates routing geometry, distance, and duration between GPS coordinates.
4. **Stays (Hotel) Service:** Uses a high-performance two-step bulk availability check to eliminate sold-out rooms before sending data to the frontend.
5. **Weather Service:** Intelligently switches between live forecast data and 1-year historical data based on how far in the future the trip is scheduled.
6. **Activities Service:** Fetches tours and experiences, sorted by distance.
7. **Attractions Service:** Queries OpenStreetMap for highly-filtered, categorized local amenities, tourism, and historic sites.

---

## Project Structure

This is a monorepo containing both the frontend and backend:

- `/backend`: The FastAPI Python application, handling API aggregation, data cleaning, and Redis caching.
- `/frontend`: The React(NextJs) user interface.

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Python 3.10+**
- **Node.js & npm**
- **Redis Server** (Running locally on port 6379)
- An active [Amadeus for Developers](https://developers.amadeus.com/) account for flight/hotel API keys.
- An active [OpenWeatherMap](https://openweathermap.org/api) account for the weather API key.

---

## Backend Setup Instructions

1. **Navigate to the backend directory:**

```bash
cd backend

```

2. **Create and activate a virtual environment:**

- **Mac/Linux:**

```bash
python -m venv .venv
source .venv/bin/activate

```

- **Windows:**

```bash
python -m venv .venv
.venv\Scripts\activate

```

3. **Install dependencies:**

```bash
pip install -r requirements.txt

```

4. **Environment Variables:**
   Create a `.env` file inside the `/backend` folder and add your credentials:

```ini
PROJECT_NAME="Big Data Travel Planner"
VERSION="1.0.0"
API_V1_STR="/api/v1"
SECRET_KEY="your_secret_key"

# Amadeus Keys
AMADEUS_CLIENT_ID="your_amadeus_api_key"
AMADEUS_CLIENT_SECRET="your_amadeus_api_secret"

# OpenWeatherMap Key
WEATHER_API_KEY="your_openweather_api_key"

# Database / Cache
REDIS_URL="redis://127.0.0.1:6379/0"

```

5. **Start the Redis Server:**
   Ensure your local Redis server is running in the background. (e.g., `brew services start redis` on Mac).
6. **Run the FastAPI Server:**

```bash
python -m uvicorn app.main:app --reload

```

The API documentation (Swagger UI) will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
