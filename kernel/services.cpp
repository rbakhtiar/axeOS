
#include <iostream>
#include <string>
#include <vector>

class AxeService {
private:
    std::string name;
    bool running = false;

public:
    explicit AxeService(const std::string& serviceName)
        : name(serviceName) {}

    void start() {
        running = true;
        std::cout << "[axeOS] Started: " << name << "\n";
    }

    void stop() {
        running = false;
        std::cout << "[axeOS] Stopped: " << name << "\n";
    }

    bool isRunning() const {
        return running;
    }
};

int main() {
    std::vector<AxeService> services;

    services.emplace_back("Desktop Service");
    services.emplace_back("Application Service");
    services.emplace_back("System Service");

    for (auto& service : services) {
        service.start();
    }

    std::cout << "axeOS services initialized.\n";

    return 0;
}
