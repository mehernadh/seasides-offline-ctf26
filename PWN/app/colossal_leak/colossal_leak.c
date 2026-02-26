#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

typedef struct {
    char name[24];
    void (*report)(void);
} Titan;

void print_flag() {
    FILE *f = fopen("flag.txt", "r");
    if (f == NULL) {
        printf("Flag file not found!\n");
        exit(1);
    }
    char flag[100];
    fgets(flag, sizeof(flag), f);
    printf("\nSECRET UNLOCKED!\n");
    printf("%s\n", flag);
    fclose(f);
}

void basement_secrets() {
    printf("\nYou've reached the basement!\n");
    print_flag();
}

void normal_report() {
    printf("Survey Corps: Titan spotted! Preparing ODM gear...\n");
}

void colossal_report() {
    printf("Survey Corps: TITAN DETECTED! EVACUATE!\n");
}

void print_banner() {
    printf("╔═════════════════════════╗\n");
    printf("║  Titan Tracking System  ║\n");
    printf("╚═════════════════════════╝\n\n");
}

void menu() {
    printf("\n=== TITAN TRACKING SYSTEM ===\n");
    printf("1. Add titan sighting\n");
    printf("2. Remove titan record\n");
    printf("3. Update titan info\n");
    printf("4. Generate report\n");
    printf("5. Exit\n");
    printf("Choice: ");
}

int main() {
    Titan *titans[5] = {NULL};
    int choice;
    int index;
    
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
    
    print_banner();
    printf("Commander: Welcome to the Titan Tracking System.\n");
    printf("Hint: basement_secrets() is at %p\n\n", basement_secrets);
    
    while (1) {
        menu();
        scanf("%d", &choice);
        getchar();
        
        if (choice == 1) {
            // Find empty slot
            index = -1;
            for (int i = 0; i < 5; i++) {
                if (titans[i] == NULL) {
                    index = i;
                    break;
                }
            }
            
            if (index == -1) {
                printf("Maximum titan records reached!\n");
                continue;
            }
            
            titans[index] = (Titan*)malloc(sizeof(Titan));
            if (!titans[index]) {
                printf("Memory allocation failed!\n");
                continue;
            }
            
            printf("Enter titan type: ");
            fgets(titans[index]->name, 24, stdin);
            titans[index]->name[strcspn(titans[index]->name, "\n")] = 0;
            
            titans[index]->report = normal_report;
            
            printf("Titan record #%d added: %s\n", index, titans[index]->name);
            
        } else if (choice == 2) {
            printf("Enter record index to remove (0-4): ");
            scanf("%d", &index);
            getchar();
            
            if (index >= 0 && index < 5 && titans[index] != NULL) {
                free(titans[index]);
                // Vulnerability: Not setting pointer to NULL (Use-After-Free)
                printf("Titan record #%d removed.\n", index);
            } else {
                printf("Invalid index or already removed!\n");
            }
            
        } else if (choice == 3) {
            printf("Enter record index to update (0-4): ");
            scanf("%d", &index);
            getchar();
            
            if (index >= 0 && index < 5) {
                // Vulnerability: No check if titans[index] was freed!
                // This allows writing to freed memory
                printf("Enter new titan name: ");
                read(0, titans[index], 32);  // Can overwrite freed chunk including function pointer
                printf("Titan record #%d updated.\n", index);
            } else {
                printf("Invalid index!\n");
            }
            
        } else if (choice == 4) {
            printf("Enter record index to report (0-4): ");
            scanf("%d", &index);
            getchar();
            
            if (index >= 0 && index < 5) {
                // Vulnerability: Calling function through potentially freed pointer
                printf("\nGenerating report for titan #%d\n", index);
                titans[index]->report();
            } else {
                printf("Invalid index!\n");
            }
            
        } else if (choice == 5) {
            printf("Exiting system...\n");
            break;
        } else {
            printf("Invalid choice!\n");
        }
    }
    
    return 0;
}
