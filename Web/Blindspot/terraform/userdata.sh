#!/bin/bash
set -xe

exec > /var/log/userdata.log 2>&1

apt update -y
apt upgrade -y

apt install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  unzip

curl -fsSL https://get.docker.com | sh

systemctl enable docker
systemctl start docker

usermod -aG docker ubuntu

mkdir -p /usr/local/lib/docker/cli-plugins

curl -SL https://github.com/docker/compose/releases/download/v2.25.0/docker-compose-linux-x86_64 \
-o /usr/local/lib/docker/cli-plugins/docker-compose

chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ---- wait for terraform file provisioner ----
while [ ! -f /home/ubuntu/app.zip ]; do
  sleep 2
done

cd /home/ubuntu

unzip -o app.zip

# VERY IMPORTANT for nginx 403
chmod -R o+rX /home/ubuntu/site

docker compose up -d
