
"use strict";

/* =====================================
   AXEOS 1.2 DESKTOP ENGINE
===================================== */

const $ = selector => document.querySelector(selector);

const desktop = $("#desktop");
const bootScreen = $("#bootScreen");
const windowLayer = $("#windowLayer");
const notification = $("#notification");

/* =====================================
   SYSTEM CONFIGURATION
===================================== */

const DEFAULT_SETTINGS = {
  accent: "#36b58a",
  wallpaper: "emerald",
  customWallpaper: "",
  theme: "dark",
  scale: "1",
  sound: true,
  installed: [
    "files",
    "notes",
    "settings",
    "store",
    "terminal",
    "about"
  ]
};

function loadSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("axeos-settings") || "{}"
    );

    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      installed: Array.isArray(saved.installed)
        ? saved.installed
        : [...DEFAULT_SETTINGS.installed]
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings = loadSettings();

function saveSettings() {
  try {
    localStorage.setItem(
      "axeos-settings",
      JSON.stringify(settings)
    );
  } catch {
    notify("Storage limit reached. Some settings could not be saved.");
  }
}

/* =====================================
   WALLPAPER ENGINE
===================================== */

const wallpapers = {
  emerald:
    "radial-gradient(ellipse at 75% 25%,#14533b,transparent 45%),linear-gradient(135deg,#061510,#0b241c)",

  midnight:
    "radial-gradient(ellipse at 70% 20%,#303a65,transparent 50%),linear-gradient(135deg,#090d20,#10182c)",

  obsidian:
    "radial-gradient(ellipse at 70% 30%,#393939,transparent 45%),linear-gradient(135deg,#090909,#202020)",

  ocean:
    "radial-gradient(ellipse at 70% 25%,#146e83,transparent 50%),linear-gradient(135deg,#06131d,#0b3346)",

  forest:
    "radial-gradient(ellipse at 70% 20%,#4b6030,transparent 50%),linear-gradient(135deg,#10180a,#26351b)"
};

function applySettings() {
  document.documentElement.style.setProperty(
    "--accent",
    settings.accent
  );

  document.documentElement.style.setProperty(
    "--scale",
    settings.scale
  );

  const wallpaper = settings.customWallpaper ||
    wallpapers[settings.wallpaper] ||
    wallpapers.emerald;

  desktop.style.background = wallpaper;

  document.body.classList.toggle(
    "light",
    settings.theme === "light"
  );
}

applySettings();

/* =====================================
   NOTIFICATION ENGINE
===================================== */

let notificationTimer;

function notify(message) {
  notification.textContent = message;
  notification.style.display = "block";

  clearTimeout(notificationTimer);

  notificationTimer = setTimeout(() => {
    notification.style.display = "none";
  }, 2800);
}

/* =====================================
   AUDIO ENGINE
===================================== */

let audioContext;

async function initializeAudio() {
  if (!settings.sound) return false;

  try {
    audioContext ||= new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    return true;
  } catch (error) {
    console.warn("Audio unavailable:", error);
    return false;
  }
}

function playStartupSound() {
  if (!settings.sound || !audioContext) return;

  const notes = [
    { frequency: 392, start: 0, duration: 0.4 },
    { frequency: 523.25, start: 0.23, duration: 0.45 },
    { frequency: 659.25, start: 0.48, duration: 0.8 }
  ];

  notes.forEach(note => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = note.frequency;

    const start = audioContext.currentTime + note.start;

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.11, start + 0.09);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      start + note.duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + note.duration);
  });
}

/* =====================================
   BOOT ENGINE
===================================== */

let booting = false;

async function bootSystem() {
  if (booting) return;

  booting = true;

  const button = $("#startButton");
  const status = $("#bootStatus");
  const progress = $("#bootProgress");

  button.disabled = true;
  button.textContent = "Starting...";

  await initializeAudio();

  const stages = [
    "Initializing axeOS core...",
    "Loading desktop services...",
    "Applying preferences...",
    "Loading application registry...",
    "Preparing desktop..."
  ];

  for (let i = 0; i < stages.length; i++) {
    status.textContent = stages[i];
    progress.style.width = `${(i + 1) * 20}%`;

    await new Promise(resolve =>
      setTimeout(resolve, 420)
    );
  }

  playStartupSound();

  bootScreen.classList.add("boot-exit");

  await new Promise(resolve =>
    setTimeout(resolve, 550)
  );

  bootScreen.classList.add("hidden");
  desktop.classList.remove("hidden");

  booting = false;

  notify("Welcome to axeOS.");
}

