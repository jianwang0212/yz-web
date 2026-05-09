const storageKey = "zapp:snow-white-board:tasks";
const lanesEl = document.querySelector("#lanes");
const taskForm = document.querySelector("#taskForm");
const exportButton = document.querySelector("#exportButton");
const progressPercent = document.querySelector("#progressPercent");
const openCount = document.querySelector("#openCount");
const doneCount = document.querySelector("#doneCount");
const progressBar = document.querySelector("#progressBar");
const focusLine = document.querySelector("#focusLine");

const stages = [
  { id: "writing", name: "Writing", hint: "词曲 / story / hook" },
  { id: "production", name: "Production", hint: "demo / score / mix" },
  { id: "release", name: "Release", hint: "archive / video / publish" }
];

const starterTasks = [
  {
    id: "story-frame",
    stage: "writing",
    title: "整理 Snow White 的故事线",
    note: "白裙、等待、记忆、承诺，压成一页创作说明。",
    done: true
  },
  {
    id: "lyrics-pass",
    stage: "writing",
    title: "歌词最终润色",
    note: "确认中英版本和每段情绪走向。",
    done: false
  },
  {
    id: "logic-demo",
    stage: "production",
    title: "Logic demo 结构确认",
    note: "verse / pre / chorus / bridge 的能量曲线。",
    done: true
  },
  {
    id: "score-package",
    stage: "production",
    title: "总谱与分谱包整理",
    note: "完整谱、lead sheet、vocal score、charts。",
    done: false
  },
  {
    id: "bilibili-season",
    stage: "release",
    title: "Bilibili 制作合集脚本",
    note: "E1 songwriting，E2 demo，E3 arrangement layers。",
    done: false
  },
  {
    id: "archive-page",
    stage: "release",
    title: "thisisyz 作品页维护",
    note: "音频、歌词、制作名单、预算、下载入口。",
    done: true
  }
];

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null") || starterTasks;
  } catch {
    return starterTasks;
  }
}

function saveTasks(tasks) {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function renderStats(tasks) {
  const done = tasks.filter((task) => task.done).length;
  const total = tasks.length || 1;
  const percent = Math.round((done / total) * 100);
  progressPercent.textContent = `${percent}%`;
  openCount.textContent = String(tasks.length - done);
  doneCount.textContent = String(done);
  progressBar.style.width = `${percent}%`;

  const nextTask = tasks.find((task) => !task.done);
  focusLine.textContent = nextTask
    ? `下一步：${nextTask.title}`
    : "所有任务都完成了，可以开始下一轮创作整理。";
}

function render() {
  const tasks = loadTasks();
  renderStats(tasks);
  lanesEl.replaceChildren(
    ...stages.map((stage) => {
      const lane = document.createElement("article");
      lane.className = "lane";

      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = stage.name;
      const count = document.createElement("small");
      const stageTasks = tasks.filter((task) => task.stage === stage.id);
      count.textContent = `${stageTasks.filter((task) => task.done).length}/${stageTasks.length}`;
      header.append(title, count);

      const hint = document.createElement("small");
      hint.textContent = stage.hint;

      const list = document.createElement("div");
      list.className = "task-list";
      list.replaceChildren(...stageTasks.map(renderTask));

      lane.append(header, hint, list);
      return lane;
    })
  );
}

function renderTask(task) {
  const item = document.createElement("article");
  item.className = `task${task.done ? " done" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", `完成 ${task.title}`);
  checkbox.addEventListener("change", () => {
    const tasks = loadTasks().map((current) =>
      current.id === task.id ? { ...current, done: checkbox.checked } : current
    );
    saveTasks(tasks);
    render();
  });

  const body = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = task.title;
  const note = document.createElement("p");
  note.textContent = task.note || "No note";
  body.append(title, note);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete-button";
  remove.title = "删除任务";
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    saveTasks(loadTasks().filter((current) => current.id !== task.id));
    render();
  });

  item.append(checkbox, body, remove);
  return item;
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const next = {
    id: crypto.randomUUID(),
    stage: String(formData.get("stage") || "writing"),
    title,
    note: String(formData.get("note") || "").trim(),
    done: false
  };

  saveTasks([next, ...loadTasks()]);
  taskForm.reset();
  render();
});

exportButton.addEventListener("click", () => {
  const payload = JSON.stringify(loadTasks(), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "snow-white-board.json";
  link.click();
  URL.revokeObjectURL(url);
});

render();
