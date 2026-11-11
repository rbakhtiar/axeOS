
"use strict";

const STORAGE_KEY = "axeos_13_desktop";

const APPS = [
  { id: "files", name: "Files", icon: "F", description: "Browse selected local files." },
  { id: "writer", name: "Writer", icon: "W", description: "Write and edit notes." },
  { id: "calculator", name: "Calculator", icon: "C", description: "Perform calculations." },
  { id: "clock", name: "Clock", icon: "T", description: "View the current time." },
  { id: "terminal", name: "Terminal", icon: ">", description: "Explore the axeOS command simulator." },
  { id: "settings", name: "Settings", icon: "S", description: "Customize your desktop." },
  { id: "appstore", name: "App Store", icon: "A", description: "Browse available applications." },
  { id: "systeminfo", name: "System Info", icon: "I", description: "View desktop information." },
  { id: "developer", name: "Developer", icon: "D", description: "Explore axeOS language modules." }
];

const DEFAULT_STATE = {
  items: APPS.map((app, index) => ({
    id: "item-" + app.id,
    type: "app",
    appId: app.id,
    name: app.name,
    position: index
  })),
  dock: ["files", "writer", "terminal", "calculator"],
  wallpaper: "emerald"
};

let state = loadState();
let activeFolderId = null;
let draggedItemId = null;
let openWindows = new Map();
let windowCounter = 0;
let zIndex = 10;

const desktopGrid = document.getElementById("desktop-grid");
const dockItems = document.getElementById("dock-items");
const windowLayer = document.getElementById("window-layer");
const contextMenu = document.getElementById("context-menu");

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.items) && Array.isArray(saved.dock)) {
      return { ...DEFAULT_STATE, ...saved };
    }
  } catch (error) {
    console.warn("axeOS state could not be loaded:", error);
  }
  return structuredClone(DEFAULT_STATE);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Could not save axeOS settings:", error);
    alert("axeOS could not save changes. Browser storage may be full.");
  }
}

function getApp(appId) {
  return APPS.find(app => app.id === appId);
}

function getItem(itemId) {
  return state.items.find(item => item.id === itemId);
}

function createId(prefix = "item") {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function renderDesktop() {
  desktopGrid.innerHTML = "";

  state.items.forEach(item => {
    const element = document.createElement("div");
    element.className = "desktop-item";
    element.draggable = true;
    element.dataset.itemId = item.id;
    element.title = item.type === "folder" ? "Open folder" : "Open " + item.name;

    const icon = document.createElement("div");
    icon.className = "app-icon" + (item.type === "folder" ? " folder-icon" : "");

    if (item.type === "folder") {
      icon.textContent = "▰";
    } else {
      const app = getApp(item.appId);
      icon.textContent = app ? app.icon : "?";
    }

    const label = document.createElement("span");
    label.className = "app-label";
    label.textContent = item.name;

    element.append(icon, label);

    element.addEventListener("dblclick", () => openItem(item.id));
    element.addEventListener("click", () => {
      document.querySelectorAll(".desktop-item").forEach(el => el.classList.remove("selected"));
      element.classList.add("selected");
    });

    element.addEventListener("contextmenu", event => {
      event.preventDefault();
      showContextMenu(event.clientX, event.clientY, item.id);
    });

    element.addEventListener("dragstart", event => {
      draggedItemId = item.id;
      element.classList.add("dragging");
      event.dataTransfer.setData("text/plain", item.id);
      event.dataTransfer.effectAllowed = "move";
    });

    element.addEventListener("dragend", () => {
      draggedItemId = null;
      element.classList.remove("dragging");
      document.querySelectorAll(".desktop-item").forEach(el => el.classList.remove("drop-target"));
    });

    element.addEventListener("dragover", event => {
      if (!draggedItemId || draggedItemId === item.id) return;
      event.preventDefault();
      element.classList.add("drop-target");
    });

    element.addEventListener("dragleave", () => element.classList.remove("drop-target"));

    element.addEventListener("drop", event => {
      event.preventDefault();
      element.classList.remove("drop-target");
      const sourceId = event.dataTransfer.getData("text/plain") || draggedItemId;
      if (sourceId && sourceId !== item.id) handleDesktopDrop(sourceId, item.id);
    });

    desktopGrid.appendChild(element);
  });
}

function handleDesktopDrop(sourceId, targetId) {
  const source = getItem(sourceId);
  const target = getItem(targetId);

  if (!source || !target) return;

  // Dropping an app onto a folder moves it into that folder.
  if (target.type === "folder") {
    moveIntoFolder(source, target);
    return;
  }

  // Dropping an app onto another app creates a folder.
  if (source.type === "app" && target.type === "app") {
    createFolderFrom(source, target);
    return;
  }

  // Reorder items by moving the dragged item after the target.
  const sourceIndex = state.items.findIndex(item => item.id === sourceId);
  const targetIndex = state.items.findIndex(item => item.id === targetId);
  const [moved] = state.items.splice(sourceIndex, 1);
  const newTargetIndex = state.items.findIndex(item => item.id === targetId);
  state.items.splice(newTargetIndex + 1, 0, moved);

  saveState();
  renderDesktop();
}

function createFolderFrom(first, second) {
  const folder = {
    id: createId("folder"),
    type: "folder",
    name: "New Folder",
    items: [first, second]
  };

  state.items = state.items.filter(item =>
    item.id !== first.id && item.id !== second.id
  );

  state.items.push(folder);
  saveState();
  renderDesktop();
}

function moveIntoFolder(source, folder) {
  if (source.type === "folder" && folder.id === source.id) return;

  state.items = state.items.filter(item => item.id !== source.id);

  if (source.type === "folder") {
    folder.items.push(...source.items);
  } else {
    folder.items.push(source);
  }

  saveState();
  renderDesktop();
}

function openItem(itemId) {
  const item = getItem(itemId);
  if (!item) return;

  if (item.type === "folder") {
    openFolder(item);
  } else {
    openApp(item.appId);
  }
}

function openFolder(folder) {
  activeFolderId = folder.id;
  const overlay = document.getElementById("folder-overlay");
  const title = document.getElementById("folder-title");
  const contents = document.getElementById("folder-apps");

  title.value = folder.name;
  contents.innerHTML = "";

  folder.items.forEach(child => {
    const app = getApp(child.appId);
    if (!app) return;

    const element = document.createElement("div");
    element.className = "desktop-item";
    element.innerHTML = `
      <div class="app-icon"></div>
      <span class="app-label"></span>
    `;
    element.querySelector(".app-icon").textContent = app.icon;
    element.querySelector(".app-label").textContent = child.name;
    element.addEventListener("dblclick", () => openApp(child.appId));
    element.addEventListener("contextmenu", event => {
      event.preventDefault();
      showFolderItemMenu(event.clientX, event.clientY, child.id, folder.id);
    });
    element.draggable = true;
    element.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/plain", child.id);
    });
    contents.appendChild(element);
  });

  overlay.classList.remove("hidden");
}