$("#startButton").addEventListener(
  "click",
  bootSystem
);

/* =====================================
   CLOCK AND STATUS
===================================== */

function updateClock() {
  $("#clock").textContent =
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

  $("#networkStatus").textContent =
    navigator.onLine ? "ONLINE" : "OFFLINE";
}

updateClock();

setInterval(updateClock, 1000);

window.addEventListener("online", updateClock);
window.addEventListener("offline", updateClock);

/* =====================================
   APPLICATION REGISTRY
===================================== */

const apps = {

  files: {
    title: "Files",
    icon: "▤",
    render: () => `
      <h2>File Manager</h2>
      <p>Choose files from your device.</p>
      <input id="filePicker" type="file" multiple>
      <div id="fileList"></div>
    `
  },

  notes: {
    title: "Notes",
    icon: "▧",
    render: () => `
      <h2>axeOS Notes</h2>
      <textarea id="notesArea"
        placeholder="Start writing..."></textarea>
      <button class="action" id="saveNotes">
        Save Notes
      </button>
      <p id="saveStatus"></p>
    `
  },

  settings: {
    title: "System Settings",
    icon: "⚙",
    render: () => `
      <h2>System Settings</h2>

      <div class="setting-card">
        <h3>Appearance</h3>
        <select id="themeSelect">
          <option value="dark">Dark Mode</option>
          <option value="light">Light Mode</option>
        </select>
      </div>

      <div class="setting-card">
        <h3>Accent Color</h3>
        <div class="color-row">
          <input type="color" id="accentPicker">
          <span>Interface accent</span>
        </div>
      </div>

      <div class="setting-card">
        <h3>Wallpaper Gallery</h3>
        <div class="wallpapers">
          <button class="wallpaper-choice"
            data-wall="emerald"
            style="background:linear-gradient(135deg,#061510,#20744e)">
          </button>

          <button class="wallpaper-choice"
            data-wall="midnight"
            style="background:linear-gradient(135deg,#090d20,#394b86)">
          </button>

          <button class="wallpaper-choice"
            data-wall="obsidian"
            style="background:linear-gradient(135deg,#090909,#555)">
          </button>

          <button class="wallpaper-choice"
            data-wall="ocean"
            style="background:linear-gradient(135deg,#06131d,#1685a2)">
          </button>

          <button class="wallpaper-choice"
            data-wall="forest"
            style="background:linear-gradient(135deg,#10180a,#687e3c)">
          </button>
        </div>

        <h3>Custom Wallpaper</h3>
        <input type="file" id="wallpaperUpload" accept="image/*">
        <button class="action" id="removeCustomWallpaper">
          Restore Preset
        </button>
      </div>

      <div class="setting-card">
        <h3>Interface Scale</h3>
        <select id="scaleSelect">
          <option value="0.85">85%</option>
          <option value="1">100%</option>
          <option value="1.15">115%</option>
          <option value="1.3">130%</option>
        </select>
      </div>

      <div class="setting-card">
        <h3>Startup Sound</h3>
        <select id="soundSelect">
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      <div class="setting-card">
        <h3>Reset Preferences</h3>
        <button class="action" id="resetSettings">
          Restore Defaults
        </button>
      </div>
    `
  },

  store: {
    title: "axeOS App Store",
    icon: "▣",
    render: () => `
      <h2>axeOS App Store</h2>
      <p>Discover applications for your desktop.</p>

      <input
        class="store-search"
        id="storeSearch"
        placeholder="Search applications..."
      >

      <div id="storeApps"></div>
    `
  },

  terminal: {
    title: "Terminal",
    icon: "⌘",
    render: () => `
      <h2>axeOS Terminal</h2>
      <p>axeOS Shell 1.2.0</p>

      <div id="terminalOutput">
        Welcome to axeOS Shell.<br>
        Type help to view commands.
      </div>

      <input id="terminalInput"
        placeholder="Enter a command..."
        autocomplete="off">
    `
  },

  about: {
    title: "About axeOS",
    icon: "◈",
    render: () => `
      <h2>axeOS</h2>
      <p>A quieter way to compute.</p>

      <div class="setting-card">
        <p>Version: 1.2.0</p>
        <p>Architecture: Hybrid Web + Native</p>
        <p>Desktop: axeOS Desktop</p>
        <p>Developer: Rahim</p>
        <p>Project status: Development</p>
      </div>
    `
  }

};

