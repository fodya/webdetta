#!/bin/bash

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

cd -- $(dirname "$FILE")

TMP=$(mktemp -d)
envsubst < "$FILE" > "$TMP/docker-compose.yml"
echo "Generated file: $TMP/docker-compose.yml"


export DOCKER_HOST="ssh://$SSH"
docker compose \
  --file "$TMP/docker-compose.yml" \
  ${NAME:+ -p "$NAME"} \
  up --build $FLAGS &&
docker ps