function closeFolder() {
  document.getElementById("folder-overlay").classList.add("hidden");
  activeFolderId = null;
}

document.getElementById("close-folder").addEventListener("click", closeFolder);

document.getElementById("folder-title").addEventListener("change", event => {
  const folder = getItem(activeFolderId);
  if (!folder) return;
  folder.name = event.target.value.trim() || "New Folder";
  saveState();
  renderDesktop();
});

function showFolderItemMenu(x, y, childId, folderId) {
  contextMenu.innerHTML = "";
  addMenuButton("Move to desktop", () => {
    const folder = getItem(folderId);
    if (!folder) return;
    const index = folder.items.findIndex(item => item.id === childId);
    if (index < 0) return;
    state.items.push(folder.items.splice(index, 1)[0]);
    if (folder.items.length === 0) {
      state.items = state.items.filter(item => item.id !== folder.id);
    }
    saveState();
    closeFolder();
    renderDesktop();
  });
  positionMenu(x, y);
}

function addMenuButton(label, callback) {
  const button = document.createElement("button");
  button.textContent = label;
  button.addEventListener("click", () => {
    callback();
    contextMenu.classList.add("hidden");
  });
  contextMenu.appendChild(button);
}

function showContextMenu(x, y, itemId) {
  const item = getItem(itemId);
  if (!item) return;

  contextMenu.innerHTML = "";
  addMenuButton("Open", () => openItem(itemId));

  if (item.type === "folder") {
    addMenuButton("Rename folder", () => {
      const name = prompt("Folder name:", item.name);
      if (name && name.trim()) {
        item.name = name.trim();
        saveState();
        renderDesktop();
      }
    });
  }

  if (item.type === "app") {
    addMenuButton("Add to dock", () => pinApp(item.appId));
    addMenuButton("Rename shortcut", () => {
      const name = prompt("Shortcut name:", item.name);
      if (name && name.trim()) {
        item.name = name.trim();
        saveState();
        renderDesktop();
      }
    });
  }

  addMenuButton("Delete from desktop", () => {
    state.items = state.items.filter(entry => entry.id !== itemId);
    saveState();
    renderDesktop();
  });

  positionMenu(x, y);
}