/* =====================================
   APP STORE CATALOG
===================================== */

const catalog = [

  {
    id: "calculator",
    name: "Calculator",
    icon: "＋",
    category: "Utilities",
    description: "Perform everyday calculations."
  },

  {
    id: "clockapp",
    name: "Clock",
    icon: "◷",
    category: "Utilities",
    description: "Digital clock and date."
  },

  {
    id: "writer",
    name: "Writer",
    icon: "▤",
    category: "Productivity",
    description: "A distraction-free writing space."
  },

  {
    id: "systeminfo",
    name: "System Monitor",
    icon: "◈",
    category: "System",
    description: "View browser and device information."
  }

];

function getApp(id) {
  if (apps[id]) return apps[id];

  const item = catalog.find(app => app.id === id);

  if (!item) return null;

  return {
    title: item.name,
    icon: item.icon,
    render: () => renderExtraApp(id)
  };
}

/* =====================================
   EXTRA APPLICATION INTERFACES
===================================== */

function renderExtraApp(id) {

  if (id === "calculator") {
    return `
      <h2>Calculator</h2>
      <input id="calcDisplay" readonly placeholder="0">

      <div class="calc-buttons">
        ${["7","8","9","/","4","5","6","*",
          "1","2","3","-","0",".","=","+","C"]
          .map(key => `
            <button class="action calc-key"
              data-key="${key}">${key}</button>
          `).join("")}
      </div>
    `;
  }

  if (id === "clockapp") {
    return `
      <h2>Clock</h2>
      <h1 id="clockAppTime">00:00</h1>
      <p id="clockAppDate"></p>
    `;
  }

  if (id === "writer") {
    return `
      <h2>axeOS Writer</h2>
      <textarea id="notesArea"
        placeholder="Your writing starts here..."></textarea>
      <button class="action" id="saveNotes">Save Document</button>
      <p id="saveStatus"></p>
    `;
  }

  if (id === "systeminfo") {
    return `
      <h2>System Monitor</h2>
      <div class="setting-card">
        <p>Platform: ${escapeHTML(navigator.platform)}</p>
        <p>Language: ${escapeHTML(navigator.language)}</p>
        <p>Screen: ${screen.width} × ${screen.height}</p>
        <p>Connection: ${navigator.onLine ? "Online" : "Offline"}</p>
        <p>CPU cores reported: ${navigator.hardwareConcurrency || "Unavailable"}</p>
        <p>Memory estimate: ${
          navigator.deviceMemory
            ? navigator.deviceMemory + " GB"
            : "Unavailable"
        }</p>
      </div>
    `;
  }

  return "<p>Application unavailable.</p>";
}

/* =====================================
   HTML ESCAPING
===================================== */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/* =====================================
   WINDOW MANAGER
===================================== */

let highestZ = 20;
let windowCounter = 0;

function openApp(name) {
  const app = getApp(name);

  if (!app) {
    notify("Application not found.");
    return;
  }

  if (!settings.installed.includes(name)) {
    notify("Install this application from the App Store first.");
    return;
  }

  const win = document.createElement("section");

  win.className = "window";
  win.dataset.app = name;

  const header = document.createElement("div");
  header.className = "window-header";

  const title = document.createElement("strong");
  title.textContent = app.title;

  const controls = document.createElement("div");
  controls.className = "window-controls";

  const minimize = document.createElement("button");
  minimize.textContent = "−";
  minimize.title = "Minimize";

  const close = document.createElement("button");
  close.textContent = "×";
  close.title = "Close";

  controls.append(minimize, close);
  header.append(title, controls);

  const content = document.createElement("div");
  content.className = "window-content";
  content.innerHTML = app.render();

  win.append(header, content);

  const offset = (windowCounter++ % 8) * 18;

  win.style.left = `calc(50% + ${offset}px)`;
  win.style.top = `${35 + offset}px`;

  windowLayer.appendChild(win);

  focusWindow(win);
  makeDraggable(win, header);

  minimize.addEventListener("click", () => {
    win.style.display = "none";
    notify(`${app.title} minimized.`);
  });

  close.addEventListener("click", () => {
    win.remove();
  });

  win.addEventListener("pointerdown", () => {
    focusWindow(win);
  });

  initializeApp(name, win);

  notify(`${app.title} opened.`);
}

