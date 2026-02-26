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
COPY the_last_check.c /home/ctf/the_last_check.c
COPY flag.txt /home/ctf/flag.txt

# Compile the binary inside the container
RUN gcc the_last_check.c -o the_last_check -O0 -fno-stack-protector -no-pie && \
    strip the_last_check && \
    rm the_last_check.c

# Set permissions
RUN chown root:ctf /home/ctf/the_last_check /home/ctf/flag.txt && \
    chmod 755 /home/ctf/the_last_check && \
    chmod 644 /home/ctf/flag.txt

# Switch to ctf user
USER ctf

# Expose port
EXPOSE 9999

# Run with socat
CMD ["socat", "-T60", "TCP-LISTEN:9999,reuseaddr,fork", "EXEC:./the_last_check,stderr"]
