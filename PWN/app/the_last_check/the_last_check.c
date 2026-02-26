#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <stdint.h>
#include <time.h>

char *gets(char *);

/* ============================================================
 * CONFIGURATION
 * ============================================================ */

#define CMD_BUF 64
#define LOOP_DELAY 120000
#define NOISE_ITERS 256
#define MAX_JITTER_US 900000   /* max ~0.9s */

/* ============================================================
 * AIRCRAFT STRUCT
 * ============================================================ */

typedef struct {
    int altitude;
    int pad1;
    int target_altitude;
    int pad2;
    int autopilot_enabled;
    int pad3;

    char last_cmd[CMD_BUF];   /* moved here, comment unchanged */

    int maintenance_mode;     
    int integrity;            
    int state;
    int pad4;
    int abuse_score;         
} aircraft_t;

/* ============================================================
 * SUBSYSTEMS
 * ============================================================ */

static uint32_t noise_mix(uint32_t x) {
    x ^= 0x9e3779b9;
    x = (x << 7) | (x >> 25);
    x ^= (x >> 16);
    x += 0xdeadbeef;
    return x;
}

static void fake_sensor_pipeline() {
    volatile uint32_t x = rand();
    for (int i = 0; i < NOISE_ITERS; i++)
        x = noise_mix(x + i);
}

static void fake_watchdog() {
    volatile int w = 0;
    for (int i = 0; i < 128; i++)
        w ^= i * 0x1337;
}

/* ============================================================
 * MACHINE STATE
 * ============================================================ */

enum {
    SYS_INIT,
    SYS_PREFLIGHT,
    SYS_ALIGN,
    SYS_CALIBRATE,
    SYS_STANDBY,
    SYS_ACTIVE,
    SYS_MONITOR,
    SYS_ALERT,
    SYS_FAULT,
    SYS_RECOVER,
    SYS_SHUTDOWN,
    SYS_MAINT
};

static void fake_state_step(aircraft_t *p) {
    switch (p->state) {
        case SYS_INIT:       p->state = SYS_PREFLIGHT; break;
        case SYS_PREFLIGHT: p->state = SYS_ALIGN;     break;
        case SYS_ALIGN:     p->state = SYS_CALIBRATE; break;
        case SYS_CALIBRATE: p->state = SYS_STANDBY;   break;
        case SYS_STANDBY:   p->state = SYS_ACTIVE;    break;
        case SYS_FAULT:     p->state = SYS_RECOVER;   break;
        case SYS_RECOVER:   p->state = SYS_ACTIVE;    break;
        case SYS_SHUTDOWN:  exit(1);
        default: break;
    }
}

/* ============================================================
 * UI
 * ============================================================ */

void banner() {
    puts("=======================================");
    puts("   AUTOPILOT SAFETY CHECK INTERFACE");
    puts("=======================================");
}

void show_status(aircraft_t *p) {
    printf("\n[STATUS]\n");
    printf(" Altitude        : %d ft\n", p->altitude);
    printf(" Target Altitude : %d ft\n", p->target_altitude);
    printf(" Autopilot       : %s\n",
           p->autopilot_enabled ? "ENGAGED" : "DISABLED");
    printf(" System State    : %d\n", p->state);
    puts("---------------------------------------");
}

/* ============================================================
 * SAFETY
 * ============================================================ */

void safety_check(aircraft_t *p) {
    if (p->altitude <= 0) {
        puts("\nCRITICAL FAILURE!");
        puts("Aircraft crashed :()");
        exit(1);
    }
}

/* ============================================================
 * AUTOPILOT LOGIC
 * ============================================================ */

void autopilot_logic(aircraft_t *p) {
    if (!p->autopilot_enabled)
        return;

    if (p->altitude < p->target_altitude)
        p->altitude += 40;
    else if (p->altitude > p->target_altitude)
        p->altitude -= 40;
}

/* ============================================================
 * MAINTENANCE MODE
 * ============================================================ */

void maintenance_flag() {
    FILE *fp = fopen("flag.txt", "r");
    if (!fp) {
        puts("Maintenance failure.");
        exit(1);
    }
    char flag[128];
    fgets(flag, sizeof(flag), fp);
    fclose(fp);

    puts("\n⚠ MAINTENANCE MODE ACTIVE ⚠");
    puts(flag);
    exit(0);
}