function focusWindow(win) {
  highestZ++;
  win.style.zIndex = highestZ;
}

function makeDraggable(win, header) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originalLeft = 0;
  let originalTop = 0;

  header.addEventListener("pointerdown", event => {
    if (event.target.closest("button")) return;

    dragging = true;

    const rect = win.getBoundingClientRect();

    startX = event.clientX;
    startY = event.clientY;

    originalLeft = rect.left;
    originalTop = rect.top;

    header.setPointerCapture(event.pointerId);
    focusWindow(win);
  });

  header.addEventListener("pointermove", event => {
    if (!dragging) return;

    const layer = windowLayer.getBoundingClientRect();

    const maxLeft = layer.width - 80;
    const maxTop = layer.height - 40;

    const left = Math.max(
      0,
      Math.min(
        maxLeft,
        originalLeft + event.clientX - startX - layer.left
      )
    );

    const top = Math.max(
      0,
      Math.min(
        maxTop,
        originalTop + event.clientY - startY - layer.top
      )
    );

    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
    win.style.transform = "none";
  });

  header.addEventListener("pointerup", () => {
    dragging = false;
  });

  header.addEventListener("pointercancel", () => {
    dragging = false;
  });
}

/* =====================================
   APPLICATION INITIALIZATION
===================================== */

function initializeApp(name, win) {

  if (name === "files") setupFiles(win);

  if (name === "notes" || name === "writer") {
    setupNotes(win, name);
  }

  if (name === "settings") setupSettings(win);

  if (name === "store") setupStore(win);

  if (name === "terminal") setupTerminal(win);

  if (name === "calculator") setupCalculator(win);

  if (name === "clockapp") setupClock(win);

}

/* =====================================
   FILE MANAGER
===================================== */

function setupFiles(win) {
  const picker = win.querySelector("#filePicker");
  const list = win.querySelector("#fileList");

  picker.addEventListener("change", () => {
    list.replaceChildren();

    [...picker.files].forEach(file => {
      const item = document.createElement("p");

      item.textContent =
        `${file.name} — ${formatBytes(file.size)}`;

      list.appendChild(item);
    });
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* =====================================
   NOTES AND WRITER
===================================== */

function setupNotes(win, name) {
  const area = win.querySelector("#notesArea");
  const save = win.querySelector("#saveNotes");
  const status = win.querySelector("#saveStatus");

  const storageKey = `axeos-${name}`;

  area.value = localStorage.getItem(storageKey) || "";

  save.addEventListener("click", () => {
    try {
      localStorage.setItem(storageKey, area.value);
      status.textContent = "Document saved successfully.";
    } catch {
      status.textContent = "Could not save. Storage may be full.";
    }
  });
}

/* =====================================
   TERMINAL SIMULATOR
===================================== */

function setupTerminal(win) {
  const input = win.querySelector("#terminalInput");
  const output = win.querySelector("#terminalOutput");

  input.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    const command = input.value.trim().toLowerCase();

    const line = document.createElement("p");
    line.textContent = `> ${input.value}`;

    output.appendChild(line);

    const commands = {
      help: "Commands: help, about, date, version, apps, clear",
      about: "axeOS Hybrid Desktop Environment.",
      date: new Date().toString(),
      version: "axeOS 1.2.0",
      apps: settings.installed.join(", ")
    };

    if (command === "clear") {
      output.replaceChildren();
    } else {
      const result = document.createElement("p");

      result.textContent =
        commands[command] || "Unknown command.";

      output.appendChild(result);
    }

    input.value = "";
    output.scrollTop = output.scrollHeight;
  });
}

/* =====================================
   CALCULATOR
===================================== */

// Safe arithmetic parser: no eval or Function execution.

function calculate(expression) {
  const tokens = expression.match(
    /\d+(?:\.\d+)?|[()+\-*/]/g
  );

  if (!tokens || tokens.join("") !== expression.replace(/\s/g, "")) {
    throw new Error("Invalid expression");
  }

  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (
      tokens[position] === "+" ||
      tokens[position] === "-"
    ) {
      const operator = tokens[position++];

      const right = parseTerm();

      value = operator === "+"
        ? value + right
        : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parseFactor();

    while (
      tokens[position] === "*" ||
      tokens[position] === "/"
    ) {
      const operator = tokens[position++];

      const right = parseFactor();

      if (operator === "/" && right === 0) {
        throw new Error("Division by zero");
      }

      value = operator === "*"
        ? value * right
        : value / right;
    }

    return value;
  }

  function parseFactor() {
    const token = tokens[position];

    if (token === "-") {
      position++;
      return -parseFactor();
    }

    if (token === "+") {
      position++;
      return parseFactor();
    }

    if (token === "(") {
      position++;

      const value = parseExpression();

      if (tokens[position++] !== ")") {
        throw new Error("Missing closing bracket");
      }

      return value;
    }

    if (!token || !/^\d+(?:\.\d+)?$/.test(token)) {
      throw new Error("Invalid number");
    }

    position++;

    return Number(token);
  }

  const result = parseExpression();

  if (position !== tokens.length || !Number.isFinite(result)) {
    throw new Error("Invalid expression");
  }

  return result;
}

function setupCalculator(win) {
  const display = win.querySelector("#calcDisplay");

  let expression = "";

  win.querySelectorAll(".calc-key").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.key;

      if (key === "C") {
        expression = "";
        display.value = "";
        return;
      }

      if (key === "=") {
        try {
          const result = calculate(expression);

          display.value = String(result);
          expression = String(result);
        } catch {
          display.value = "Error";
          expression = "";
        }

        return;
      }

      expression += key;
      display.value = expression;
    });
  });
}

