const appCount = document.querySelector("#appCount");
const appShell = document.querySelector("#appShell");
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
const storeFaceReset = document.querySelector("#storeFaceReset");
const storeFaceUnlock = document.querySelector("#storeFaceUnlock");
const storeUnlock = document.querySelector("#storeUnlock");
const storeUnlockForm = document.querySelector("#storeUnlockForm");
const storeUnlockPassword = document.querySelector("#storeUnlockPassword");
const storeUnlockStatus = document.querySelector("#storeUnlockStatus");
const tileTemplate = document.querySelector("#appTileTemplate");
const updatedLabel = document.querySelector("#updatedLabel");
const viewTabs = document.querySelector("#viewTabs");

const VIEW_MODES = [
  { id: "my", label: "My Apps" },
  { id: "updates", label: "Updates" },
  { id: "all", label: "All" },
];

const CATEGORY_ORDER = ["财务", "微信", "其他"];
const STORE_BIOMETRIC_UNLOCK_KEY = "zappStore.biometricUnlock.v1";
const STORE_SESSION_PASSWORD_KEY = "zappStore.sessionUnlockPassword.v1";
const STORE_UNLOCK_VERIFY_URL = "apps/store-unlock-check.enc.json?v=20260524a";
const FINANCE_PREWARM_PACKAGES = [
  {
    label: "BOA Finance",
    url: "apps/boa-finance-data.enc.json?v=20260512bio2",
    cacheKey: "boaFinance.decryptedPayload.v1",
  },
  {
    label: "LY Fund",
    url: "apps/ly-fund-data.enc.json?v=20260615yuque1",
    cacheKey: "lyFund.decryptedPayload.v1",
  },
];

let activeView = "all";
let catalog = { store: {}, apps: [] };
let deferredInstallPrompt = null;
let financePrewarmPromise = null;

const formatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
});

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}

function hasBiometricRuntime() {
  return Boolean(
    window.isSecureContext &&
      window.PublicKeyCredential &&
      navigator.credentials &&
      crypto?.subtle &&
      crypto?.getRandomValues,
  );
}

function loadBiometricRecord() {
  try {
    const raw = localStorage.getItem(STORE_BIOMETRIC_UNLOCK_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (record?.version === 1 && record.credentialId && record.salt && record.wrappedPassword) return record;
  } catch {
    return null;
  }
  return null;
}

function saveSessionPassword(password) {
  sessionStorage.setItem(STORE_SESSION_PASSWORD_KEY, password);
}

function setStoreUnlocked(password) {
  saveSessionPassword(password);
  storeUnlock.hidden = true;
  appShell.classList.remove("locked");
  appShell.removeAttribute("aria-hidden");
  scheduleFinancePrewarm(password);
}

function updateStoreUnlockUI(message = "") {
  const record = loadBiometricRecord();
  const runtime = hasBiometricRuntime();
  storeFaceUnlock.hidden = !record || !runtime;
  storeFaceReset.hidden = !record;
  storeUnlockPassword.closest("form").hidden = Boolean(record && runtime);

  if (message) {
    storeUnlockStatus.textContent = message;
  } else if (record && runtime) {
    storeUnlockStatus.textContent = "Face ID 已启用。打开 Zapp Store 后验证一次，里面的加密 app 会自动打开。";
  } else if (!runtime) {
    storeUnlockStatus.textContent = "这个浏览器暂不支持 Face ID / Touch ID；首次进入可用密码打开本次会话。";
  }
}

async function unlockStoreWithPassword(password) {
  if (!password) return;
  storeUnlockStatus.textContent = "正在验证 Zapp 解锁口令...";
  const isValid = await validateStorePassword(password);
  if (!isValid) {
    storeUnlockStatus.textContent = "这个口令不能打开加密数据。请确认后再试一次。";
    return;
  }

  if (!hasBiometricRuntime()) {
    setStoreUnlocked(password);
    return;
  }

  storeUnlockStatus.textContent = "正在设置 Face ID...";
  try {
    const { credentialId, salt, secret } = await createBiometricSecret();
    const wrappedPassword = await encryptSavedPassword(password, secret);
    localStorage.setItem(
      STORE_BIOMETRIC_UNLOCK_KEY,
      JSON.stringify({
        version: 1,
        credentialId: bytesToBase64Url(credentialId),
        salt: bytesToBase64(salt),
        wrappedPassword,
        createdAt: new Date().toISOString(),
        origin: window.location.origin,
      }),
    );
    storeUnlockPassword.value = "";
    setStoreUnlocked(password);
  } catch (error) {
    console.error(error);
    storeUnlockStatus.textContent = "Face ID 设置未完成。可以重新输入密码再试一次。";
  }
}

async function validateStorePassword(password) {
  try {
    const response = await fetch(STORE_UNLOCK_VERIFY_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const packageData = await response.json();
    await decryptPackageWithPassword(packageData, password);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function scheduleFinancePrewarm(password) {
  if (!password || financePrewarmPromise) return;
  const run = () => {
    financePrewarmPromise = prewarmFinancePackages(password).finally(() => {
      financePrewarmPromise = null;
    });
  };
  window.setTimeout(run, 80);
}

async function prewarmFinancePackages(password) {
  for (const item of FINANCE_PREWARM_PACKAGES) {
    try {
      const response = await fetch(item.url, { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const packageData = await response.json();
      if (readCachedPayload(item.cacheKey, packageData)) continue;
      const payload = await decryptPackageWithPassword(packageData, password, { parseJson: true });
      writeCachedPayload(item.cacheKey, packageData, payload);
    } catch (error) {
      console.warn(`Finance prewarm skipped for ${item.label}`, error);
    }
  }
}

function readCachedPayload(cacheKey, packageData) {
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return matchesPackageSignature(cached?.package, packageData) ? cached.payload : null;
  } catch {
    return null;
  }
}

function writeCachedPayload(cacheKey, packageData, payload) {
  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        version: 1,
        package: packageSignature(packageData),
        payload,
        cachedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.warn("Finance session cache skipped", error);
  }
}

function packageSignature(packageData) {
  return {
    version: packageData.version,
    label: packageData.label || "",
    iterations: packageData.iterations,
    hash: packageData.hash || "SHA-256",
    salt: packageData.salt,
    iv: packageData.iv,
    ciphertextLength: String(packageData.ciphertext || "").length,
  };
}

function matchesPackageSignature(signature, packageData) {
  if (!signature || !packageData) return false;
  const current = packageSignature(packageData);
  return Object.keys(current).every((key) => signature[key] === current[key]);
}

async function decryptPackageWithPassword(packageData, password, options = {}) {
  const salt = base64ToBytes(packageData.salt);
  const iv = base64ToBytes(packageData.iv);
  const ciphertext = base64ToBytes(packageData.ciphertext);
  const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: packageData.iterations,
      hash: packageData.hash || "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  if (options.parseJson) {
    return JSON.parse(new TextDecoder().decode(plainBuffer));
  }
  return true;
}

async function unlockStoreWithBiometric() {
  const record = loadBiometricRecord();
  if (!record) {
    updateStoreUnlockUI("这台设备还没有设置 Zapp Face ID。请输入一次解锁密码。");
    return;
  }
  if (!hasBiometricRuntime()) {
    updateStoreUnlockUI("这个浏览器暂不支持 Face ID / Touch ID。");
    return;
  }

  storeUnlockStatus.textContent = "正在请求 Face ID...";
  try {
    const secret = await getBiometricSecret(record);
    const password = await decryptSavedPassword(record.wrappedPassword, secret);
    setStoreUnlocked(password);
  } catch (error) {
    console.error(error);
    updateStoreUnlockUI("Face ID 没有完成。可以重试，或重设 Face ID。");
  }
}

function resetStoreBiometric() {
  localStorage.removeItem(STORE_BIOMETRIC_UNLOCK_KEY);
  sessionStorage.removeItem(STORE_SESSION_PASSWORD_KEY);
  FINANCE_PREWARM_PACKAGES.forEach((item) => sessionStorage.removeItem(item.cacheKey));
  storeUnlock.hidden = false;
  appShell.classList.add("locked");
  appShell.setAttribute("aria-hidden", "true");
  updateStoreUnlockUI("已重设。请输入一次解锁密码来重新绑定 Face ID。");
  storeUnlockPassword.focus();
}

async function createBiometricSecret() {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "Zapp Store" },
      user: {
        id: userId,
        name: "zapp-store-local",
        displayName: "Zapp Store Unlock",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "none",
      extensions: {
        prf: {
          eval: { first: salt },
        },
      },
    },
  });
  if (!credential) throw new Error("No credential created");

  const credentialId = new Uint8Array(credential.rawId);
  const results = credential.getClientExtensionResults?.();
  let secret = results?.prf?.results?.first;
  if (!secret) {
    secret = await getBiometricSecret({ credentialId: bytesToBase64Url(credentialId), salt: bytesToBase64(salt) });
  }
  if (!secret) throw new Error("PRF extension unavailable");
  return { credentialId, salt, secret };
}

