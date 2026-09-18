FROM python:3.11-slim-bookworm

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install core utilities: curl, ca-certificates, gnupg, git, default-mysql-client, procps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    git \
    default-mysql-client \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x LTS from official NodeSource repository
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pre-install Python backend dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Pre-install frontend dependencies
COPY frontend/package*.json /app/frontend/
RUN cd /app/frontend && npm install

# Copy entrypoint supervisor
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose ports:
# 3000: Vite development server + reverse proxy to /api
# 5001: Flask REST API (direct backend access)
EXPOSE 3000 5001

ENTRYPOINT ["/entrypoint.sh"]