/* =====================================
   CLOCK APPLICATION
===================================== */

function setupClock(win) {
  const time = win.querySelector("#clockAppTime");
  const date = win.querySelector("#clockAppDate");

  function update() {
    time.textContent =
      new Date().toLocaleTimeString();

    date.textContent =
      new Date().toDateString();
  }

  update();

  const timer = setInterval(() => {
    if (!win.isConnected) {
      clearInterval(timer);
      return;
    }

    update();
  }, 1000);
}

/* =====================================
   SYSTEM SETTINGS
===================================== */

function setupSettings(win) {
  const theme = win.querySelector("#themeSelect");
  const accent = win.querySelector("#accentPicker");
  const scale = win.querySelector("#scaleSelect");
  const sound = win.querySelector("#soundSelect");

  theme.value = settings.theme;
  accent.value = settings.accent;
  scale.value = settings.scale;
  sound.value = String(settings.sound);

  theme.addEventListener("change", () => {
    settings.theme = theme.value;
    saveSettings();
    applySettings();
  });

  accent.addEventListener("input", () => {
    settings.accent = accent.value;
    saveSettings();
    applySettings();
  });

  scale.addEventListener("change", () => {
    settings.scale = scale.value;
    saveSettings();
    applySettings();
  });

  sound.addEventListener("change", () => {
    settings.sound = sound.value === "true";
    saveSettings();
  });

  win.querySelectorAll("[data-wall]").forEach(button => {
    button.addEventListener("click", () => {
      settings.wallpaper = button.dataset.wall;
      settings.customWallpaper = "";

      saveSettings();
      applySettings();

      notify("Wallpaper updated.");
    });
  });

  const upload = win.querySelector("#wallpaperUpload");

  upload.addEventListener("change", () => {
    const file = upload.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please select an image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify("Maximum wallpaper size is 2 MB.");
      upload.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      settings.customWallpaper = `url("${reader.result}") center / cover no-repeat`;
      saveSettings();
      applySettings();

      notify("Custom wallpaper applied.");
    };

    reader.onerror = () => notify("Could not read image.");

    reader.readAsDataURL(file);
  });

  win.querySelector("#removeCustomWallpaper")
    .addEventListener("click", () => {
      settings.customWallpaper = "";
      settings.wallpaper = "emerald";

      saveSettings();
      applySettings();

      notify("Default wallpaper restored.");
    });

  win.querySelector("#resetSettings")
    .addEventListener("click", () => {
      if (!confirm("Restore axeOS preferences to defaults?")) {
        return;
      }

      settings = {
        ...DEFAULT_SETTINGS,
        installed: [...DEFAULT_SETTINGS.installed]
      };

      saveSettings();
      applySettings();

      notify("Preferences restored.");

      openApp("settings");
      win.remove();
    });
}

