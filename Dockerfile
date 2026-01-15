# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Set Node.js memory limit for build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies (clean, reproducible)
RUN npm ci --no-audit --no-fund --prefer-offline

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:1.27-alpine

# Cloud Run listens on $PORT (defaults to 8080)
ENV PORT=8080

# Remove default config to avoid duplicate servers
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Use Nginx envsubst to inject $PORT at runtime
# The official image will render templates from /etc/nginx/templates/*.template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose Cloud Run port
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