function positionMenu(x, y) {
  contextMenu.style.left = Math.min(x, innerWidth - 190) + "px";
  contextMenu.style.top = Math.min(y, innerHeight - 190) + "px";
  contextMenu.classList.remove("hidden");
}

document.addEventListener("click", event => {
  if (!contextMenu.contains(event.target)) contextMenu.classList.add("hidden");
});

function renderDock() {
  dockItems.innerHTML = "";

  state.dock.forEach(appId => {
    const app = getApp(appId);
    if (!app) return;

    const button = document.createElement("button");
    button.className = "dock-item";
    button.textContent = app.icon;
    button.title = app.name;
    button.dataset.appId = appId;

    if (openWindows.has(appId)) button.classList.add("running");

    button.addEventListener("click", () => openApp(appId));
    button.draggable = true;
    button.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/plain", "dock:" + appId);
    });

    dockItems.appendChild(button);
  });
}

function pinApp(appId) {
  if (!state.dock.includes(appId)) {
    state.dock.push(appId);
    saveState();
    renderDock();
  }
}

function unpinApp(appId) {
  state.dock = state.dock.filter(id => id !== appId);
  saveState();
  renderDock();
}

document.getElementById("dock").addEventListener("dragover", event => {
  event.preventDefault();
});

document.getElementById("dock").addEventListener("drop", event => {
  event.preventDefault();
  const value = event.dataTransfer.getData("text/plain");
  const item = getItem(value);
  if (item && item.type === "app") pinApp(item.appId);
});

function openApp(appId) {
  const app = getApp(appId);
  if (!app) return;

  if (openWindows.has(appId)) {
    const existing = openWindows.get(appId);
    existing.classList.remove("minimized");
    existing.style.display = "flex";
    focusWindow(existing);
    renderDock();
    return;
  }

  const window = document.createElement("section");
  window.className = "window active";
  window.dataset.appId = appId;
  window.style.zIndex = ++zIndex;

  const titlebar = document.createElement("div");
  titlebar.className = "window-titlebar";

  const title = document.createElement("span");
  title.className = "window-title";
  title.textContent = app.name;

  const actions = document.createElement("div");
  actions.className = "window-actions";

  const minimize = document.createElement("button");
  minimize.textContent = "—";
  minimize.title = "Minimize";
  minimize.addEventListener("click", () => {
    window.style.display = "none";
    window.classList.add("minimized");
    renderDock();
  });

  const close = document.createElement("button");
  close.textContent = "×";
  close.title = "Close";
  close.addEventListener("click", () => closeApp(appId));

  actions.append(minimize, close);
  titlebar.append(title, actions);

  const content = document.createElement("div");
  content.className = "window-content";
  content.innerHTML = appContent(appId);

  window.append(titlebar, content);
  windowLayer.appendChild(window);
  openWindows.set(appId, window);

  makeWindowDraggable(window, titlebar);
  window.addEventListener("pointerdown", () => focusWindow(window));

  focusWindow(window);
  renderDock();
  initializeApp(appId, content);
}

function closeApp(appId) {
  const window = openWindows.get(appId);
  if (window) window.remove();
  openWindows.delete(appId);
  renderDock();
}

function focusWindow(window) {
  document.querySelectorAll(".window").forEach(el => el.classList.remove("active"));
  window.classList.add("active");
  window.style.zIndex = ++zIndex;
}

function makeWindowDraggable(window, handle) {
  let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

  handle.addEventListener("pointerdown", event => {
    if (event.target.closest("button")) return;

    const rect = window.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;

    window.style.left = initialLeft + "px";
    window.style.top = initialTop + "px";
    window.style.transform = "none";

    handle.setPointerCapture(event.pointerId);

    function move(moveEvent) {
      const left = Math.max(0, Math.min(innerWidth - 120,
        initialLeft + moveEvent.clientX - startX));
      const top = Math.max(48, Math.min(innerHeight - 80,
        initialTop + moveEvent.clientY - startY));
      window.style.left = left + "px";
      window.style.top = top + "px";
    }

    function stop() {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
    }

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  });
}

