# build the Docker image
sudo docker build -t seasides_store .

# run the container
sudo docker run -d \
  --name seasides_store \
  -p 5000:4000 \
  seasides_store

# stop the container
sudo docker stop seasides_store

# remove the container
sudo docker rm seasides_store

# restart the container
sudo docker start seasides_store
