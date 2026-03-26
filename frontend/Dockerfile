# Use Node.js 20 to satisfy Next.js >=20.9.0 requirement
FROM node:20-alpine

WORKDIR /app

# Install dependencies based on package.json
COPY package.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose port 3000
EXPOSE 3000

# Run Next.js in development mode with 0.0.0.0 binding
CMD ["npm", "run", "dev"]
