# ---- Base Node ----
FROM node:20-alpine AS base
WORKDIR /usr/src/app
RUN apk add --no-cache dumb-init
ENV NODE_ENV=development

# ---- Dependencies ----
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# ---- Build ----
FROM dependencies AS build
ENV NODE_ENV=production
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PORT=3001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy only necessary files from previous stages
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/package-lock.json ./package-lock.json

# Install production dependencies
# We need to prune development dependencies and then install only production ones
# Alternatively, if your npm ci in 'dependencies' stage is already optimized,
# you might be able to skip reinstalling if node_modules can be copied selectively.
# For robustness, we'll reinstall prod dependencies.
RUN npm prune --production && npm ci --omit=dev

# Expose the port the app runs on
EXPOSE ${PORT}

# Run the app using dumb-init
CMD ["dumb-init", "node", "dist/main.js"]