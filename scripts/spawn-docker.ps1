# Check if Docker is installed
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Output "Docker is not installed. Please install Docker and run this script again."
    exit
}

docker swarm init --advertise-addr 127.0.0.1

exit