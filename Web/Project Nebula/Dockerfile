# ---------- STAGE 1: Build frontend ----------
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install build deps (Vite + react) and build the app
COPY frontend/package*.json ./
RUN npm ci --silent

# Copy frontend source and build
COPY frontend/ ./

# Fix vite permission issue
RUN chmod +x node_modules/.bin/vite

RUN npm run build --silent


# ---------- STAGE 2: Install backend (production deps) ----------
FROM node:18-alpine AS backend-deps
WORKDIR /app/backend

# Install only production deps for runtime
COPY backend/package*.json ./
RUN npm ci --only=production --silent


# ---------- STAGE 3: Final image ----------
FROM node:18-alpine

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

# Copy backend runtime deps and code
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend

# Copy built frontend into backend/public
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Ensure proper ownership
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the port the backend listens on
EXPOSE 4000

# Environment variables can be provided by CTFd runner
ENV PORT=4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- --timeout=2 http://127.0.0.1:4000/ || exit 1

# Final command
CMD ["node", "backend/graphql_server.js"]