void emergency_override(aircraft_t *p) {
    if (p->maintenance_mode) {
        maintenance_flag();
    } else {
        puts("Override denied. Logged.");
        p->abuse_score++; /* failed privileged action */
    }
}

/* ============================================================
 * DEBUG INTERFACE
 * ============================================================ */  

void debug_log(char *msg) {
    printf(msg); 
    puts("");
}

void debug_interface(aircraft_t *p, char *cmd) {
    if (!strncmp(cmd, "debug ", 6)) {
        p->abuse_score++;
        if (p->integrity != 0x1337) {
            puts("Debug interface locked.");
            return;
        }
        debug_log(cmd + 6);
    }
}

void heap_service(aircraft_t *p, char *cmd) {
    char *heap = malloc(64);
    if (!heap) return;

    strcpy(heap, cmd + 5);
    puts("Heap service response:");
    puts(heap);

    free(heap);
    p->abuse_score++;
}

/* ============================================================
 * CHECKSUM INTERFACE
 * ============================================================ */

uint32_t fake_checksum(const char *s) {
    uint32_t c = 0;
    while (*s)
        c = (c << 5) - c + (unsigned char)*s++;
    return c;
}

void fake_flag() {
    puts("\nSEASIDES{Y0U_D1NDNT_F1ND_TH3_L4ST_CH3CK}");
    exit(0);
}

void checksum_interface(aircraft_t *p, char *cmd) {
    uint32_t c = fake_checksum(cmd + 9);
    p->abuse_score++;
    if (c == 0x41414141)
        fake_flag();
    else
        puts("Checksum mismatch.");
}

/* ============================================================
 * ABUSE JITTER
 * ============================================================ */

void apply_jitter(aircraft_t *p) {
    if (p->abuse_score <= 0)
        return;

    int capped = p->abuse_score > 10 ? 10 : p->abuse_score;
    int jitter = (rand() % (capped * 80000));

    if (jitter > MAX_JITTER_US)
        jitter = MAX_JITTER_US;

    usleep(jitter);
}

/* ============================================================
 * COMMAND PARSER
 * ============================================================ */

void process_command(aircraft_t *p, char *cmd) {

    if (!strncmp(cmd, "debug ", 6)) {
        debug_interface(p, cmd);
        return;
    }

    if (!strncmp(cmd, "heap ", 5)) {
        heap_service(p, cmd);
        return;
    }

    if (!strncmp(cmd, "checksum ", 9)) {
        checksum_interface(p, cmd);
        return;
    }

    if (!strncmp(cmd, "status", 6))
        return;

    if (!strncmp(cmd, "set altitude ", 13)) {
        int v = atoi(cmd + 13);
        p->target_altitude = v;
        puts("Target altitude updated.");
        return;
    }

    if (!strncmp(cmd, "disable autopilot", 17)) {
        p->autopilot_enabled = 0;
        return;
    }

    if (!strncmp(cmd, "override", 8)) {
        emergency_override(p);
        return;
    }

    puts("Unknown command.");
    p->abuse_score++;
}

void unsafe_read(char *b) {
    read(0, b, CMD_BUF * 2);
}


void read_command(aircraft_t *p) {
    char buf[CMD_BUF * 2];

    fake_sensor_pipeline();
    fake_watchdog();

    printf("\nCommand > ");
    fflush(stdout);

    unsafe_read(buf);
    strcpy(p->last_cmd, buf);

    process_command(p, buf);
    apply_jitter(p);
}

/* ============================================================
 * MAIN LOOP
 * ============================================================ */

int main() {
    srand(time(NULL));

    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);

    aircraft_t plane;
    memset(&plane, 0, sizeof(plane));

    plane.altitude = 12000;
    plane.target_altitude = 12000;
    plane.autopilot_enabled = 1;
    plane.state = SYS_INIT;

    banner();

    while (1) {
        show_status(&plane);
        fake_state_step(&plane);
        read_command(&plane);
        autopilot_logic(&plane);
        safety_check(&plane);
        usleep(LOOP_DELAY);
    }
}

