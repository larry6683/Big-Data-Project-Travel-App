# 🎨 WanderPlan Frontend

The frontend for WanderPlan is a highly responsive, modern web application built to consume our complex backend data and display it in an intuitive, map-integrated dashboard.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Mapping**: Leaflet / React-Leaflet

## 🔑 Environment Variables (`.env.local`)

Create a `.env.local` file in the `frontend/` directory. The frontend requires variables to know where to send its API requests and how to render maps.

# Backend API Connection

# Local Development:

NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# URL for your deployed production backend

NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# Production (Update when deployed):

# NEXT_PUBLIC_API_URL=[https://api.yourdomain.com/v1](https://api.yourdomain.com/v1)

## Running with Docker 🐳

If you prefer to run the application using Docker, ensure you have Docker and Docker Compose installed.

To build the images and start the containers in the background (detached mode):

```bash
docker-compose up --build -d
```

To stop the containers and completely remove the associated volumes (useful for wiping the database clean):

```bash
docker-compose down -v
```
