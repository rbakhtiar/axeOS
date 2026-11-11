
#include <stdio.h>
#include <stdbool.h>

#define AXEOS_VERSION "1.2.0"

typedef struct {
    const char *name;
    const char *version;
    bool initialized;
} AxeKernel;

static AxeKernel kernel = {
    "axeOS Core",
    AXEOS_VERSION,
    false
};

void kernel_initialize(void) {
    printf("Initializing %s...\n", kernel.name);
    printf("Version: %s\n", kernel.version);

    kernel.initialized = true;

    printf("Kernel foundation initialized.\n");
}

void kernel_status(void) {
    printf("Kernel status: %s\n",
        kernel.initialized ? "ONLINE" : "OFFLINE");
}

int main(void) {
    kernel_initialize();
    kernel_status();

    printf("Welcome to axeOS Core.\n");

    return 0;
}
