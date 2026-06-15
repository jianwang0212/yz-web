const storageKey = "zapp:wellness-log:entries";
const form = document.querySelector("#entryForm");
const timeline = document.querySelector("#timeline");
const exportButton = document.querySelector("#exportButton");
const statEls = {
  weekTrain: document.querySelector("#weekTrain"),
  weekMeditation: document.querySelector("#weekMeditation"),
  streak: document.querySelector("#streak"),
  energyAvg: document.querySelector("#energyAvg")
};

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

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

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function dateValue(date) {
  return new Date(`${date}T00:00:00`).valueOf();
}

function lastSevenDays(entries) {
  const end = dateValue(todayString());
  const start = end - 6 * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const value = dateValue(entry.date);
    return value >= start && value <= end;
  });
}

function computeStreak(entries) {
  const dates = new Set(entries.map((entry) => entry.date));
  let streak = 0;
  const cursor = new Date(`${todayString()}T00:00:00`);

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function renderStats(entries) {
  const week = lastSevenDays(entries);
  statEls.weekTrain.textContent = String(week.filter((entry) => toNumber(entry.trainingMinutes) > 0).length);
  statEls.weekMeditation.textContent = String(
    week.reduce((sum, entry) => sum + toNumber(entry.meditationMinutes), 0)
  );
  statEls.streak.textContent = String(computeStreak(entries));

  if (!week.length) {
    statEls.energyAvg.textContent = "--";
    return;
  }

  const average = week.reduce((sum, entry) => sum + toNumber(entry.energy), 0) / week.length;
  statEls.energyAvg.textContent = average.toFixed(1);
}

function render() {
  const entries = loadEntries().sort((a, b) => dateValue(b.date) - dateValue(a.date));
  renderStats(entries);

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "还没有记录。先保存今天的一条。";
    timeline.replaceChildren(empty);
    return;
  }

  timeline.replaceChildren(...entries.map(renderEntry));
}

function renderEntry(entry) {
  const item = document.createElement("article");
  item.className = "entry";

  const header = document.createElement("header");
  const titleBlock = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = entry.focus;
  const time = document.createElement("time");
  time.dateTime = entry.date;
  time.textContent = entry.date;
  titleBlock.append(title, time);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete-button";
  remove.title = "删除记录";
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    saveEntries(loadEntries().filter((current) => current.id !== entry.id));
    render();
  });
  header.append(titleBlock, remove);

  const tags = document.createElement("div");
  tags.className = "tag-row";
  [
    entry.training && { text: entry.training, tone: "" },
    toNumber(entry.trainingMinutes) > 0 && { text: `${entry.trainingMinutes} min training`, tone: "blue" },
    toNumber(entry.meditationMinutes) > 0 && { text: `${entry.meditationMinutes} min meditation`, tone: "" },
    toNumber(entry.sleepHours) > 0 && { text: `${entry.sleepHours}h sleep`, tone: "rose" },
    { text: `Energy ${entry.energy}/5`, tone: "" }
  ]
    .filter(Boolean)
    .forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = `tag ${tag.tone}`.trim();
      chip.textContent = tag.text;
      tags.append(chip);
    });

  const note = document.createElement("p");
  note.textContent = entry.note || "No note";

  item.append(header, tags, note);
  return item;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const entry = {
    id: crypto.randomUUID(),
    date: String(formData.get("date") || todayString()),
    focus: String(formData.get("focus") || "Mixed"),
    training: String(formData.get("training") || "").trim(),
    trainingMinutes: String(formData.get("trainingMinutes") || "").trim(),
    meditationMinutes: String(formData.get("meditationMinutes") || "").trim(),
    sleepHours: String(formData.get("sleepHours") || "").trim(),
    energy: String(formData.get("energy") || "3"),
    note: String(formData.get("note") || "").trim()
  };

  const entries = [entry, ...loadEntries()].slice(0, 120);
  saveEntries(entries);
  form.reset();
  form.elements.date.value = todayString();
  render();
});

exportButton.addEventListener("click", () => {
  const payload = JSON.stringify(loadEntries(), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wellness-log.json";
  link.click();
  URL.revokeObjectURL(url);
});

form.elements.date.value = todayString();
render();
