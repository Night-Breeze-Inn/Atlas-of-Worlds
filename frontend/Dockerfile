# ---- Base Node for Build Stage ----
FROM node:20-alpine AS build-stage
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Set the API URL for the build (will be proxied by Nginx in production)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the application
RUN npm run build

# ---- Production Stage with Nginx ----
FROM nginx:1.25-alpine AS production-stage

# Remove default Nginx server configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
# We will create this nginx.conf file next
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from the build-stage
COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html

# Expose port 80 (Nginx default)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]