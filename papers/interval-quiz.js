const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PITCH = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const DISPLAY_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const QUESTIONS_PER_SET = 10;
const MISTAKE_STORAGE_KEY = "interval-quiz-mistakes";
const SLOW_RESPONSE_MS = 8000;
const LANGUAGE_STORAGE_KEY = "interval-quiz-language";
const VOICE_AUTO_STORAGE_KEY = "interval-quiz-voice-auto";
const INTERVAL_STORAGE_KEY = "interval-quiz-enabled-intervals";
const DEFAULT_FEEDBACK = { key: "", type: "", values: null };
const RECENT_QUESTION_LIMIT = 6;
const DOUBLE_ACCIDENTAL_RE = /bb|##/;

const INTERVALS = [
  { id: "b2", label: "b2", semitones: 1, letterOffset: 1 },
  { id: "2", label: "2", semitones: 2, letterOffset: 1 },
  { id: "#2", label: "#2", semitones: 3, letterOffset: 1 },
  { id: "b3", label: "b3", semitones: 3, letterOffset: 2 },
  { id: "3", label: "3", semitones: 4, letterOffset: 2 },
  { id: "4", label: "4", semitones: 5, letterOffset: 3 },
  { id: "#4", label: "#4", semitones: 6, letterOffset: 3 },
  { id: "b5", label: "b5", semitones: 6, letterOffset: 4 },
  { id: "5", label: "5", semitones: 7, letterOffset: 4 },
  { id: "#5", label: "#5", semitones: 8, letterOffset: 4 },
  { id: "b6", label: "b6", semitones: 8, letterOffset: 5 },
  { id: "6", label: "6", semitones: 9, letterOffset: 5 },
  { id: "b7", label: "b7", semitones: 10, letterOffset: 6 },
  { id: "7", label: "7", semitones: 11, letterOffset: 6 },
  { id: "b9", label: "b9", semitones: 1, letterOffset: 1 },
  { id: "9", label: "9", semitones: 2, letterOffset: 1 },
  { id: "#9", label: "#9", semitones: 3, letterOffset: 1 },
  { id: "11", label: "11", semitones: 5, letterOffset: 3 },
  { id: "#11", label: "#11", semitones: 6, letterOffset: 3 },
  { id: "b13", label: "b13", semitones: 8, letterOffset: 5 },
  { id: "13", label: "13", semitones: 9, letterOffset: 5 },
];

const ROOT_POOL = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const INTERVAL_PRESETS = {
  core: ["b3", "3", "5", "b7", "7"],
  extensions: ["b9", "9", "#9", "11", "#11", "b13", "13"],
  all: INTERVALS.map((interval) => interval.id),
};

function createIntervalPerformance() {
  return Object.fromEntries(
    INTERVALS.map((interval) => [
      interval.id,
      { attempts: 0, wrong: 0, slow: 0 },
    ]),
  );
}

const state = {
  currentQuestion: null,
  total: 0,
  correct: 0,
  round: 1,
  language: loadLanguage(),
  enabledIntervals: loadEnabledIntervals(),
  mistakeCounts: loadMistakeCounts(),
  questionStartedAt: Date.now(),
  reviewNotes: [],
  lastFeedback: { ...DEFAULT_FEEDBACK },
  voiceAuto: loadVoiceAuto(),
  voiceStatusKey: "voiceReady",
  voiceStatusValues: null,
  pendingSpeechReason: "",
  reviewQueue: [],
  recentQuestionKeys: [],
  streak: 0,
  bestStreak: 0,
  answeredCount: 0,
  totalResponseMs: 0,
  intervalPerformance: createIntervalPerformance(),
};

const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");
const nextBtn = document.getElementById("next-btn");
const revealBtn = document.getElementById("reveal-btn");
const clearNotesBtn = document.getElementById("clear-notes-btn");
const langEnBtn = document.getElementById("lang-en-btn");
const langZhBtn = document.getElementById("lang-zh-btn");
const totalCountEl = document.getElementById("total-count");
const correctCountEl = document.getElementById("correct-count");
const accuracyCountEl = document.getElementById("accuracy-count");
const remainingCountEl = document.getElementById("remaining-count");
const streakCountEl = document.getElementById("streak-count");
const bestStreakCountEl = document.getElementById("best-streak-count");
const avgTimeCountEl = document.getElementById("avg-time-count");
const setProgressBarEl = document.getElementById("set-progress-bar");
const setProgressCopyEl = document.getElementById("set-progress-copy");
const focusIntervalsEl = document.getElementById("focus-intervals");
const intervalOptionsEl = document.getElementById("interval-options");
const mistakeNotesEl = document.getElementById("mistake-notes");
const pianoEl = document.getElementById("iq-piano");
const midiEnableBtn = document.getElementById("midi-enable-btn");
const midiStatusEl = document.getElementById("midi-status");
const voiceAutoToggle = document.getElementById("voice-auto-toggle");
const voiceRepeatBtn = document.getElementById("voice-repeat-btn");
const voiceStatusEl = document.getElementById("voice-status");
const presetButtons = Array.from(document.querySelectorAll("[data-preset]"));

