# Echo C backend, packaged for Render (Docker runtime).
# Build context = this backend/ folder.

FROM debian:bookworm-slim AS build
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libmongoc-dev \
    libbson-dev \
    pkg-config \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY . .

# Compile with MongoDB C driver flags
RUN gcc -std=c11 -O2 -o echo_server server.c music.c json.c \
    $(pkg-config --cflags --libs libmongoc-1.0 libbson-1.0)

FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    libmongoc-1.0-0 \
    libbson-1.0-0 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /src/echo_server /app/echo_server

# HOST=0.0.0.0 lets Render's router reach the server (local runs stay on 127.0.0.1).
# PORT is supplied by Render at runtime.
# DATA_DIR / MEDIA_DIR point at persistent paths or defaults.
# FRONTEND_DIR is empty: the frontend lives on Vercel, so this container serves only the API.
ENV HOST=0.0.0.0 \
    DATA_DIR=/data \
    MEDIA_DIR=/data/media \
    FRONTEND_DIR=

EXPOSE 10000
CMD ["/app/echo_server"]
