
import java.util.*;

public class AxeApplicationManager {

    private final Map<String, AxeApplication> applications =
        new LinkedHashMap<>();

    public static class AxeApplication {
        private final String id;
        private final String name;
        private final String version;

        private boolean running;

        public AxeApplication(
            String id,
            String name,
            String version
        ) {
            this.id = id;
            this.name = name;
            this.version = version;
            this.running = false;
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public boolean isRunning() {
            return running;
        }

        public void start() {
            running = true;
        }

        public void stop() {
            running = false;
        }

        @Override
        public String toString() {
            return name + " [" + id + "] " +
                (running ? "RUNNING" : "STOPPED");
        }
    }

    public void register(String id, String name, String version) {
        if (id == null || !id.matches("[a-zA-Z0-9_-]+")) {
            throw new IllegalArgumentException("Invalid app ID");
        }

        applications.put(
            id,
            new AxeApplication(id, name, version)
        );

        System.out.println("Registered: " + name);
    }

    public boolean launch(String id) {
        AxeApplication app = applications.get(id);

        if (app == null) {
            System.out.println("Application not found.");
            return false;
        }

        app.start();
        System.out.println("Launched: " + app.getName());
        return true;
    }

    public boolean terminate(String id) {
        AxeApplication app = applications.get(id);

        if (app == null) {
            return false;
        }

        app.stop();
        System.out.println("Stopped: " + app.getName());
        return true;
    }

    public void uninstall(String id) {
        AxeApplication removed = applications.remove(id);

        if (removed != null) {
            System.out.println(
                "Uninstalled: " + removed.getName()
            );
        }
    }

    public void listApplications() {
        System.out.println("\n--- axeOS Applications ---");

        for (AxeApplication app : applications.values()) {
            System.out.println(app);
        }
    }

    public static void main(String[] args) {
        AxeApplicationManager manager =
            new AxeApplicationManager();

        manager.register("files", "Files", "1.0");
        manager.register("writer", "Writer", "1.0");
        manager.register("terminal", "Terminal", "1.0");
        manager.register("calculator", "Calculator", "1.0");

        manager.launch("terminal");
        manager.launch("writer");

        manager.listApplications();

        manager.terminate("writer");

        manager.listApplications();
    }
}