function appContent(appId) {
  switch (appId) {
    case "files":
      return `
        <h2>Files</h2>
        <p>Select a local file to inspect its name and size. This is not a persistent system filesystem.</p>
        <input type="file" id="file-picker" multiple>
        <div id="file-results"></div>`;

    case "writer":
      return `
        <h2>Writer</h2>
        <textarea id="writer-text" placeholder="Start writing..."
          style="width:100%;height:260px;background:#0a2018;color:white;border:1px solid #35594b;border-radius:10px;padding:12px"></textarea>
        <p>Notes are saved in this browser.</p>`;

    case "calculator":
      return `
        <h2>Calculator</h2>
        <input id="calc-input" placeholder="Example: 12 * (4 + 3)"
          style="width:100%;padding:12px;background:#071b16;color:white;border:1px solid #35594b;border-radius:9px">
        <button id="calc-run" style="margin-top:10px">Calculate</button>
        <p id="calc-result">Enter an expression.</p>`;

    case "clock":
      return `<h2>Clock</h2><h1 id="clock-large"></h1><p>Your browser's local time.</p>`;

    case "terminal":
      return `
        <h2>axeOS Terminal</h2>
        <div id="terminal-output" style="height:230px;overflow:auto;background:#03100c;padding:12px;border-radius:9px;font-family:monospace">
          axeOS browser terminal. Type help to begin.
        </div>
        <input id="terminal-input" placeholder="Enter command..."
          style="width:100%;margin-top:10px;padding:10px;background:#071b16;color:white;border:1px solid #35594b">`;

    case "settings":
      return `
        <h2>Desktop Settings</h2>
        <p>Choose your desktop background.</p>
        <div class="app-list">
          <button data-wallpaper="emerald">Emerald</button>
          <button data-wallpaper="midnight">Midnight</button>
          <button data-wallpaper="forest">Forest</button>
        </div>
        <h3>Dock management</h3>
        <div id="dock-settings"></div>`;

    case "appstore":
      return `
        <h2>axeOS App Store</h2>
        <p>Install available desktop applications.</p>
        <div class="app-list" id="store-list"></div>`;

    case "systeminfo":
      return `
        <h2>System Information</h2>
        <p>System: axeOS Browser Desktop</p>
        <p>Version: 1.3.0</p>
        <p>Runtime: Web browser</p>
        <p>Storage: Browser localStorage</p>
        <p>Kernel: Not connected to this desktop.</p>`;

    case "developer":
      return `
        <h2>Developer Edition</h2>
        <p>axeOS includes source-code foundations for multiple languages.</p>
        <div class="app-list">
          <div class="app-card"><strong>Python</strong><small>System utilities and automation</small></div>
          <div class="app-card"><strong>Java</strong><small>Application framework</small></div>
          <div class="app-card"><strong>Ruby</strong><small>Configuration and scripting</small></div>
          <div class="app-card"><strong>JavaScript</strong><small>Browser desktop runtime</small></div>
        </div>
        <p>These language modules require their own runtimes. This page does not execute them.</p>`;

    default:
      return "<h2>Application</h2><p>Application content is not available.</p>";
  }
}

function initializeApp(appId, content) {
  if (appId === "files") {
    content.querySelector("#file-picker").addEventListener("change", event => {
      const results = content.querySelector("#file-results");
      results.innerHTML = "";
      [...event.target.files].forEach(file => {
        const row = document.createElement("p");
        row.textContent = file.name + " — " + Math.round(file.size / 1024) + " KB";
        results.appendChild(row);
      });
    });
  }

  if (appId === "writer") {
    const textarea = content.querySelector("#writer-text");
    textarea.value = localStorage.getItem("axeos_writer_note") || "";
    textarea.addEventListener("input", () => {
      localStorage.setItem("axeos_writer_note", textarea.value);
    });
  }

  if (appId === "calculator") {
    content.querySelector("#calc-run").addEventListener("click", () => {
      const expression = content.querySelector("#calc-input").value;
      const result = content.querySelector("#calc-result");
      try {
        result.textContent = "Result: " + safeCalculate(expression);
      } catch {
        result.textContent = "Invalid expression.";
      }
    });
  }

  if (appId === "clock") {
    const update = () => {
      const display = content.querySelector("#clock-large");
      if (display) display.textContent = new Date().toLocaleTimeString();
    };
    update();
    const timer = setInterval(update, 1000);
    openWindows.get(appId).addEventListener("remove", () => clearInterval(timer));
  }

  if (appId === "terminal") setupTerminal(content);
  if (appId === "settings") setupSettings(content);
  if (appId === "appstore") setupStore(content);
}

