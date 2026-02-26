# build the challenge 
docker compose build --no-cache

# start the challenge 
docker compose up -d

# verify status 
docker compose ps

# Clean the previous setup
docker compose down --rmi all --volumes

