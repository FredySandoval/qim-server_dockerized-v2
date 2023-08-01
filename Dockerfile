ARG NODE_VERSION=19.9.0
# Stage 1: Build the Client
FROM node:${NODE_VERSION}-alpine AS client-build
WORKDIR /client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build


FROM node:${NODE_VERSION}-alpine as base
# Set working directory for all build stages.
WORKDIR /server


################################################################################
# Create a stage for installing production dependecies.
FROM base as deps
# COPY server/package.json server/package-lock.json ./
RUN --mount=type=bind,source=server/package.json,target=package.json \
    --mount=type=bind,source=server/package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Create a stage for building the application.
FROM deps as build
# Download additional development dependencies before building, as some projects require
# "devDependencies" to be installed to build. If you don't need this, remove this step.
RUN --mount=type=bind,source=server/package.json,target=package.json \
    --mount=type=bind,source=server/package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source files into the image.
COPY server/ .
# Run the build script.
RUN npm run build

FROM build as server-build
COPY server/package.json .
# Copy the rest of the server code
COPY --from=client-build /client/dist ./dist/public 
COPY --from=deps /server/node_modules ./node_modules
COPY --from=build /server/dist ./dist

EXPOSE 3000
CMD npm run start