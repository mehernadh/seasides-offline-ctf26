#!/bin/bash
set -euxo pipefail

LOG=/var/log/userdata.log
exec > >(tee -a $LOG) 2>&1

echo "[+] Starting userdata script"

# -------------------------------------------------
# Basic setup
# -------------------------------------------------

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get upgrade -y
apt install gcc -y

apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  unzip \
  build-essential
 

# -------------------------------------------------
# Docker installation (official method)
# -------------------------------------------------

if ! command -v docker >/dev/null 2>&1; then
  echo "[+] Installing Docker"
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable docker
systemctl start docker

# -------------------------------------------------
# Docker Compose plugin (docker compose)
# -------------------------------------------------

if ! docker compose version >/dev/null 2>&1; then
  echo "[+] Installing docker compose plugin"
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# -------------------------------------------------
# Allow ubuntu user to run docker
# -------------------------------------------------

usermod -aG docker ubuntu

# -------------------------------------------------
# WAIT for Terraform file provisioner
# -------------------------------------------------

echo "[+] Waiting for /home/ubuntu/app.zip from Terraform..."

for i in $(seq 1 120); do
  if [ -f /home/ubuntu/app.zip ]; then
    echo "[+] app.zip received"
    break
  fi
  sleep 5
done

if [ ! -f /home/ubuntu/app.zip ]; then
  echo "[-] app.zip not found after waiting"
  exit 1
fi

# -------------------------------------------------
# Unpack app and build challenges
# -------------------------------------------------

cd /home/ubuntu

unzip -o app.zip

chown -R ubuntu:ubuntu /home/ubuntu

cd /home/ubuntu

chmod +x build.sh

# -------------------------------------------------
# Build binaries and start PWN challenges
# -------------------------------------------------

sudo -u ubuntu ./build.sh

sudo -u ubuntu docker compose up -d --build
