# Use the official Node.js image from the Docker Hub
FROM node:14

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

RUN mkdir -p /app/diplomas

# Copy the rest of the application code
COPY . .


# Define the command to run the app
CMD ["node", "index.js"]