#!/bin/bash

SSH="$SSH_USER@$SSH_HOST"

ssh $SSH bash <<eof
  if [ "$(which docker)" == "" ]; then
    curl -fsSL https://get.docker.com | bash
  fi
  sudo groupadd docker >/dev/null 2>&1
  sudo usermod -aG docker \$USER
eof

export DOCKER_HOST="ssh://$SSH"
docker compose --file $COMPOSE_FILE -p $COMPOSE_PROJECT_NAME up --build -d
docker ps
