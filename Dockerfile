# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

RUN npm install -g nodemon

# Copy the rest of the application code
COPY . .

# Start the Node.js application
CMD ["nodemon"]
