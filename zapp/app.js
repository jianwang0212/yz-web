const appGrid = document.querySelector("#appGrid");
const appCardTemplate = document.querySelector("#appCardTemplate");
const categoryTabs = document.querySelector("#categoryTabs");
const searchInput = document.querySelector("#searchInput");
const featuredApp = document.querySelector("#featuredApp");
const installButton = document.querySelector("#installButton");
const refreshButton = document.querySelector("#refreshButton");
const networkLabel = document.querySelector("#networkLabel");
const displayModeLabel = document.querySelector("#displayModeLabel");

let catalog = { store: {}, apps: [] };
let activeCategory = "All";
let deferredInstallPrompt = null;

const formatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
});

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}

function setNetworkState() {
  networkLabel.textContent = navigator.onLine ? "Online" : "Offline";
  displayModeLabel.textContent = isStandalone() ? "Installed" : "Browser";
}

function normalizeDate(value) {
  if (!value) return "--";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.valueOf()) ? value : formatter.format(date);
}

function appMatches(app, query) {
  const haystack = [
    app.name,
    app.subtitle,
    app.description,
    app.category,
    app.status,
    ...(app.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function getVisibleApps() {
  const query = searchInput.value.trim();
  return catalog.apps.filter((app) => {
    const categoryMatch = activeCategory === "All" || app.category === activeCategory;
    const queryMatch = !query || appMatches(app, query);
    return categoryMatch && queryMatch;
  });
}

function renderTabs() {
  const categories = ["All", ...new Set(catalog.apps.map((app) => app.category).filter(Boolean))];
  categoryTabs.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tab-button";
      button.role = "tab";
      button.ariaSelected = String(category === activeCategory);
      button.textContent = category;
      button.addEventListener("click", () => {
        activeCategory = category;
        render();
      });
      return button;
    }),
  );
}

function makeMeta(app) {
  const items = [
    `v${app.version || "0.1"}`,
    `Build ${app.build || 1}`,
    normalizeDate(app.updated),
  ];

  if (app.scope) items.push(app.scope);
  return items;
}

function renderFeatured(app) {
  if (!app) {
    featuredApp.replaceChildren();
    return;
  }

  const card = document.createElement("article");
  card.className = "featured-card";
  card.style.setProperty("--featured-accent", app.accent || "#176f74");

  const icon = document.createElement("img");
  icon.src = app.icon;
  icon.alt = "";

  const body = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = app.name;
  const copy = document.createElement("p");
  copy.textContent = app.description;
  body.append(title, copy);

  const link = document.createElement("a");
  link.className = "open-button";
  link.href = app.url;
  link.textContent = app.updateAvailable ? "Update" : "Open";
  link.setAttribute("aria-label", `${link.textContent} ${app.name}`);

  card.append(icon, body, link);
  featuredApp.replaceChildren(card);
}

function renderAppCard(app) {
  const fragment = appCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".app-card");
  const icon = fragment.querySelector(".app-card__icon");
  const title = fragment.querySelector("h2");
  const subtitle = fragment.querySelector(".subtitle");
  const description = fragment.querySelector(".description");
  const status = fragment.querySelector(".status-pill");
  const meta = fragment.querySelector(".meta-row");
  const open = fragment.querySelector(".open-button");
  const update = fragment.querySelector(".update-button");

  card.style.setProperty("--accent", app.accent || "#176f74");
  card.style.setProperty("--accent-strong", app.accentStrong || app.accent || "#0c5155");
  icon.src = app.icon;
  title.textContent = app.name;
  subtitle.textContent = app.subtitle || app.category || "";
  description.textContent = app.description || "";
  status.textContent = app.updateAvailable ? "Update ready" : app.status || "Ready";

  meta.replaceChildren(
    ...makeMeta(app).map((item) => {
      const chip = document.createElement("span");
      chip.textContent = item;
      return chip;
    }),
  );

  open.href = app.url;
  open.textContent = "Open";
  open.setAttribute("aria-label", `Open ${app.name}`);

  update.textContent = app.updateAvailable ? "Update" : "Current";
  update.disabled = !app.updateAvailable;
  update.addEventListener("click", async () => {
    await refreshCaches();
    window.location.href = app.url;
  });

  return fragment;
}

function render() {
  renderTabs();
  const visibleApps = getVisibleApps();
  const featured = catalog.apps.find((app) => app.featured) || catalog.apps[0];
  const gridApps = featured ? visibleApps.filter((app) => app.id !== featured.id) : visibleApps;
  document.querySelector("#appCount").textContent = String(catalog.apps.length);
  document.querySelector("#storeName").textContent = catalog.store.name || "Zapp Store";
  document.querySelector("#buildLabel").textContent = `Build ${catalog.store.build || "--"}`;
  document.querySelector("#updatedLabel").textContent = normalizeDate(catalog.store.updated);
  document.querySelector("#footerOwner").textContent = catalog.store.owner || "Private shelf";

  renderFeatured(featured);

  if (!gridApps.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = visibleApps.length ? "精选应用已显示在上方。" : "没有找到匹配的应用。";
    appGrid.replaceChildren(empty);
    return;
  }

  appGrid.replaceChildren(...gridApps.map(renderAppCard));
}

async function loadCatalog() {
  const response = await fetch(`apps.json?ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Catalog failed: ${response.status}`);
  catalog = await response.json();
  render();
}

async function refreshCaches() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("sw.js");
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

refreshButton.addEventListener("click", async () => {
  refreshButton.disabled = true;
  await refreshCaches();
  await loadCatalog();
  refreshButton.disabled = false;
});

searchInput.addEventListener("input", render);
window.addEventListener("online", setNetworkState);
window.addEventListener("offline", setNetworkState);
window.matchMedia("(display-mode: standalone)").addEventListener("change", setNetworkState);

setNetworkState();
registerServiceWorker().catch(console.error);
loadCatalog().catch((error) => {
  console.error(error);
  appGrid.innerHTML = '<div class="empty-state">应用清单加载失败，请检查 apps.json。</div>';
});
