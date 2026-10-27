# Echo C backend, packaged for Render (Docker runtime).
# Build context = this backend/ folder.

FROM debian:bookworm-slim AS build
RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc libc6-dev \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY . .
RUN gcc -std=c11 -O2 -o echo_server server.c music.c json.c

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /src/echo_server /app/echo_server
# HOST=0.0.0.0 lets Render's router reach the server (local runs stay on 127.0.0.1).
# PORT is supplied by Render at runtime.
# DATA_DIR / MEDIA_DIR point at the persistent disk mounted at /data (see render.yaml).
# FRONTEND_DIR is empty: the frontend lives on Vercel, so this container serves only the API.
ENV HOST=0.0.0.0 \
    DATA_DIR=/data \
    MEDIA_DIR=/data/media \
    FRONTEND_DIR=
EXPOSE 10000
CMD ["/app/echo_server"]
