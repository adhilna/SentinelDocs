# Stage 1: Build React/Next.js
FROM node:18.20-alpine AS build

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Run the build command (Vite, Next, or CRA)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# NOTE: Verify if your build output folder is 'dist', 'build', or '.next'
# If you are using Vite, 'dist' is correct. 
# If you are using Create React App, change 'dist' to 'build'.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]