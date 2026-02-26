# Make build script executable
chmod +x build.sh

# Compile all binaries
./build.sh

# Build and start all Docker containers
docker-compose up -d --build

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Stop all containers
docker-compose down

# Restart specific challenge
docker-compose restart berry_counter
docker-compose restart colossal_leak
docker-compose restart the_last_check



Quick Start Guide:

# Step 1: Compile binaries
./build.sh

# Step 2: Build and start Docker containers
docker-compose up -d --build

# Step 3: Check status
./manage.sh status

# Step 4: Test connections
nc localhost 9003
nc localhost 9005
nc localhost 9007

# Step 5: View logs
./manage.sh logs




Firewall Configuration:

# Allow CTF ports
sudo ufw allow 9003/tcp
sudo ufw allow 9005/tcp
sudo ufw allow 9007/tcp

# Check status
sudo ufw status




Summary of commands:

# Complete setup
./build.sh
docker-compose up -d --build

# Management
./manage.sh start    # Start all challenges
./manage.sh stop     # Stop all challenges
./manage.sh restart  # Restart all challenges
./manage.sh status   # Check status
./manage.sh logs     # View logs
./manage.sh test     # Test connections
./manage.sh clean    # Clean up everything

# Individual container management
docker-compose restart berry_counter
docker-compose logs -f berry_counter
docker-compose restart colossal_leak
docker-compose logs -f colossal_leak
docker-compose restart the_last_check
docker-compose logs -f the_last_check"# PWN" 
