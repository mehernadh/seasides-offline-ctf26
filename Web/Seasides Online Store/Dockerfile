FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package manifests first (better caching)
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --omit=dev

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Now copy the full source
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Build the frontend (output -> /app/frontend/dist)
WORKDIR /app/frontend

# Fix vite permission issue (Alpine + npm)
RUN chmod +x node_modules/.bin/vite

RUN npm run build

# Run backend in production, serving the built frontend
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]
