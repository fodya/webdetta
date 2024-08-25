#!/bin/bash

SSH="$SSH_USER@$SSH_HOST"

status=$(ssh -o BatchMode=yes -o ConnectTimeout=5 $SSH echo ok 2>&1)
if [[ $status == ok ]] ; then
  :
else
  echo "SSH connection error: $status"
  exit 1
fi

ssh $SSH bash <<eof
  if [ "\$(which docker)" == "" ]; then
    curl -fsSL https://get.docker.com | bash
  fi
  sudo groupadd docker >/dev/null 2>&1
  sudo usermod -aG docker \$USER
eof

export DOCKER_HOST="ssh://$SSH"
docker compose --file $DOCKER_COMPOSE_FILE -p $COMPOSE_PROJECT_NAME up --build --renew-anon-volumes -d
docker ps
