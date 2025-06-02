#!/bin/bash

# Install `nc` only if it doesn't exist
if ! command -v nc &> /dev/null; then
    echo "netcat not found, installing..."
    sudo apt update && sudo apt install netcat -y
else
    echo "netcat is already installed"
fi

# Set DOCKER_HOST_ADDR for dev container networking
# This allows OpenHands running inside the dev container to connect to
# sandbox containers that are created on the host Docker daemon
export DOCKER_HOST_ADDR=172.17.0.1
echo "export DOCKER_HOST_ADDR=172.17.0.1" >> ~/.bashrc

echo "DOCKER_HOST_ADDR set to $DOCKER_HOST_ADDR for dev container networking"

# Do common setup tasks
source .openhands/setup.sh
