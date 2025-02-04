# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Angular app
RUN npm run build -- --configuration production

# Expose port 80
EXPOSE 80

# Serve the app using a simple HTTP server
CMD ["npx", "http-server", "dist/your-app-name", "-p", "80"]