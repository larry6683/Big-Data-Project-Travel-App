# backend/tests/Dockerfile
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the backend root
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Explicitly install pytest and testing tools (if they aren't in requirements.txt)
RUN pip install --no-cache-dir pytest httpx pytest-asyncio

# Copy the entire backend application into the container
COPY . .

# The default command will run pytest against the tests/ directory
CMD ["pytest", "tests/", "-v"]