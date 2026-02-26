#!/bin/bash

case "$1" in
    start)
        echo "Starting CTF challenges..."
        docker-compose up -d
        docker-compose ps
        ;;
    stop)
        echo "Stopping CTF challenges..."
        docker-compose down
        ;;
    restart)
        echo "Restarting CTF challenges..."
        docker-compose restart
        docker-compose ps
        ;;
    logs)
        docker-compose logs -f
        ;;
    build)
        echo "Building binaries..."
        ./build.sh
        echo "Building Docker images..."
        docker-compose build
        ;;
    status)
        docker-compose ps
        echo ""
        echo "Port Mappings:"
        echo "Berry Counter: localhost:9003"
        echo "Colossal Leak: localhost:9005"
        echo "The Last Check: localhost:9007"
        ;;
    test)
        echo "Testing connections..."
        echo ""
        echo "Testing Berry Counter (port 9003):"
        timeout 2 nc localhost 9003 < /dev/null
        echo ""
        echo "Testing Colossal Leak (port 9005):"
        timeout 2 nc localhost 9005 < /dev/null
        echo ""
        echo "Testing The Last Check (port 9007):"
        timeout 2 nc localhost 9007 < /dev/null
        ;;
    clean)
        echo "Cleaning up..."
        docker-compose down -v
        docker system prune -f
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|build|status|test|clean}"
        exit 1
        ;;
esac
