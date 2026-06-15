const configs = {
  airchat: {
    name: "AirChat Lab",
    category: "Voice",
    icon: "../icons/apps/airchat.svg",
    accent: "#176f74",
    fields: [
      { name: "title", label: "标题", type: "text", required: true, placeholder: "Dinner idea, product note..." },
      { name: "mood", label: "语气", type: "select", options: ["Raw", "Thoughtful", "Question", "Decision"] },
      { name: "body", label: "内容", type: "textarea", placeholder: "说完以后把要点记在这里。" }
    ],
    stats(entries) {
      return [
        ["Notes", entries.length],
        ["Questions", entries.filter((entry) => entry.mood === "Question").length],
        ["Decisions", entries.filter((entry) => entry.mood === "Decision").length]
      ];
    }
  },
  workout: {
    name: "Workout Console",
    category: "Health",
    icon: "../icons/apps/workout.svg",
    accent: "#6d5f28",
    fields: [
      { name: "title", label: "动作", type: "text", required: true, placeholder: "Bench press" },
      { name: "mood", label: "肌群", type: "select", options: ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"] },
      { name: "weight", label: "重量", type: "number", placeholder: "80" },
      { name: "reps", label: "次数", type: "number", placeholder: "8" },
      { name: "body", label: "备注", type: "textarea", placeholder: "RPE, tempo, pain-free range..." }
    ],
    stats(entries) {
      const volume = entries.reduce((sum, entry) => sum + Number(entry.weight || 0) * Number(entry.reps || 0), 0);
      return [
        ["Sets", entries.length],
        ["Volume", volume || 0],
        ["Muscles", new Set(entries.map((entry) => entry.mood)).size]
      ];
    }
  },
  medical: {
    name: "Medical Notes",
    category: "Health",
    icon: "../icons/apps/medical.svg",
    accent: "#9a405f",
    fields: [
      { name: "title", label: "主题", type: "text", required: true, placeholder: "Headache, lab result, appointment..." },
      { name: "mood", label: "类型", type: "select", options: ["Symptom", "Medication", "Question", "Visit"] },
      { name: "body", label: "记录", type: "textarea", placeholder: "只做私人记录，不替代医生建议。" }
    ],
    stats(entries) {
      return [
        ["Items", entries.length],
        ["Questions", entries.filter((entry) => entry.mood === "Question").length],
        ["Meds", entries.filter((entry) => entry.mood === "Medication").length]
      ];
    }
  },
  food: {
    name: "Photo Food Log",
    category: "Food",
    icon: "../icons/apps/food.svg",
    accent: "#b2522c",
    fields: [
      { name: "title", label: "餐名", type: "text", required: true, placeholder: "Breakfast, post-workout..." },
      { name: "mood", label: "状态", type: "select", options: ["Balanced", "Protein", "Snack", "Treat"] },
      { name: "protein", label: "蛋白估算", type: "number", placeholder: "35" },
      { name: "photo", label: "照片", type: "file", accept: "image/*" },
      { name: "body", label: "备注", type: "textarea", placeholder: "Hunger, portion, energy..." }
    ],
    stats(entries) {
      const protein = entries.reduce((sum, entry) => sum + Number(entry.protein || 0), 0);
      return [
        ["Meals", entries.length],
        ["Protein", `${protein}g`],
        ["Photos", entries.filter((entry) => entry.photo).length]
      ];
    }
  },
  homeschool: {
    name: "Homeschool Board",
    category: "Learning",
    icon: "../icons/apps/homeschool.svg",
    accent: "#476f3b",
    fields: [
      { name: "title", label: "主题", type: "text", required: true, placeholder: "Math, reading, science walk..." },
      { name: "mood", label: "学科", type: "select", options: ["Math", "Reading", "Writing", "Science", "Art", "PE"] },
      { name: "minutes", label: "分钟", type: "number", placeholder: "30" },
      { name: "body", label: "产出", type: "textarea", placeholder: "Pages read, worksheet, questions, project note..." }
    ],
    stats(entries) {
      const minutes = entries.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
      return [
        ["Tasks", entries.length],
        ["Minutes", minutes],
        ["Subjects", new Set(entries.map((entry) => entry.mood)).size]
      ];
    }
  }
};

const params = new URLSearchParams(window.location.search);
const appId = params.get("app") || "airchat";
const config = configs[appId] || configs.airchat;
const storageKey = `zapp:${appId}:entries`;
const form = document.querySelector("#entryForm");
const entriesEl = document.querySelector("#entries");
const statsEl = document.querySelector("#stats");

document.documentElement.style.setProperty("--accent", config.accent);
document.documentElement.style.setProperty("--accent-strong", config.accent);
document.title = config.name;
document.querySelector("#appName").textContent = config.name;
document.querySelector("#appCategory").textContent = config.category;
document.querySelector("#appIcon").src = config.icon;

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function createField(field) {
  const wrap = document.createElement("div");
  wrap.className = "field";

  const label = document.createElement("label");
  label.htmlFor = field.name;
  label.textContent = field.label;

  let input;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
  } else if (field.type === "select") {
    input = document.createElement("select");
    field.options.forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option;
      input.append(item);
    });
  } else {
    input = document.createElement("input");
    input.type = field.type === "number" ? "text" : field.type;
    if (field.type === "number") {
      input.inputMode = "decimal";
      input.pattern = "[0-9]*";
    }
  }

  input.id = field.name;
  input.name = field.name;
  input.required = Boolean(field.required);
  if (field.placeholder) input.placeholder = field.placeholder;
  if (field.accept) input.accept = field.accept;

  wrap.append(label, input);
  return wrap;
}

