FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_SECRET=build-only-placeholder
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV PAYLOAD_DB_PUSH=false
RUN npm run build

FROM node:24-bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv ca-certificates \
    && python3 -m venv /opt/video-python \
    && /opt/video-python/bin/pip install --no-cache-dir Pillow numpy \
    && rm -rf /var/lib/apt/lists/*
ENV PATH="/opt/video-python/bin:${PATH}"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /app /app
RUN mkdir -p storage public/media && chown -R node:node storage public/media .next
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]