function safeCalculate(expression) {
  const cleaned = expression.replace(/\s/g, "");
  if (!cleaned || !/^[0-9+\-*/().]+$/.test(cleaned)) {
    throw new Error("Invalid expression");
  }

  const tokens = cleaned.match(/\d*\.?\d+|[()+\-*/]/g) || [];
  if (tokens.join("") !== cleaned) throw new Error("Invalid tokens");

  let index = 0;

  function primary() {
    if (tokens[index] === "(") {
      index++;
      const value = addSub();
      if (tokens[index++] !== ")") throw new Error("Missing bracket");
      return value;
    }
    const value = Number(tokens[index++]);
    if (!Number.isFinite(value)) throw new Error("Invalid number");
    return value;
  }

  function unary() {
    if (tokens[index] === "-") {
      index++;
      return -unary();
    }
    if (tokens[index] === "+") {
      index++;
      return unary();
    }
    return primary();
  }

  function mulDiv() {
    let value = unary();
    while (tokens[index] === "*" || tokens[index] === "/") {
      const op = tokens[index++];
      const next = unary();
      value = op === "*" ? value * next : value / next;
    }
    return value;
  }

  function addSub() {
    let value = mulDiv();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const op = tokens[index++];
      const next = mulDiv();
      value = op === "+" ? value + next : value - next;
    }
    return value;
  }

  const result = addSub();
  if (index !== tokens.length || !Number.isFinite(result)) {
    throw new Error("Invalid calculation");
  }
  return result;
}

function setupTerminal(content) {
  const input = content.querySelector("#terminal-input");
  const output = content.querySelector("#terminal-output");

  input.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    const command = input.value.trim().toLowerCase();
    const line = document.createElement("p");
    line.textContent = "> " + command;
    output.appendChild(line);

    const response = document.createElement("p");

    const commands = {
      help: "Commands: help, about, version, date, apps, clear",
      about: "axeOS 1.3 browser desktop.",
      version: "axeOS 1.3.0",
      date: new Date().toString(),
      apps: APPS.map(app => app.name).join(", ")
    };

    if (command === "clear") {
      output.innerHTML = "";
    } else {
      response.textContent = commands[command] || "Unknown command.";
      output.appendChild(response);
    }

    input.value = "";
    output.scrollTop = output.scrollHeight;
  });
}

function setupSettings(content) {
  content.querySelectorAll("[data-wallpaper]").forEach(button => {
    button.addEventListener("click", () => {
      state.wallpaper = button.dataset.wallpaper;
      applyWallpaper();
      saveState();
    });
  });

  const list = content.querySelector("#dock-settings");
  state.dock.forEach(appId => {
    const app = getApp(appId);
    if (!app) return;
    const button = document.createElement("button");
    button.textContent = "Unpin " + app.name;
    button.addEventListener("click", () => {
      unpinApp(appId);
      button.remove();
    });
    list.appendChild(button);
  });
}

function setupStore(content) {
  const list = content.querySelector("#store-list");
  APPS.filter(app => !state.items.some(item =>
    item.type === "app" && item.appId === app.id
  )).forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    const title = document.createElement("strong");
    title.textContent = app.name;
    const description = document.createElement("small");
    description.textContent = app.description;
    const button = document.createElement("button");
    button.textContent = "Add to desktop";
    button.addEventListener("click", () => {
      state.items.push({
        id: createId(),
        type: "app",
        appId: app.id,
        name: app.name
      });
      saveState();
      renderDesktop();
      setupStore(content);
    });
    card.append(title, description, button);
    list.appendChild(card);
  });

  if (!list.children.length) {
    list.textContent = "All catalogue apps are already on your desktop.";
  }
}

function applyWallpaper() {
  const wallpapers = {
    emerald: "radial-gradient(ellipse at 75% 25%,#1d6449,transparent 48%),linear-gradient(135deg,#071b16,#102a20)",
    midnight: "radial-gradient(ellipse at 70% 20%,#283d5e,transparent 50%),linear-gradient(135deg,#080d19,#111c31)",
    forest: "radial-gradient(ellipse at 70% 25%,#426a36,transparent 50%),linear-gradient(135deg,#101d12,#1c3320)"
  };
  document.getElementById("desktop").style.background =
    wallpapers[state.wallpaper] || wallpapers.emerald;
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => openApp(button.dataset.open));
});

document.getElementById("powerButton").addEventListener("click", () => {
  document.getElementById("power-menu").classList.toggle("hidden");
});

document.querySelectorAll("[data-power]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.power;
    document.getElementById("power-menu").classList.add("hidden");

    if (action === "restart") {
      openWindows.forEach(window => window.remove());
      openWindows.clear();
      renderDock();
      renderDesktop();
    }

    if (action === "lock") {
      const password = prompt("Enter a temporary screen lock phrase:");
      if (password !== null) alert("This demo does not provide secure account locking.");
    }
  });
});

function updateClock() {
  document.getElementById("clock").textContent =
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

applyWallpaper();
renderDesktop();
renderDock();
updateClock();
setInterval(updateClock, 1000);