function renderForm() {
  const submitRow = document.createElement("div");
  submitRow.className = "submit-row";

  const submit = document.createElement("button");
  submit.className = "primary-button";
  submit.type = "submit";
  submit.textContent = "Save";

  const exportButton = document.createElement("button");
  exportButton.className = "secondary-button";
  exportButton.type = "button";
  exportButton.textContent = "Export";
  exportButton.addEventListener("click", exportEntries);

  submitRow.append(submit, exportButton);
  form.replaceChildren(...config.fields.map(createField), submitRow);
}

function renderStats(entries) {
  statsEl.replaceChildren(
    ...config.stats(entries).map(([label, value]) => {
      const stat = document.createElement("div");
      stat.className = "stat";
      stat.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      return stat;
    }),
  );
}

function renderEntries() {
  const entries = loadEntries();
  renderStats(entries);

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No entries yet.";
    entriesEl.replaceChildren(empty);
    return;
  }

  entriesEl.replaceChildren(
    ...entries.map((entry) => {
      const card = document.createElement("article");
      card.className = "entry";

      const top = document.createElement("div");
      top.className = "entry__top";
      const titleWrap = document.createElement("div");
      const title = document.createElement("h2");
      title.textContent = entry.title;
      const time = document.createElement("time");
      time.dateTime = entry.createdAt;
      time.textContent = new Date(entry.createdAt).toLocaleString("zh-CN");
      titleWrap.append(title, time);

      const remove = document.createElement("button");
      remove.className = "delete-button";
      remove.type = "button";
      remove.title = "删除";
      remove.textContent = "×";
      remove.addEventListener("click", () => deleteEntry(entry.id));
      top.append(titleWrap, remove);

      const tags = document.createElement("div");
      tags.className = "tag-row";
      [entry.mood, entry.weight && `${entry.weight}kg`, entry.reps && `${entry.reps} reps`, entry.protein && `${entry.protein}g protein`, entry.minutes && `${entry.minutes} min`]
        .filter(Boolean)
        .forEach((tag) => {
          const span = document.createElement("span");
          span.className = "tag";
          span.textContent = tag;
          tags.append(span);
        });

      const body = document.createElement("p");
      body.textContent = entry.body || "";

      card.append(top);
      if (entry.photo) {
        const img = document.createElement("img");
        img.src = entry.photo;
        img.alt = entry.title;
        card.append(img);
      }
      card.append(tags, body);
      return card;
    }),
  );
}

async function readFileAsDataUrl(file) {
  if (!file) return "";
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  for (const field of config.fields) {
    if (field.type === "file") {
      entry[field.name] = await readFileAsDataUrl(formData.get(field.name));
    } else {
      entry[field.name] = String(formData.get(field.name) || "").trim();
    }
  }

  const entries = [entry, ...loadEntries()].slice(0, 80);
  saveEntries(entries);
  form.reset();
  renderEntries();
}

function deleteEntry(id) {
  saveEntries(loadEntries().filter((entry) => entry.id !== id));
  renderEntries();
}

function exportEntries() {
  const payload = JSON.stringify(loadEntries(), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${appId}-entries.json`;
  link.click();
  URL.revokeObjectURL(url);
}

renderForm();
renderEntries();
form.addEventListener("submit", handleSubmit);
