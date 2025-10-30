# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Declare build argument for Vite environment variable
ARG VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN VITE_API_BASE_URL=$VITE_API_BASE_URL npm run build

# Set environment variable for the build stage
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
