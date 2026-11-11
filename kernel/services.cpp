
#include <iostream>
#include <string>

class AxeService {
private:
    std::string name;

public:
    AxeService(const std::string& serviceName)
        : name(serviceName) {}

    void start() const {
        std::cout << "[axeOS] Starting "
                  << name << "...\n";
    }

    void stop() const {
        std::cout << "[axeOS] Stopping "
                  << name << "...\n";
    }
};

int main() {
    AxeService desktop("Desktop Service");
    AxeService system("System Service");

    desktop.start();
    system.start();

    std::cout << "axeOS services initialized.\n";

    return 0;
}
