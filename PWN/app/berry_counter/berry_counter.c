#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void print_flag() {
    FILE *f = fopen("flag.txt", "r");
    if (f == NULL) {
        printf("Flag file not found!\n");
        exit(1);
    }
    char flag[100];
    fgets(flag, sizeof(flag), f);
    printf("\n🗺️  GUN ACQUIRED! 🗺️\n");
    printf("%s\n", flag);
    fclose(f);
}

void print_banner() {
    printf("╔═══════════════════╗\n");
    printf("║    BERRY SHOP     ║\n");
    printf("╚═══════════════════╝\n\n");
}

void shop() {
    int berries = 100;
    int choice, quantity, price;
    
    while (1) {
        printf("\n=== SHOP MENU ===\n");
        printf("Your berries: %d\n\n", berries);
        printf("1. Knife (5 berries each)\n");
        printf("2. Sword (50 berries each)\n");
        printf("3. Gun (1000000 berries)\n");
        printf("4. Sell Knifes back (3 berries each)\n");
        printf("5. Exit\n");
        printf("Choice: ");
        
        scanf("%d", &choice);
        
        if (choice == 1) {
            printf("How many Knife? ");
            scanf("%d", &quantity);
            price = quantity * 5;
            
            if (berries >= price) {
                berries -= price;
                printf("Purchased %d Knife for %d berries!\n", quantity, price);
            } else {
                printf("Not enough berries!\n");
            }
        } else if (choice == 2) {
            printf("How many swords? ");
            scanf("%d", &quantity);
            price = quantity * 50;
            
            if (berries >= price) {
                berries -= price;
                printf("Purchased %d swords for %d berries!\n", quantity, price);
            } else {
                printf("Not enough berries!\n");
            }
        } else if (choice == 3) {
            if (berries >= 1000000) {
                printf("Congratulations! You bought the Gun!\n");
                print_flag();
                break;
            } else {
                printf("You need 1,000,000 berries! You only have %d\n", berries);
            }
        } else if (choice == 4) {
            printf("How many Knifes to sell? ");
            scanf("%d", &quantity);
            
            // Calculate price (vulnerable to integer overflow)
            price = quantity * 3;
            
            printf("Calculated price: %d berries\n", price);  // Debug info
            berries += price;
            printf("Sold %d Knife for %d berries!\n", quantity, price);
            printf("New total: %d berries\n", berries);

        } else if (choice == 5) {
            printf("Thanks for visiting!\n");
            break;
        } else {
            printf("Invalid choice!\n");
        }
    }
}

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
    
    print_banner();
    printf("Welcome to my Berry Shop!\n");
    shop();
    
    return 0;
}
