const appCount = document.querySelector("#appCount");
const buildLabel = document.querySelector("#buildLabel");
const categoryStack = document.querySelector("#categoryStack");
const detailCategory = document.querySelector("#detailCategory");
const detailClose = document.querySelector("#detailClose");
const detailDescription = document.querySelector("#detailDescription");
const detailIcon = document.querySelector("#detailIcon");
const detailList = document.querySelector("#detailList");
const detailOpen = document.querySelector("#detailOpen");
const detailOverlay = document.querySelector("#detailOverlay");
const detailTitle = document.querySelector("#detailTitle");
const displayModeLabel = document.querySelector("#displayModeLabel");
const emptyState = document.querySelector("#emptyState");
const footerOwner = document.querySelector("#footerOwner");
const installButton = document.querySelector("#installButton");
const networkLabel = document.querySelector("#networkLabel");
const refreshButton = document.querySelector("#refreshButton");
const searchInput = document.querySelector("#searchInput");
const storeName = document.querySelector("#storeName");
const tileTemplate = document.querySelector("#appTileTemplate");
const updatedLabel = document.querySelector("#updatedLabel");
const viewTabs = document.querySelector("#viewTabs");

const VIEW_MODES = [
  { id: "my", label: "My Apps" },
  { id: "updates", label: "Updates" },
  { id: "all", label: "All" },
];

const CATEGORY_ORDER = ["财务", "微信", "其他"];

let activeView = "all";
let catalog = { store: {}, apps: [] };
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
    app.scope,
    ...(app.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function isLocalApp(app) {
  return !/^https?:\/\//.test(app.url || "");
}

function getBaseApps() {
  if (activeView === "updates") return catalog.apps.filter((app) => app.updateAvailable);
  if (activeView === "my") return catalog.apps.filter(isLocalApp);
  return catalog.apps;
}

function getVisibleApps() {
  const query = searchInput.value.trim();
  return getBaseApps().filter((app) => !query || appMatches(app, query));
}

function getCategorySortValue(category) {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function sortByCategory(apps) {
  return [...apps].sort((a, b) => {
    const categoryDelta = getCategorySortValue(a.category) - getCategorySortValue(b.category);
    if (categoryDelta) return categoryDelta;
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

function renderViewTabs() {
  viewTabs.replaceChildren(
    ...VIEW_MODES.map((mode) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mode-tab";
      button.role = "tab";
      button.ariaSelected = String(mode.id === activeView);
      button.textContent = mode.label;
      button.addEventListener("click", () => {
        activeView = mode.id;
        render();
      });
      return button;
    }),
  );
}

function openAppDetails(app) {
  detailIcon.src = app.icon;
  detailTitle.textContent = app.name;
  detailCategory.textContent = app.category || "App";
  detailDescription.textContent = app.description || app.subtitle || "";
  detailOpen.href = app.url;
  detailOpen.setAttribute("aria-label", `Open ${app.name}`);

  const details = [
    ["Status", app.updateAvailable ? "Update available" : app.status || "Ready"],
    ["Version", app.version || "--"],
    ["Build", app.build || "--"],
    ["Scope", app.scope || "--"],
    ["Updated", normalizeDate(app.updated)],
    ["URL", app.url || "--"],
  ];

  detailList.replaceChildren(
    ...details.flatMap(([term, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = term;
      const dd = document.createElement("dd");
      dd.textContent = value;
      return [dt, dd];
    }),
  );

  detailOverlay.hidden = false;
  detailClose.focus();
}

function closeAppDetails() {
  detailOverlay.hidden = true;
}

function renderTile(app, compact = false) {
  const fragment = tileTemplate.content.cloneNode(true);
  const tile = fragment.querySelector(".app-tile");
  const icon = fragment.querySelector(".app-tile__icon");
  const title = fragment.querySelector("h3");
  const description = fragment.querySelector("p");
  const open = fragment.querySelector(".open-button");

  tile.classList.toggle("app-tile--compact", compact);
  tile.style.setProperty("--accent", app.accent || "#176f74");
  icon.src = app.icon;
  title.textContent = app.name;
  description.textContent = app.subtitle || app.description || app.category || "";
  open.href = app.url;
  open.setAttribute("aria-label", `Open ${app.name}`);

  tile.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    openAppDetails(app);
  });
  tile.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAppDetails(app);
    }
  });

  return fragment;
}

function renderCategories(apps, usedIds) {
  const grouped = sortByCategory(apps).reduce((groups, app) => {
    const category = app.category || "Other";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(app);
    return groups;
  }, new Map());

  const sections = [...grouped.entries()].map(([category, categoryApps]) => {
    const section = document.createElement("section");
    section.className = "shelf-section category-section";

    const heading = document.createElement("div");
    heading.className = "section-heading section-heading--small";

    const titleWrap = document.createElement("div");
    const kicker = document.createElement("p");
    kicker.className = "section-kicker";
    kicker.textContent = "Category";
    const title = document.createElement("h2");
    title.textContent = category;
    titleWrap.append(kicker, title);

    const count = document.createElement("span");
    count.textContent = `${categoryApps.length} apps`;
    heading.append(titleWrap, count);

    const grid = document.createElement("div");
    grid.className = "tile-grid";
    grid.replaceChildren(...categoryApps.map((app) => renderTile(app, true)));

    section.append(heading, grid);
    return section;
  });

  categoryStack.replaceChildren(...sections);
}

function render() {
  renderViewTabs();
  const visibleApps = getVisibleApps();

  appCount.textContent = String(visibleApps.length);
  storeName.textContent = catalog.store.name || "Zapp Store";
  buildLabel.textContent = `Build ${catalog.store.build || "--"}`;
  updatedLabel.textContent = `Updated ${normalizeDate(catalog.store.updated)}`;
  footerOwner.textContent = catalog.store.owner || "Private shelf";

  renderCategories(visibleApps);
  emptyState.hidden = Boolean(visibleApps.length);
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
  const registration = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
  await registration.update();
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
detailClose.addEventListener("click", closeAppDetails);
detailOverlay.addEventListener("click", (event) => {
  if (event.target === detailOverlay) closeAppDetails();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !detailOverlay.hidden) closeAppDetails();
});
window.addEventListener("online", setNetworkState);
window.addEventListener("offline", setNetworkState);
window.matchMedia("(display-mode: standalone)").addEventListener("change", setNetworkState);

setNetworkState();
registerServiceWorker().catch(console.error);
loadCatalog().catch((error) => {
  console.error(error);
  categoryStack.replaceChildren();
  emptyState.hidden = false;
  emptyState.textContent = "应用清单加载失败，请检查 apps.json。";
});