/* =====================================
   APP STORE
===================================== */

function setupStore(win) {
  const search = win.querySelector("#storeSearch");

  function renderStore(query = "") {
    const container = win.querySelector("#storeApps");

    container.replaceChildren();

    const results = catalog.filter(app => {
      const text =
        `${app.name} ${app.category} ${app.description}`
          .toLowerCase();

      return text.includes(query.toLowerCase());
    });

    if (!results.length) {
      const empty = document.createElement("p");
      empty.textContent = "No applications found.";
      container.appendChild(empty);
      return;
    }

    results.forEach(app => {
      const installed = settings.installed.includes(app.id);

      const card = document.createElement("div");
      card.className = "store-card";

      const icon = document.createElement("div");
      icon.className = "store-icon";
      icon.textContent = app.icon;

      const info = document.createElement("div");
      info.className = "store-info";

      const title = document.createElement("h3");
      title.textContent = app.name;

      const description = document.createElement("p");
      description.textContent = app.description;

      info.append(title, description);

      const button = document.createElement("button");
      button.className = "action";
      button.textContent = installed ? "Open" : "Install";

      button.addEventListener("click", () => {
        if (installed) {
          openApp(app.id);
          return;
        }

        settings.installed.push(app.id);
        saveSettings();

        notify(`${app.name} installed.`);

        renderStore(search.value);
      });

      const uninstall = document.createElement("button");
      uninstall.className = "action";
      uninstall.textContent = "Remove";
      uninstall.style.marginTop = "6px";

      uninstall.addEventListener("click", () => {
        settings.installed =
          settings.installed.filter(id => id !== app.id);

        saveSettings();

        notify(`${app.name} removed.`);

        renderStore(search.value);
      });

      const actions = document.createElement("div");
      actions.append(button);

      if (installed) {
        actions.append(uninstall);
      }

      card.append(icon, info, actions);
      container.appendChild(card);
    });
  }

  search.addEventListener("input", () => {
    renderStore(search.value);
  });

  renderStore();
}

/* =====================================
   DESKTOP APPLICATION LAUNCHING
===================================== */

document.querySelectorAll("[data-app]").forEach(button => {
  button.addEventListener("click", () => {
    openApp(button.dataset.app);
  });
});

/* =====================================
   POWER MANAGEMENT
===================================== */

const powerMenu = $("#powerMenu");

$("#powerButton").addEventListener("click", () => {
  powerMenu.classList.toggle("hidden");
});

$("#cancelPower").addEventListener("click", () => {
  powerMenu.classList.add("hidden");
});

function restartSystem() {
  powerMenu.classList.add("hidden");

  windowLayer.replaceChildren();

  desktop.classList.add("hidden");

  bootScreen.classList.remove("hidden");
  bootScreen.classList.remove("boot-exit");

  $("#bootStatus").textContent = "System restarting...";
  $("#bootProgress").style.width = "0%";

  $("#startButton").disabled = false;
  $("#startButton").textContent = "Restart axeOS";

  booting = false;
}

$("#restartButton").addEventListener(
  "click",
  restartSystem
);

$("#shutdownButton").addEventListener("click", () => {
  powerMenu.classList.add("hidden");

  windowLayer.replaceChildren();

  desktop.classList.add("hidden");

  bootScreen.classList.remove("hidden");
  bootScreen.classList.remove("boot-exit");

  $("#bootStatus").textContent = "axeOS has shut down.";
  $("#bootProgress").style.width = "0%";

  $("#startButton").disabled = false;
  $("#startButton").textContent = "Power on";

  booting = false;
});

/* =====================================
   END OF AXEOS DESKTOP ENGINE
===================================== */

console.log("axeOS 1.2.0 desktop engine loaded.");
