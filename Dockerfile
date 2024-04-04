# Stage 1: Builder stage
FROM node:18.19.0 AS builder

WORKDIR /app

# Copy package.json and yarn.lock files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Production stage
FROM node:18.19.0-slim

WORKDIR /app

# Copy built files and node_modules from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Set entry point
ENTRYPOINT ["node", "./bin/afj-rest.js", "start"]



