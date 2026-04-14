# Use Node.js 20 to satisfy Next.js >=20.9.0 requirement
FROM node:20-alpine

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose port 3000 for local access
EXPOSE 3000

# Run Next.js in development mode with 0.0.0.0 binding so it is accessible outside the container
CMD ["npm", "run", "dev"]