const WHITE_KEY_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [
  { pitchClass: 1, afterWhiteIndex: 0 },
  { pitchClass: 3, afterWhiteIndex: 1 },
  { pitchClass: 6, afterWhiteIndex: 3 },
  { pitchClass: 8, afterWhiteIndex: 4 },
  { pitchClass: 10, afterWhiteIndex: 5 },
];

let midiAccess = null;
let midiConnected = false;
let voicesReady = false;
let voiceInitialized = false;
let activeUtterance = null;

const COPY = {
  en: {
    heroEyebrow: "Music Theory Drill",
    heroTitle: "Interval Quiz",
    heroSubtitle: "Practice questions like “Which root has this note as its 13, b13, 9, or #11?”",
    questionLabel: "Question",
    nextButton: "Next",
    answerLabel: "Your Answer",
    answerPlaceholder: "Enter a root, like C / F# / Bb",
    submitButton: "Submit",
    revealButton: "Show Answer",
    voiceAuto: "Auto voice",
    voiceRepeat: "Speak again",
    voiceReady: "Voice ready",
    voiceNeedsTap: "Click anywhere once to enable voice.",
    voiceSpeaking: "Speaking…",
    voiceDone: "Spoken",
    voiceUnsupported: "Voice: not supported in this browser.",
    voiceError: "Voice error",
    voiceOff: "Voice off",
    notesLabel: "Review",
    notesTitle: "Sticky Notes",
    clearButton: "Clear",
    emptyNotes: "Wrong or slow answers will leave sticky notes here.",
    statsLabel: "Stats",
    progressTitle: "Progress",
    setProgressLabel: "Set Progress",
    correctLabel: "Correct",
    roundLabel: "Round",
    remainingLabel: "Remaining",
    streakLabel: "Streak",
    bestStreakLabel: "Best Streak",
    avgTimeLabel: "Avg Time",
    focusTitle: "Focus Now",
    reviewDueChip: "Review due {count}",
    bestStreakChip: "Best streak {count}",
    focusChip: "{interval} x{count}",
    focusClean: "Clean slate so far",
    progressSummary: "Round {round} · {remaining} left · {review} review due",
    intervalLabel: "Intervals",
    intervalTitle: "Interval Types",
    presetCore: "Chord tones",
    presetExtensions: "Extensions",
    presetAll: "All",
    intervalHelper: "Use presets for a quick drill shift, then fine-tune with the chips below.",
    keyboardTitle: "Keyboard input",
    keyboardHint:
      "Click the piano keys, or connect a MIDI keyboard (Chrome / Edge). Each press fills one root; you can still type in the box or press Backspace to edit.",
    shortcutHint: "Shortcuts: / focus, N next, R reveal, Esc clear.",
    midiEnable: "Enable MIDI keyboard",
    midiIdle: "MIDI: off — click Enable, then play any note.",
    midiConnected: "MIDI: listening — play any note to fill the root.",
    midiUnavailable: "MIDI: not supported in this browser.",
    midiBusy: "MIDI: connecting…",
    loading: "Loading...",
    questionTemplate: "{target} is which note's {interval}?",
    noteKindSlow: "Too Slow",
    noteKindMistake: "Wrong",
    noteYourAnswer: "You wrote: {answer}",
    noteCorrectAnswer: "Correct answer: {answer}",
    noteTime: "Time: {seconds} sec",
    emptyInput: "Enter a root first.",
    invalidInput: "Invalid format. Use note names like C, F#, or Bb.",
    correctFeedback: "Correct. {target} is the {interval} of {answer}.",
    wrongFeedback: "Wrong. {target} is the {interval} of {answer}.",
    revealFeedback: "Answer: {answer}.",
    finishRound: "Round {round} complete: {correct} / {total}. Starting next round.",
  },
  zh: {
    heroEyebrow: "乐理训练",
    heroTitle: "音程测验",
    heroSubtitle: "练习“这个音是哪个主音的 13、b13、9、#11”这类题目。",
    questionLabel: "题目",
    nextButton: "换一题",
    answerLabel: "你的答案",
    answerPlaceholder: "输入主音，例如 C / F# / Bb",
    submitButton: "提交",
    revealButton: "显示答案",
    voiceAuto: "自动播报",
    voiceRepeat: "再念一次",
    voiceReady: "语音已就绪",
    voiceNeedsTap: "先点一下页面，再启用语音。",
    voiceSpeaking: "正在播报…",
    voiceDone: "已播报",
    voiceUnsupported: "当前浏览器不支持语音播报。",
    voiceError: "语音错误",
    voiceOff: "语音关闭",
    notesLabel: "错题",
    notesTitle: "贴纸板",
    clearButton: "清空",
    emptyNotes: "答错后会在这里留下小贴纸。",
    statsLabel: "统计",
    progressTitle: "进度",
    setProgressLabel: "本组进度",
    correctLabel: "答对",
    roundLabel: "组数",
    remainingLabel: "剩余",
    streakLabel: "连对",
    bestStreakLabel: "最高连对",
    avgTimeLabel: "平均用时",
    focusTitle: "重点关注",
    reviewDueChip: "待复习 {count}",
    bestStreakChip: "最高连对 {count}",
    focusChip: "{interval} ×{count}",
    focusClean: "目前状态很干净",
    progressSummary: "第 {round} 组 · 还剩 {remaining} 题 · 待复习 {review}",
    intervalLabel: "题型",
    intervalTitle: "扩展音程",
    presetCore: "和弦音",
    presetExtensions: "延伸音",
    presetAll: "全部",
    intervalHelper: "可先用预设快速切题，再用下面的小选项微调训练范围。",
    keyboardTitle: "键盘输入",
    keyboardHint:
      "可点击屏幕钢琴，或连接 MIDI 电钢琴（推荐 Chrome / Edge）。每次弹奏或点击会填入一个主音；仍可在输入框里打字或用退格修改。",
    shortcutHint: "快捷键：/ 聚焦输入，N 下一题，R 看答案，Esc 清空。",
    midiEnable: "开启 MIDI 键盘",
    midiIdle: "MIDI：未开启 — 点按钮后弹奏任意音符即可填入主音。",
    midiConnected: "MIDI：已连接 — 弹奏任意音符填入主音。",
    midiUnavailable: "MIDI：当前浏览器不支持 Web MIDI。",
    midiBusy: "MIDI：正在连接…",
    loading: "加载中...",
    questionTemplate: "{target} 是什么音的 {interval} ?",
    noteKindSlow: "想太久",
    noteKindMistake: "答错了",
    noteYourAnswer: "你写的是: {answer}",
    noteCorrectAnswer: "正确答案: {answer}",
    noteTime: "用时: {seconds} 秒",
    emptyInput: "先输入一个主音。",
    invalidInput: "格式不对。请输入类似 C、F#、Bb 这样的音名。",
    correctFeedback: "对。{target} 是 {answer} 的 {interval}。",
    wrongFeedback: "错。{target} 是 {answer} 的 {interval}。",
    revealFeedback: "答案是 {answer}。",
    finishRound: "第 {round} 组完成: {correct} / {total}。下一组开始。",
  },
};