async function getBiometricSecret(record) {
  const credentialId = base64UrlToBytes(record.credentialId);
  const credentialIdKey = base64ToBase64Url(record.credentialId);
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: "public-key", id: credentialId }],
      userVerification: "required",
      timeout: 60000,
      extensions: {
        prf: {
          evalByCredential: {
            [credentialIdKey]: { first: base64ToBytes(record.salt) },
          },
        },
      },
    },
  });
  const results = credential?.getClientExtensionResults?.();
  const secret = results?.prf?.results?.first;
  if (!secret) throw new Error("PRF extension unavailable");
  return secret;
}

async function encryptSavedPassword(password, secret) {
  const key = await crypto.subtle.importKey("raw", secret, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(password));
  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  };
}

async function decryptSavedPassword(wrappedPassword, secret) {
  const key = await crypto.subtle.importKey("raw", secret, "AES-GCM", false, ["decrypt"]);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(wrappedPassword.iv) },
    key,
    base64ToBytes(wrappedPassword.ciphertext),
  );
  return new TextDecoder().decode(plainBuffer);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(value) {
  const bytes = new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function bytesToBase64Url(value) {
  return bytesToBase64(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64ToBase64Url(value) {
  return value.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  return base64ToBytes(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
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

storeUnlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await unlockStoreWithPassword(storeUnlockPassword.value);
});
storeFaceUnlock.addEventListener("click", () => unlockStoreWithBiometric());
storeFaceReset.addEventListener("click", resetStoreBiometric);
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
if (sessionStorage.getItem(STORE_SESSION_PASSWORD_KEY)) {
  setStoreUnlocked(sessionStorage.getItem(STORE_SESSION_PASSWORD_KEY));
} else {
  updateStoreUnlockUI();
  if (loadBiometricRecord() && hasBiometricRuntime()) {
    unlockStoreWithBiometric();
  } else {
    storeUnlockPassword.focus();
  }
}
registerServiceWorker().catch(console.error);
loadCatalog().catch((error) => {
  console.error(error);
  categoryStack.replaceChildren();
  emptyState.hidden = false;
  emptyState.textContent = "应用清单加载失败，请检查 apps.json。";
});
