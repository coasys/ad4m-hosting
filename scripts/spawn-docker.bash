#!/bin/bash

if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker and run this script again."
    exit
fi

docker swarm init --advertise-addr 127.0.0.1

EOF