function normalizeInput(value) {
  return value.trim().replace(/\s+/g, "").replace(/♭/g, "b").replace(/♯/g, "#");
}

function loadLanguage() {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "zh" || stored === "en") {
    return stored;
  }
  const site = window.localStorage.getItem("language");
  return site === "zh" ? "zh" : "en";
}

function loadVoiceAuto() {
  const stored = window.localStorage.getItem(VOICE_AUTO_STORAGE_KEY);
  if (stored === "0") {
    return false;
  }
  return true;
}

function loadEnabledIntervals() {
  try {
    const raw = window.localStorage.getItem(INTERVAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!Array.isArray(parsed)) {
      return new Set(INTERVALS.map((interval) => interval.id));
    }

    const valid = parsed.filter((id) => INTERVALS.some((interval) => interval.id === id));
    return new Set(valid.length ? valid : INTERVALS.map((interval) => interval.id));
  } catch {
    return new Set(INTERVALS.map((interval) => interval.id));
  }
}

function saveVoiceAuto() {
  window.localStorage.setItem(VOICE_AUTO_STORAGE_KEY, state.voiceAuto ? "1" : "0");
}

function saveEnabledIntervals() {
  window.localStorage.setItem(INTERVAL_STORAGE_KEY, JSON.stringify(Array.from(state.enabledIntervals)));
}

function saveLanguage() {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
}

function t(key, values = {}) {
  const template = COPY[state.language][key] || "";
  return template.replace(/\{(\w+)\}/g, (_, token) => String(values[token] ?? ""));
}

function setFeedbackByKey(key, type = "", values = null) {
  state.lastFeedback = { key, type, values };
  feedbackEl.textContent = key ? t(key, values || {}) : "";
  feedbackEl.className = `feedback ${type}`.trim();
}

function setVoiceStatus(key, values = null) {
  state.voiceStatusKey = key;
  state.voiceStatusValues = values;
  if (voiceStatusEl) {
    voiceStatusEl.textContent = key ? t(key, values || {}) : "";
  }
}

