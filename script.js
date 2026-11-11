
const windowLayer = document.getElementById("windowLayer");
const notification = document.getElementById("notification");

function updateClock() {
  document.getElementById("clock").textContent =
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
}

updateClock();
setInterval(updateClock, 1000);

function notify(message) {
  notification.textContent = message;
  notification.style.display = "block";

  clearTimeout(window.notifyTimer);
  window.notifyTimer = setTimeout(() => {
    notification.style.display = "none";
  }, 2500);
}

const apps = {
  files: {
    title: "Files",
    content: `
      <h2>File Manager</h2>
      <p>Welcome to axeOS Files.</p>
      <p>Your browser cannot access arbitrary device files.</p>
      <input type="file" id="filePicker" multiple>
      <div id="fileList"></div>
    `
  },

  notes: {
    title: "Notes",
    content: `
      <h2>axeOS Notes</h2>
      <textarea id="notesArea"
        placeholder="Start writing..."></textarea>
      <button id="saveNotes">Save notes</button>
      <p id="saveStatus"></p>
    `
  },

  terminal: {
    title: "Terminal",
    content: `
      <h2>axeOS Terminal</h2>
      <p>Welcome to axeOS Shell 1.0</p>
      <div id="terminalOutput">Type help to begin.</div>
      <input id="terminalInput"
        placeholder="Enter a command..."
        autocomplete="off">
    `
  },

  about: {
    title: "About axeOS",
    content: `
      <h2>axeOS</h2>
      <p>Version 1.0.0</p>
      <p>A new generation operating system concept.</p>
      <p>Interface: axeOS Desktop</p>
      <p>Architecture: Hybrid Web + Native</p>
      <p>Creator: Rahim</p>
    `
  }
};

function openApp(name) {
  const app = apps[name];

  if (!app) return;

  const win = document.createElement("section");
  win.className = "window";

  win.innerHTML = `
    <div class="window-header">
      <strong>${app.title}</strong>
      <button class="close" aria-label="Close window">×</button>
    </div>
    <div class="window-content">${app.content}</div>
  `;

  win.querySelector(".close").addEventListener("click", () => {
    win.remove();
  });

  windowLayer.appendChild(win);

  if (name === "notes") {
    const area = win.querySelector("#notesArea");
    const save = win.querySelector("#saveNotes");
    const status = win.querySelector("#saveStatus");

    area.value = localStorage.getItem("axeos-notes") || "";

    save.addEventListener("click", () => {
      localStorage.setItem("axeos-notes", area.value);
      status.textContent = "Notes saved on this device.";
    });
  }

  if (name === "files") {
    const picker = win.querySelector("#filePicker");
    const list = win.querySelector("#fileList");

    picker.addEventListener("change", () => {
      list.replaceChildren();

      for (const file of picker.files) {
        const item = document.createElement("p");
        item.textContent = `${file.name} (${file.size} bytes)`;
        list.appendChild(item);
      }
    });
  }

  if (name === "terminal") {
    const input = win.querySelector("#terminalInput");
    const output = win.querySelector("#terminalOutput");

    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;

      const command = input.value.trim().toLowerCase();
      const line = document.createElement("p");
      line.textContent = `> ${input.value}`;
      output.appendChild(line);

      const response = document.createElement("p");

      const commands = {
        help: "Commands: help, about, date, clear, version",
        about: "axeOS is a hybrid desktop environment.",
        date: new Date().toString(),
        version: "axeOS version 1.0.0"
      };

      if (command === "clear") {
        output.replaceChildren();
      } else {
        response.textContent =
          commands[command] || "Unknown command. Type help.";
        output.appendChild(response);
      }

      input.value = "";
    });
  }

  notify(`${app.title} opened`);
}

document.querySelectorAll("[data-app]").forEach(button => {
  button.addEventListener("click", () => {
    openApp(button.dataset.app);
  });
});

document.getElementById("powerButton").addEventListener("click", () => {
  notify("axeOS is running. Browser shutdown is unavailable.");
});
