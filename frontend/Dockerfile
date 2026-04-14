FROM node:20-alpine
WORKDIR /app

# 1. Accept the URL during the build process
ARG NEXT_PUBLIC_API_URL
# 2. Make it available to Next.js while it compiles
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy code and BUILD
COPY . .
# Add these lines
ARG NEXT_PUBLIC_PROTOMAPS_KEY
ENV NEXT_PUBLIC_PROTOMAPS_KEY=$NEXT_PUBLIC_PROTOMAPS_KEY

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]