function loadMistakeCounts() {
  try {
    const raw = window.localStorage.getItem(MISTAKE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveMistakeCounts() {
  window.localStorage.setItem(MISTAKE_STORAGE_KEY, JSON.stringify(state.mistakeCounts));
}

function parseNote(noteName) {
  const normalized = normalizeInput(noteName);
  const match = normalized.match(/^([A-Ga-g])([b#]{0,2})$/);

  if (!match) {
    return null;
  }

  const letter = match[1].toUpperCase();
  const accidentals = match[2] || "";
  let pitch = NATURAL_PITCH[letter];

  for (const accidental of accidentals) {
    pitch += accidental === "#" ? 1 : -1;
  }

  return {
    normalized: `${letter}${accidentals}`,
    letter,
    pitchClass: ((pitch % 12) + 12) % 12,
  };
}

function spellInterval(rootName, interval) {
  const root = parseNote(rootName);

  if (!root) {
    return null;
  }

  const rootLetterIndex = LETTERS.indexOf(root.letter);
  const targetLetter = LETTERS[(rootLetterIndex + interval.letterOffset) % LETTERS.length];
  const targetPitchClass = (root.pitchClass + interval.semitones) % 12;
  const naturalTargetPitch = NATURAL_PITCH[targetLetter];
  let accidentalDelta = targetPitchClass - naturalTargetPitch;

  if (accidentalDelta > 6) {
    accidentalDelta -= 12;
  }

  if (accidentalDelta < -6) {
    accidentalDelta += 12;
  }

  if (Math.abs(accidentalDelta) > 2) {
    return null;
  }

  const accidental =
    accidentalDelta > 0 ? "#".repeat(accidentalDelta) : "b".repeat(Math.abs(accidentalDelta));

  return `${targetLetter}${accidental}`;
}

function getPitchClass(noteName) {
  const parsed = parseNote(noteName);
  return parsed ? parsed.pitchClass : null;
}

function getQuestionKey(answer, interval) {
  return `${answer}|${interval.id}`;
}

function formatAverageResponseTime() {
  if (!state.answeredCount) {
    return "--";
  }

  const averageMs = state.totalResponseMs / state.answeredCount;
  const unit = state.language === "zh" ? "秒" : "s";
  return `${(averageMs / 1000).toFixed(1)}${unit}`;
}

function rememberQuestion(key) {
  state.recentQuestionKeys.unshift(key);
  if (state.recentQuestionKeys.length > RECENT_QUESTION_LIMIT) {
    state.recentQuestionKeys.length = RECENT_QUESTION_LIMIT;
  }
}

function isRecentQuestion(key) {
  return state.recentQuestionKeys.includes(key);
}

function enqueueReview(question, amount = 1) {
  for (let count = 0; count < amount; count += 1) {
    state.reviewQueue.push(question.key);
  }
}

function getReviewDueCount() {
  return new Set(state.reviewQueue).size;
}

function getFocusIntervals() {
  return INTERVALS.filter((interval) => state.enabledIntervals.has(interval.id))
    .map((interval) => {
      const performance = state.intervalPerformance[interval.id];
      return {
        interval,
        pressure: performance.wrong * 2 + performance.slow,
      };
    })
    .filter((entry) => entry.pressure > 0)
    .sort((left, right) => right.pressure - left.pressure)
    .slice(0, 3);
}

function renderFocusIntervals() {
  if (!focusIntervalsEl) {
    return;
  }

  focusIntervalsEl.innerHTML = "";

  const appendPill = (text, muted = false) => {
    const pill = document.createElement("span");
    pill.className = `iq-pill${muted ? " iq-pill--muted" : ""}`;
    pill.textContent = text;
    focusIntervalsEl.append(pill);
  };

  if (state.reviewQueue.length > 0) {
    appendPill(t("reviewDueChip", { count: getReviewDueCount() }));
  }

  if (state.bestStreak > 0) {
    appendPill(t("bestStreakChip", { count: state.bestStreak }));
  }

  for (const focusItem of getFocusIntervals()) {
    appendPill(t("focusChip", { interval: focusItem.interval.label, count: focusItem.pressure }));
  }

  if (!focusIntervalsEl.childElementCount) {
    appendPill(t("focusClean"), true);
  }
}

function getCandidatePool() {
  const availableIntervals = INTERVALS.filter((interval) => state.enabledIntervals.has(interval.id));
  const candidates = [];

  for (const interval of availableIntervals) {
    for (const answer of ROOT_POOL) {
      const target = spellInterval(answer, interval);
      if (!target || DOUBLE_ACCIDENTAL_RE.test(target)) {
        continue;
      }

      candidates.push({
        interval,
        answer,
        target,
        key: getQuestionKey(answer, interval),
      });
    }
  }

  return candidates;
}

function maybePickReviewQuestion(candidateByKey) {
  if (!state.reviewQueue.length) {
    return null;
  }

  const reviewChance = Math.min(0.82, 0.28 + state.reviewQueue.length * 0.12);
  if (Math.random() > reviewChance) {
    return null;
  }

  for (let index = 0; index < state.reviewQueue.length; index += 1) {
    const candidate = candidateByKey.get(state.reviewQueue[index]);

    if (!candidate) {
      state.reviewQueue.splice(index, 1);
      index -= 1;
      continue;
    }

    if (isRecentQuestion(candidate.key) && state.reviewQueue.length > 1) {
      continue;
    }

    state.reviewQueue.splice(index, 1);
    return candidate;
  }

  const fallbackKey = state.reviewQueue.shift();
  return fallbackKey ? candidateByKey.get(fallbackKey) || null : null;
}

function weightedPick(items, getWeight) {
  const weightedItems = items.map((item) => ({ item, weight: Math.max(0, getWeight(item)) }));
  const totalWeight = weightedItems.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)];
  }

  let pick = Math.random() * totalWeight;

  for (const entry of weightedItems) {
    pick -= entry.weight;
    if (pick <= 0) {
      return entry.item;
    }
  }

  return weightedItems[weightedItems.length - 1].item;
}

function getIntervalWeight(interval) {
  if (interval.id === "6") {
    return 3.2;
  }

  if (interval.id === "b7") {
    return 3.5;
  }

  return 1;
}

function buildQuestion() {
  const candidates = getCandidatePool();

  if (!candidates.length) {
    return null;
  }

  const candidateByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const reviewCandidate = maybePickReviewQuestion(candidateByKey);
  if (reviewCandidate) {
    return reviewCandidate;
  }

  const freshPool = candidates.filter((candidate) => !isRecentQuestion(candidate.key));
  const selectionPool = freshPool.length ? freshPool : candidates;
  return weightedPick(selectionPool, (candidate) => {
    const mistakeBoost = state.mistakeCounts[candidate.key] || 0;
    return getIntervalWeight(candidate.interval) + mistakeBoost * 2.2;
  });
}

function updateStats() {
  totalCountEl.textContent = `${state.total}/${QUESTIONS_PER_SET}`;
  correctCountEl.textContent = String(state.correct);
  accuracyCountEl.textContent = `${state.round}`;
  if (remainingCountEl) {
    remainingCountEl.textContent = String(Math.max(0, QUESTIONS_PER_SET - state.total));
  }
  if (streakCountEl) {
    streakCountEl.textContent = String(state.streak);
  }
  if (bestStreakCountEl) {
    bestStreakCountEl.textContent = String(state.bestStreak);
  }
  if (avgTimeCountEl) {
    avgTimeCountEl.textContent = formatAverageResponseTime();
  }
  if (setProgressBarEl) {
    setProgressBarEl.style.width = `${(state.total / QUESTIONS_PER_SET) * 100}%`;
  }
  if (setProgressCopyEl) {
    setProgressCopyEl.textContent = t("progressSummary", {
      round: state.round,
      remaining: Math.max(0, QUESTIONS_PER_SET - state.total),
      review: getReviewDueCount(),
    });
  }
  renderFocusIntervals();
}

function getQuestionSpeechText(question) {
  if (!question) {
    return "";
  }

  const target = speakableNote(question.target);
  const interval = speakableInterval(question.interval.label);

  if (state.language === "zh") {
    return `${target}，是什么音的${interval}？`;
  }

  return `${target} is which note's ${interval}?`;
}

function speakableNote(note) {
  if (!note) {
    return "";
  }

  const parsed = parseNote(note);
  if (!parsed) {
    return note;
  }

  if (state.language === "zh") {
    if (parsed.normalized.includes("b")) {
      return `降${parsed.letter}`;
    }
    if (parsed.normalized.includes("#")) {
      return `升${parsed.letter}`;
    }
    return parsed.letter;
  }

  if (parsed.normalized.includes("b")) {
    return `${parsed.letter} flat`;
  }
  if (parsed.normalized.includes("#")) {
    return `${parsed.letter} sharp`;
  }
  return `${parsed.letter}.`;
}

function speakableInterval(label) {
  const zh = {
    b2: "降二度",
    2: "二度",
    "#2": "升二度",
    b3: "降三度",
    3: "三度",
    4: "四度",
    "#4": "升四度",
    b5: "降五度",
    5: "五度",
    "#5": "升五度",
    b6: "降六度",
    6: "六度",
    b7: "降七度",
    7: "七度",
    b9: "降九度",
    9: "九度",
    "#9": "升九度",
    11: "十一度",
    "#11": "升十一度",
    b13: "降十三度",
    13: "十三度",
  };
  const en = {
    b2: "flat two",
    2: "two",
    "#2": "sharp two",
    b3: "flat three",
    3: "three",
    4: "four",
    "#4": "sharp four",
    b5: "flat five",
    5: "five",
    "#5": "sharp five",
    b6: "flat six",
    6: "six",
    b7: "flat seven",
    7: "seven",
    b9: "flat nine",
    9: "nine",
    "#9": "sharp nine",
    11: "eleven",
    "#11": "sharp eleven",
    b13: "flat thirteen",
    13: "thirteen",
  };

  if (state.language === "zh") {
    return zh[label] || label;
  }
  return en[label] || label;
}

function canUseSpeech() {
  return "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

function loadSpeechVoices() {
  if (!canUseSpeech()) {
    setVoiceStatus("voiceUnsupported");
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesReady = true;
  }
  return voices;
}

function pickVoice() {
  const voices = loadSpeechVoices();
  if (!voices.length) {
    return null;
  }

  const preferredLangs = state.language === "zh" ? ["zh-CN", "zh", "en-US", "en-GB"] : ["en-US", "en-GB", "en", "zh-CN"];
  for (const lang of preferredLangs) {
    const exact = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (exact) {
      return exact;
    }
  }
  return voices[0];
}

function stopSpeech() {
  if (canUseSpeech()) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
}

function speakCurrentQuestion(force = false) {
  if (!state.currentQuestion) {
    return;
  }

  if (!canUseSpeech()) {
    setVoiceStatus("voiceUnsupported");
    return;
  }

  if (!force && !state.voiceAuto) {
    setVoiceStatus("voiceOff");
    return;
  }

  const speechText = getQuestionSpeechText(state.currentQuestion);
  if (!speechText) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  const voice = pickVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = state.language === "zh" ? "zh-CN" : "en-US";
  }
  utterance.rate = state.language === "zh" ? 0.95 : 0.92;
  utterance.pitch = 1;

  utterance.onstart = () => {
    setVoiceStatus("voiceSpeaking");
  };

  utterance.onend = () => {
    activeUtterance = null;
    setVoiceStatus("voiceDone");
  };

  utterance.onerror = (event) => {
    activeUtterance = null;
    const error = event.error || "";
    if (error === "interrupted" || error === "canceled") {
      setVoiceStatus("voiceReady");
      return;
    }
    if (error === "not-allowed") {
      state.pendingSpeechReason = "blocked";
      setVoiceStatus("voiceNeedsTap");
      return;
    }
    setVoiceStatus("voiceError", { error });
  };

  try {
    stopSpeech();
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    state.pendingSpeechReason = "blocked";
    setVoiceStatus("voiceNeedsTap");
  }
}

function maybeAutoSpeakQuestion() {
  if (!state.voiceAuto || !state.currentQuestion) {
    if (!state.voiceAuto) {
      setVoiceStatus("voiceOff");
    }
    return;
  }

  if (!voiceInitialized) {
    state.pendingSpeechReason = "pending";
    setVoiceStatus("voiceNeedsTap");
    return;
  }

  window.setTimeout(() => {
    if (state.currentQuestion) {
      speakCurrentQuestion(false);
    }
  }, 90);
}

function initializeVoice() {
  if (!canUseSpeech()) {
    setVoiceStatus("voiceUnsupported");
    return;
  }

  loadSpeechVoices();
  voiceInitialized = true;
  if (state.pendingSpeechReason && state.currentQuestion && state.voiceAuto) {
    state.pendingSpeechReason = "";
    speakCurrentQuestion(false);
    return;
  }
  setVoiceStatus(state.voiceAuto ? "voiceReady" : "voiceOff");
}

function renderQuestion() {
  state.currentQuestion = buildQuestion();
  if (!state.currentQuestion) {
    return;
  }
  rememberQuestion(state.currentQuestion.key);
  state.questionStartedAt = Date.now();
  questionEl.textContent = t("questionTemplate", {
    target: state.currentQuestion.target,
    interval: state.currentQuestion.interval.label,
  });
  answerInput.value = "";
  setFeedbackByKey("", "");
  answerInput.focus();
  maybeAutoSpeakQuestion();
}

function addReviewNote({ kind, userAnswer, question, responseTime }) {
  state.reviewNotes.unshift({
    kind,
    userAnswer: normalizeInput(userAnswer),
    target: question.target,
    interval: question.interval.label,
    answer: question.answer,
    responseTime,
  });
  renderReviewNotes();
}

function clearMistakeNotes() {
  state.reviewNotes = [];
  renderReviewNotes();
}

function recordMistake(question) {
  state.mistakeCounts[question.key] = (state.mistakeCounts[question.key] || 0) + 1;
  saveMistakeCounts();
}

function recordSlowResponse(question) {
  state.mistakeCounts[question.key] = (state.mistakeCounts[question.key] || 0) + 0.7;
  saveMistakeCounts();
}

function recordIntervalOutcome(question, { isCorrect, isSlow }) {
  const performance = state.intervalPerformance[question.interval.id];
  if (!performance) {
    return;
  }

  performance.attempts += 1;
  if (!isCorrect) {
    performance.wrong += 1;
  }
  if (isSlow) {
    performance.slow += 1;
  }
}

function finishRound() {
  const finishedRound = state.round;
  const finishedCorrect = state.correct;
  state.total = 0;
  state.correct = 0;
  state.round += 1;
  updateStats();
  renderQuestion();
  setFeedbackByKey("finishRound", "success", {
    round: finishedRound,
    correct: finishedCorrect,
    total: QUESTIONS_PER_SET,
  });
}

function isCorrectAnswer(userAnswer, question) {
  const parsed = parseNote(userAnswer);

  if (!parsed) {
    return false;
  }

  return parsed.pitchClass === getPitchClass(question.answer);
}

function submitAnswer(event) {
  event.preventDefault();
  const rawAnswer = answerInput.value;
  const responseTime = Date.now() - state.questionStartedAt;
  const isSlow = responseTime > SLOW_RESPONSE_MS;

  if (!rawAnswer.trim()) {
    setFeedbackByKey("emptyInput", "error");
    return;
  }

  if (!parseNote(rawAnswer)) {
    setFeedbackByKey("invalidInput", "error");
    return;
  }

  state.total += 1;
  state.answeredCount += 1;
  state.totalResponseMs += responseTime;
  const isCorrect = isCorrectAnswer(rawAnswer, state.currentQuestion);

  if (isCorrect) {
    state.correct += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    if (isSlow) {
      recordSlowResponse(state.currentQuestion);
      enqueueReview(state.currentQuestion);
      addReviewNote({
        kind: "slow",
        userAnswer: rawAnswer,
        question: state.currentQuestion,
        responseTime,
      });
    }
    setFeedbackByKey("correctFeedback", "success", {
      target: state.currentQuestion.target,
      answer: state.currentQuestion.answer,
      interval: state.currentQuestion.interval.label,
    });
  } else {
    state.streak = 0;
    recordMistake(state.currentQuestion);
    enqueueReview(state.currentQuestion, 2);
    addReviewNote({
      kind: "mistake",
      userAnswer: rawAnswer,
      question: state.currentQuestion,
      responseTime,
    });
    setFeedbackByKey("wrongFeedback", "error", {
      target: state.currentQuestion.target,
      answer: state.currentQuestion.answer,
      interval: state.currentQuestion.interval.label,
    });
  }

  recordIntervalOutcome(state.currentQuestion, {
    isCorrect,
    isSlow,
  });
  updateStats();

  if (state.total >= QUESTIONS_PER_SET) {
    window.setTimeout(finishRound, 500);
    return;
  }

  window.setTimeout(renderQuestion, 220);
}

function revealAnswer() {
  if (state.currentQuestion) {
    enqueueReview(state.currentQuestion);
    updateStats();
  }
  setFeedbackByKey("revealFeedback", "success", { answer: state.currentQuestion.answer });
  answerInput.focus();
}

function renderReviewNotes() {
  mistakeNotesEl.innerHTML = "";

  if (state.reviewNotes.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-notes";
    emptyState.textContent = t("emptyNotes");
    mistakeNotesEl.append(emptyState);
    return;
  }

  for (const reviewNote of state.reviewNotes) {
    const note = document.createElement("article");
    note.className = `mistake-note ${reviewNote.kind === "slow" ? "slow-note" : ""}`.trim();

    const kindLine = document.createElement("p");
    kindLine.className = "note-kind";
    kindLine.textContent = reviewNote.kind === "slow" ? t("noteKindSlow") : t("noteKindMistake");

    const questionLine = document.createElement("p");
    questionLine.className = "mistake-question";
    questionLine.textContent = t("questionTemplate", {
      target: reviewNote.target,
      interval: reviewNote.interval,
    });

    const yourAnswerLine = document.createElement("p");
    yourAnswerLine.textContent = t("noteYourAnswer", { answer: reviewNote.userAnswer });

    const correctAnswerLine = document.createElement("p");
    correctAnswerLine.textContent = t("noteCorrectAnswer", { answer: reviewNote.answer });

    note.append(kindLine, questionLine, yourAnswerLine, correctAnswerLine);

    if (reviewNote.kind === "slow") {
      const timingLine = document.createElement("p");
      timingLine.textContent = t("noteTime", {
        seconds: (reviewNote.responseTime / 1000).toFixed(1),
      });
      note.append(timingLine);
    }

    mistakeNotesEl.append(note);
  }
}

function applyStaticCopy() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.title = `${t("heroTitle")} · Zi Yin`;
  answerInput.placeholder = t("answerPlaceholder");

  for (const element of document.querySelectorAll("[data-quiz]")) {
    const key = element.getAttribute("data-quiz");
    if (key) {
      element.textContent = t(key);
    }
  }
  refreshMidiStatusText();
  if (voiceAutoToggle) {
    voiceAutoToggle.checked = state.voiceAuto;
  }
  setVoiceStatus(state.voiceStatusKey, state.voiceStatusValues);
}

function applyPitchToAnswer(pitchClass) {
  const pc = ((pitchClass % 12) + 12) % 12;
  answerInput.value = DISPLAY_NOTES[pc];
  answerInput.focus();
}

function renderPiano() {
  if (!pianoEl) {
    return;
  }
  pianoEl.innerHTML = "";
  const whitesWrap = document.createElement("div");
  whitesWrap.className = "iq-piano-whites";

  for (const pc of WHITE_KEY_PITCHES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "iq-key iq-key--white";
    btn.textContent = DISPLAY_NOTES[pc];
    btn.addEventListener("click", () => applyPitchToAnswer(pc));
    whitesWrap.append(btn);
  }

  const blacksWrap = document.createElement("div");
  blacksWrap.className = "iq-piano-blacks";

  const seg = 100 / 7;
  const bw = seg * 0.52;

  for (const { pitchClass, afterWhiteIndex } of BLACK_KEYS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "iq-key iq-key--black";
    btn.textContent = DISPLAY_NOTES[pitchClass];
    btn.style.width = `${bw}%`;
    btn.style.left = `calc(${(afterWhiteIndex + 1) * seg}% - ${bw / 2}%)`;
    btn.addEventListener("click", () => applyPitchToAnswer(pitchClass));
    blacksWrap.append(btn);
  }

  pianoEl.append(whitesWrap, blacksWrap);
}

function refreshMidiStatusText() {
  if (!midiStatusEl) {
    return;
  }
  if (!navigator.requestMIDIAccess) {
    midiStatusEl.textContent = t("midiUnavailable");
    return;
  }
  if (midiConnected) {
    midiStatusEl.textContent = t("midiConnected");
    return;
  }
  midiStatusEl.textContent = t("midiIdle");
}

function bindMidiInput(port) {
  port.onmidimessage = (event) => {
    const data = event.data;
    if (!data || data.length < 3) {
      return;
    }
    const status = data[0];
    const note = data[1];
    const velocity = data[2];
    const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;
    if (isNoteOn) {
      applyPitchToAnswer(note);
    }
  };
}

function wireMidiInputs(access) {
  for (const input of access.inputs.values()) {
    bindMidiInput(input);
  }
}

function enableMidiKeyboard() {
  if (midiAccess) {
    refreshMidiStatusText();
    return;
  }

  if (!navigator.requestMIDIAccess) {
    if (midiStatusEl) {
      midiStatusEl.textContent = t("midiUnavailable");
    }
    return;
  }

  if (midiStatusEl) {
    midiStatusEl.textContent = t("midiBusy");
  }

  navigator.requestMIDIAccess({ sysex: false }).then(
    (access) => {
      midiAccess = access;
      midiConnected = true;
      wireMidiInputs(access);
      refreshMidiStatusText();
    },
    () => {
      midiConnected = false;
      if (midiStatusEl) {
        midiStatusEl.textContent = t("midiUnavailable");
      }
    },
  );
}

function updateLanguageButtons() {
  langEnBtn.classList.toggle("is-active", state.language === "en");
  langZhBtn.classList.toggle("is-active", state.language === "zh");
}

function selectionMatchesPreset(intervalIds) {
  return state.enabledIntervals.size === intervalIds.length && intervalIds.every((id) => state.enabledIntervals.has(id));
}

function renderPresetButtons() {
  for (const button of presetButtons) {
    const presetId = button.dataset.preset;
    const intervalIds = INTERVAL_PRESETS[presetId] || [];
    button.classList.toggle("is-active", selectionMatchesPreset(intervalIds));
  }
}

function applyIntervalPreset(presetId) {
  const preset = INTERVAL_PRESETS[presetId];
  if (!preset) {
    return;
  }

  state.enabledIntervals = new Set(preset);
  saveEnabledIntervals();
  renderPresetButtons();
  renderIntervalOptions();
  renderQuestion();
  updateStats();
}

function applyLanguage() {
  applyStaticCopy();
  updateLanguageButtons();
  renderPresetButtons();
  updateStats();
  renderReviewNotes();

  if (state.currentQuestion) {
    questionEl.textContent = t("questionTemplate", {
      target: state.currentQuestion.target,
      interval: state.currentQuestion.interval.label,
    });
  } else {
    questionEl.textContent = t("loading");
  }

  feedbackEl.textContent = state.lastFeedback.key ? t(state.lastFeedback.key, state.lastFeedback.values || {}) : "";
  if (!canUseSpeech()) {
    setVoiceStatus("voiceUnsupported");
  } else if (!state.voiceAuto) {
    setVoiceStatus("voiceOff");
  } else if (state.pendingSpeechReason) {
    setVoiceStatus("voiceNeedsTap");
  } else if (!activeUtterance) {
    setVoiceStatus("voiceReady");
  }
}

function setLanguage(language) {
  if (state.language === language) {
    return;
  }

  state.language = language;
  saveLanguage();
  applyLanguage();
}

function renderIntervalOptions() {
  intervalOptionsEl.innerHTML = "";

  for (const interval of INTERVALS) {
    const label = document.createElement("label");
    label.className = "option-chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.enabledIntervals.has(interval.id);
    input.addEventListener("change", () => {
      if (input.checked) {
        state.enabledIntervals.add(interval.id);
      } else if (state.enabledIntervals.size > 1) {
        state.enabledIntervals.delete(interval.id);
      } else {
        input.checked = true;
      }

      saveEnabledIntervals();
      renderPresetButtons();
      updateStats();
      renderQuestion();
    });

    const text = document.createElement("span");
    text.textContent = interval.label;

    label.append(input, text);
    intervalOptionsEl.append(label);
  }
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

function handleGlobalKeydown(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  const typing = isTypingTarget(event.target);

  if (event.key === "/" && !typing) {
    event.preventDefault();
    answerInput.focus();
    answerInput.select();
    return;
  }

  if (event.key === "Escape" && document.activeElement === answerInput) {
    event.preventDefault();
    answerInput.value = "";
    setFeedbackByKey("", "");
    return;
  }

  if ((event.key === "n" || event.key === "N") && !typing) {
    event.preventDefault();
    renderQuestion();
    return;
  }

  if ((event.key === "r" || event.key === "R") && !typing) {
    event.preventDefault();
    revealAnswer();
  }
}

answerForm.addEventListener("submit", submitAnswer);
nextBtn.addEventListener("click", renderQuestion);
revealBtn.addEventListener("click", revealAnswer);
clearNotesBtn.addEventListener("click", clearMistakeNotes);
langEnBtn.addEventListener("click", () => setLanguage("en"));
langZhBtn.addEventListener("click", () => setLanguage("zh"));
document.addEventListener("keydown", handleGlobalKeydown);

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    applyIntervalPreset(button.dataset.preset || "");
  });
}

if (midiEnableBtn) {
  midiEnableBtn.addEventListener("click", () => {
    enableMidiKeyboard();
  });
}

if (voiceAutoToggle) {
  voiceAutoToggle.checked = state.voiceAuto;
  voiceAutoToggle.addEventListener("change", () => {
    state.voiceAuto = voiceAutoToggle.checked;
    saveVoiceAuto();
    if (!state.voiceAuto) {
      stopSpeech();
      setVoiceStatus("voiceOff");
      return;
    }
    setVoiceStatus(voiceInitialized ? "voiceReady" : "voiceNeedsTap");
    maybeAutoSpeakQuestion();
  });
}

if (voiceRepeatBtn) {
  voiceRepeatBtn.addEventListener("click", () => {
    initializeVoice();
    speakCurrentQuestion(true);
  });
}

if (canUseSpeech()) {
  loadSpeechVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadSpeechVoices();
  };
  document.addEventListener(
    "click",
    () => {
      if (!voiceInitialized) {
        initializeVoice();
      }
    },
    { once: true },
  );
} else {
  setVoiceStatus("voiceUnsupported");
}

renderPiano();
renderIntervalOptions();
applyLanguage();
updateStats();
renderQuestion();
