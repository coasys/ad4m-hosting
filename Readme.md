### Build docker image
docker build -t ad4m-hosting-image-alphine ./docker/

### List docker services
docker service ls

### Remove docker service
docker service rm my-service

### Update docker service
docker service update --replicas=0 wnt7u9yytjvevnbc3hryufnnv

### Create docker service
docker service create --name ad4m-hosting-service-1 --publish published=12001,target=12000 --env REQUEST_CREDENTIALS=admin --detach=true ad4m-hosting-image