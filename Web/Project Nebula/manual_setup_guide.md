# build the Docker image
sudo docker build -t graphql-ctf .

# stop the container
sudo docker stop graphql-ctf

# remove the container
sudo docker rm graphql-ctf

# run the container
sudo docker run -d \
  --name graphql-ctf \
  -p 4000:4000 \
  --restart unless-stopped \
  -e ADMIN_TOKEN="admin_secret" \
  -e SECRET_VALUE="SEASIDES{gr4phql_h1dd3n_s3cr3t}" \
  graphql-ctf