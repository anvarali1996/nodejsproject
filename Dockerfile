# Use official Node.js 18 image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose port for Fly.io (needed even if your bot uses polling)
ENV PORT=3000

# Run your bot
CMD ["node", "index.js"]
