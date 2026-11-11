
pub struct AxeSystem {
    pub name: String,
    pub version: String,
    pub initialized: bool,
}

impl AxeSystem {
    pub fn new() -> Self {
        Self {
            name: String::from("axeOS"),
            version: String::from("1.0.0"),
            initialized: false,
        }
    }

    pub fn initialize(&mut self) {
        self.initialized = true;

        println!("{} is initializing...", self.name);
        println!("Version: {}", self.version);
        println!("System initialized.");
    }

    pub fn status(&self) -> &str {
        if self.initialized {
            "ONLINE"
        } else {
            "OFFLINE"
        }
    }
}

fn main() {
    let mut system = AxeSystem::new();

    system.initialize();

    println!("System status: {}", system.status());
}
