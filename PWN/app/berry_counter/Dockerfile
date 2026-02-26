FROM ubuntu:24.04

# Install dependencies
RUN apt-get update && \
    apt-get install -y socat gcc && \
    rm -rf /var/lib/apt/lists/*

# Create ctf user
RUN useradd -m -s /bin/bash ctf

# Set working directory
WORKDIR /home/ctf

# Copy source code and flag
COPY berry_counter.c /home/ctf/berry_counter.c
COPY flag.txt /home/ctf/flag.txt

# Compile the binary inside the container
RUN gcc berry_counter.c -o berry_counter -fno-stack-protector && \
    rm berry_counter.c

# Set permissions
RUN chown root:ctf /home/ctf/berry_counter /home/ctf/flag.txt && \
    chmod 755 /home/ctf/berry_counter && \
    chmod 644 /home/ctf/flag.txt

# Switch to ctf user
USER ctf

# Expose port
EXPOSE 9999

# Run with socat
CMD ["socat", "-T60", "TCP-LISTEN:9999,reuseaddr,fork", "EXEC:./berry_counter,stderr"]
