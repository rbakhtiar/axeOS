
import json
import os
import platform
import time
from pathlib import Path
from datetime import datetime, timezone


class AxeKernel:
    VERSION = "1.4.0"

    def __init__(self, data_directory="axe_data"):
        self.data = Path(data_directory)
        self.data.mkdir(exist_ok=True)

        self.settings_file = self.data / "settings.json"
        self.log_file = self.data / "system.log"
        self.apps_file = self.data / "apps.json"

        self.settings = self.load_json(
            self.settings_file,
            {
                "theme": "emerald",
                "accent": "#35b88c",
                "sound": True,
                "animations": True
            }
        )

        self.apps = self.load_json(self.apps_file, {
            "files": {"name": "Files", "status": "installed"},
            "writer": {"name": "Writer", "status": "installed"},
            "terminal": {"name": "Terminal", "status": "installed"}
        })

        self.log("axeOS system services initialized")

    def load_json(self, path, default):
        if not path.exists():
            return default.copy()

        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return default.copy()

    def save_json(self, path, data):
        temporary = path.with_suffix(".tmp")
        temporary.write_text(
            json.dumps(data, indent=4),
            encoding="utf-8"
        )
        os.replace(temporary, path)

    def log(self, message):
        timestamp = datetime.now(timezone.utc).isoformat()
        with self.log_file.open("a", encoding="utf-8") as file:
            file.write(f"[{timestamp}] {message}\n")

    def system_info(self):
        return {
            "name": "axeOS",
            "version": self.VERSION,
            "architecture": platform.machine(),
            "platform": platform.system(),
            "python_version": platform.python_version(),
            "uptime_seconds": int(time.monotonic()),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def install_app(self, app_id, name):
        if not app_id.isidentifier():
            raise ValueError("Invalid application ID")

        self.apps[app_id] = {
            "name": name,
            "status": "installed"
        }

        self.save_json(self.apps_file, self.apps)
        self.log(f"Application installed: {app_id}")

    def uninstall_app(self, app_id):
        if app_id not in self.apps:
            return False

        del self.apps[app_id]
        self.save_json(self.apps_file, self.apps)
        self.log(f"Application removed: {app_id}")
        return True

    def change_setting(self, key, value):
        allowed = {"theme", "accent", "sound", "animations"}

        if key not in allowed:
            raise ValueError("Unsupported setting")

        self.settings[key] = value
        self.save_json(self.settings_file, self.settings)
        self.log(f"Setting changed: {key}")

    def get_status(self):
        return {
            "system": self.system_info(),
            "applications": self.apps,
            "settings": self.settings
        }


if __name__ == "__main__":
    kernel = AxeKernel()

    print("axeOS Python System Services")
    print(json.dumps(kernel.get_status(), indent=4))

    kernel.install_app("calculator", "Calculator")
    print("\nCalculator registered.")
