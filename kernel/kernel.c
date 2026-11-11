
#include <stdio.h>

#define AXEOS_VERSION "1.0.0"

void kernel_initialize(void) {
    printf("axeOS Kernel Initializing...\n");
    printf("Version: %s\n", AXEOS_VERSION);
    printf("Kernel status: INITIALIZED\n");
}

void kernel_shutdown(void) {
    printf("axeOS shutdown requested.\n");
}

int main(void) {
    kernel_initialize();

    printf("Welcome to axeOS Core.\n");

    return 0;
}
