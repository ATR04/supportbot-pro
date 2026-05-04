FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better Docker layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose the port Railway assigns
EXPOSE 8080

# Start with IPv4-first DNS — fixes ENETUNREACH on cloud providers
CMD ["node", "--dns-result-order=ipv4first", "src/index.js"]
