#!/bin/bash
echo "Building CTF Challenge Binaries..."

echo "Building Berry Counter CTF Challenge..."
# Berry Counter
echo "[1/3] Compiling Berry Counter..."
gcc berry_counter/berry_counter.c -o berry_counter/berry_counter -fno-stack-protector
if [ $? -eq 0 ]; then
    echo "✓ Berry Counter compiled successfully"
else
    echo "✗ Berry Counter compilation failed"
fi
echo "Building Berry Counter CTF challenge complete!"

echo ""

echo "Building Colossal Leak CTF Challenge..."
# Colossal Leak
echo "[2/3] Compiling Colossal Leak..."
gcc colossal_leak/colossal_leak.c -o colossal_leak/colossal_leak -no-pie
if [ $? -eq 0 ]; then
    echo "✓ Colossal Leak compiled successfully" 
else
    echo "✗ Colossal Leak Compliation Failed"
fi
echo "Building Colossal Leak CTF challenge complete!"

echo ""

#The LastCheck
echo "Building The Last Check CTF Challenge..."
echo "[3/3] Compiling The Last Check..."
gcc the_last_check/the_last_check.c -o the_last_check/the_last_check -fno-stack-protector -no-pie
if [ $? -eq 0 ]; then
    echo "✓ The Last Check compiled successfully"
else
    echo "✗ The Last Check compilation failed"
fi
echo "Building The Last Check CTF challenge complete!"

echo ""

echo "All Challenges Build Completed!"
