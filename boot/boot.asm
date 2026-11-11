
.section .text
.global axe_boot_entry

axe_boot_entry:
    lea axe_message(%rip), %rdi
    call axe_core_start

halt:
    hlt
    jmp halt

axe_core_start:
    ret

.section .rodata
axe_message:
    .asciz "axeOS native core starting"
