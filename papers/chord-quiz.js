const QUESTIONS_PER_SET = 10;
const SLOW_RESPONSE_MS = 12000;

const LANGUAGE_STORAGE_KEY = "chord-quiz-language";
const MISTAKE_STORAGE_KEY = "chord-quiz-mistakes";
const ENABLED_CHORD_TYPES_KEY = "chord-quiz-enabled-chord-types";

const DEFAULT_FEEDBACK = { key: "", type: "", values: null };

const NATURAL_PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const DISPLAY_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const ROOT_POOL = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const CHORD_TYPES = [
  { id: "maj", intervals: [0, 4, 7] },
  { id: "min", intervals: [0, 3, 7] },
  { id: "dim", intervals: [0, 3, 6] },
  { id: "aug", intervals: [0, 4, 8] },
  { id: "maj7", intervals: [0, 4, 7, 11] },
  { id: "dom7", intervals: [0, 4, 7, 10] },
  { id: "min7", intervals: [0, 3, 7, 10] },
  { id: "m7b5", intervals: [0, 3, 6, 10] },
  { id: "dim7", intervals: [0, 3, 6, 9] },
  { id: "sus2", intervals: [0, 2, 7] },
  { id: "sus4", intervals: [0, 5, 7] },
];

const state = {
  currentQuestion: null,
  total: 0,
  correct: 0,
  round: 1,
  language: loadLanguage(),
  enabledChordTypes: loadEnabledChordTypes(),
  mistakeCounts: loadMistakeCounts(),
  questionStartedAt: Date.now(),
  reviewNotes: [],
  lastFeedback: { ...DEFAULT_FEEDBACK },
  midiReady: false,
};

const activeMidiKeys = new Map();

const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const checkBtn = document.getElementById("check-btn");
const revealBtn = document.getElementById("reveal-btn");
const clearNotesBtn = document.getElementById("clear-notes-btn");
const langEnBtn = document.getElementById("lang-en-btn");
const langZhBtn = document.getElementById("lang-zh-btn");
const totalCountEl = document.getElementById("total-count");
const correctCountEl = document.getElementById("correct-count");
const roundCountEl = document.getElementById("round-count");
const chordOptionsEl = document.getElementById("chord-options");
const mistakeNotesEl = document.getElementById("mistake-notes");
const pressedDisplayEl = document.getElementById("pressed-display");
const midiGateEl = document.getElementById("midi-gate");
const midiBtn = document.getElementById("midi-enable-btn");
const midiStatusEl = document.getElementById("midi-status");

const COPY = {
  en: {
    heroTitle: "Chord Quiz (MIDI)",
    heroSubtitle: "Hold the chord on a MIDI keyboard, then tap Check. No typing — MIDI only.",
    questionLabel: "Question",
    nextButton: "Next",
    checkButton: "Check",
    revealButton: "Show answer",
    pressedLabel: "Currently held (pitch classes)",
    pressedNone: "—",
    notesLabel: "Review",
    notesTitle: "Sticky notes",
    clearButton: "Clear",
    emptyNotes: "Wrong or slow answers will leave sticky notes here.",
    statsLabel: "Stats",
    progressTitle: "Progress",
    setProgressLabel: "Set progress",
    correctLabel: "Correct",
    roundLabel: "Round",
    chordLabel: "Chord types",
    chordTitle: "Question pool",
    loading: "Loading…",
    questionTemplate: "Play this chord: {chord}",
    needMidiFirst: "Connect a MIDI keyboard to start.",
    midiSectionTitle: "MIDI",
    midiHint: "Grading uses only notes from your MIDI controller — no typing or on-screen keyboard.",
    midiEnable: "Enable MIDI",
    midiIdle: "MIDI: off",
    midiBusy: "MIDI: connecting…",
    midiConnected: "MIDI: connected",
    midiUnavailable: "MIDI not supported in this browser.",
    emptyHeld: "Hold at least one note on MIDI, then tap Check.",
    revealNotes: "Expected notes: {notes}",
    correctFeedback: "Correct — {chord}.",
    wrongFeedback: "Wrong — target: {chord}. You held {held}; expected {expected}.",
    finishRound: "Round {round} complete: {correct} / {total}. Next round.",
    needOneChordType: "Keep at least one chord type enabled.",
    noteKindSlow: "Too slow",
    noteKindMistake: "Wrong",
    noteYourAnswer: "You played: {answer}",
    noteCorrectAnswer: "Target: {answer}",
    noteTime: "Time: {seconds} sec",
  },
  zh: {
    heroTitle: "和弦测验（MIDI）",
    heroSubtitle: "用 MIDI 键盘按住和弦，再点「检查」。不能打字，只能 MIDI。",
    questionLabel: "题目",
    nextButton: "换一题",
    checkButton: "检查",
    revealButton: "显示答案",
    pressedLabel: "当前按下的音（音高类）",
    pressedNone: "—",
    notesLabel: "错题",
    notesTitle: "贴纸板",
    clearButton: "清空",
    emptyNotes: "答错或想太久后会在这里留下小贴纸。",
    statsLabel: "统计",
    progressTitle: "进度",
    setProgressLabel: "本组进度",
    correctLabel: "答对",
    roundLabel: "组数",
    chordLabel: "和弦类型",
    chordTitle: "选题范围",
    loading: "加载中…",
    questionTemplate: "请演奏这个和弦：{chord}",
    needMidiFirst: "请先连接 MIDI 键盘再开始。",
    midiSectionTitle: "MIDI",
    midiHint: "判分只认 MIDI 键盘上的音，不能打字，也没有屏幕键盘答题。",
    midiEnable: "开启 MIDI",
    midiIdle: "MIDI：未连接",
    midiBusy: "MIDI：连接中…",
    midiConnected: "MIDI：已连接",
    midiUnavailable: "当前浏览器不支持 Web MIDI。",
    emptyHeld: "请先在 MIDI 上按住至少一个音，再点「检查」。",
    revealNotes: "应有的音：{notes}",
    correctFeedback: "对了 — {chord}。",
    wrongFeedback: "错了 — 目标：{chord}。你按的是 {held}；应有 {expected}。",
    finishRound: "第 {round} 组完成：{correct} / {total}。下一组开始。",
    needOneChordType: "至少保留一种和弦类型。",
    noteKindSlow: "想太久",
    noteKindMistake: "答错了",
    noteYourAnswer: "你弹的是: {answer}",
    noteCorrectAnswer: "目标: {answer}",
    noteTime: "用时: {seconds} 秒",
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

function loadEnabledChordTypes() {
  try {
    const raw = window.localStorage.getItem(ENABLED_CHORD_TYPES_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const allowed = new Set(CHORD_TYPES.map((c) => c.id));
      const clean = parsed.filter((id) => allowed.has(id));
      if (clean.length > 0) {
        return new Set(clean);
      }
    }
  } catch {
    // ignore
  }
  return new Set(CHORD_TYPES.map((c) => c.id));
}

function saveEnabledChordTypes() {
  window.localStorage.setItem(ENABLED_CHORD_TYPES_KEY, JSON.stringify(Array.from(state.enabledChordTypes)));
}

function getChordTypeById(id) {
  return CHORD_TYPES.find((c) => c.id === id) || CHORD_TYPES[0];
}

function buildChordLabel(rootLabel, chordType) {
  const id = chordType.id;
  if (state.language === "zh") {
    const map = {
      maj: `${rootLabel} 大三和弦`,
      min: `${rootLabel} 小三和弦`,
      dim: `${rootLabel} 减三和弦`,
      aug: `${rootLabel} 增三和弦`,
      maj7: `${rootLabel} 大七和弦`,
      dom7: `${rootLabel} 属七和弦`,
      min7: `${rootLabel} 小七和弦`,
      m7b5: `${rootLabel} 半减七和弦`,
      dim7: `${rootLabel} 减七和弦`,
      sus2: `${rootLabel} sus2`,
      sus4: `${rootLabel} sus4`,
    };
    return map[id] || rootLabel;
  }
  const mapEn = {
    maj: `${rootLabel} major triad`,
    min: `${rootLabel} minor triad`,
    dim: `${rootLabel} diminished triad`,
    aug: `${rootLabel} augmented triad`,
    maj7: `${rootLabel} major 7th`,
    dom7: `${rootLabel} dominant 7th`,
    min7: `${rootLabel} minor 7th`,
    m7b5: `${rootLabel} half-diminished 7th`,
    dim7: `${rootLabel} diminished 7th`,
    sus2: `${rootLabel} sus2`,
    sus4: `${rootLabel} sus4`,
  };
  return mapEn[id] || rootLabel;
}

function expectedPitchClasses(rootLabel, chordType) {
  const root = parseNote(rootLabel);
  if (!root) {
    return new Set();
  }
  return new Set(chordType.intervals.map((i) => (root.pitchClass + i) % 12));
}

function expectedNoteNames(rootLabel, chordType) {
  const pcs = chordType.intervals.map((i) => {
    const root = parseNote(rootLabel);
    return DISPLAY_NOTES[(root.pitchClass + i) % 12];
  });
  return pcs.join(" ");
}

function getQuestionKey(rootLabel, chordId) {
  return `${rootLabel}|${chordId}`;
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

function buildQuestion() {
  const availableTypes = CHORD_TYPES.filter((c) => state.enabledChordTypes.has(c.id));
  const candidates = [];
  for (const chordType of availableTypes) {
    for (const rootLabel of ROOT_POOL) {
      candidates.push({
        chordType,
        rootLabel,
        key: getQuestionKey(rootLabel, chordType.id),
      });
    }
  }
  const picked = weightedPick(candidates, (c) => {
    const boost = state.mistakeCounts[c.key] || 0;
    return 1 + boost * 2.2;
  });
  const display = buildChordLabel(picked.rootLabel, picked.chordType);
  const expected = expectedPitchClasses(picked.rootLabel, picked.chordType);
  return {
    chordType: picked.chordType,
    rootLabel: picked.rootLabel,
    display,
    expectedPcSet: expected,
    key: picked.key,
  };
}

function setsEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const x of a) {
    if (!b.has(x)) {
      return false;
    }
  }
  return true;
}

function getHeldPitchClassSet() {
  const pcs = new Set();
  for (const midiNote of activeMidiKeys.keys()) {
    pcs.add(((midiNote % 12) + 12) % 12);
  }
  return pcs;
}

function formatPcSet(pcs) {
  if (pcs.size === 0) {
    return t("pressedNone");
  }
  return [...pcs]
    .sort((a, b) => a - b)
    .map((pc) => DISPLAY_NOTES[pc])
    .join(" ");
}

function updatePressedDisplay() {
  if (!pressedDisplayEl) {
    return;
  }
  pressedDisplayEl.textContent = formatPcSet(getHeldPitchClassSet());
}

function updateMidiGate() {
  if (!midiGateEl) {
    return;
  }
  midiGateEl.hidden = state.midiReady;
}

function refreshMidiStatusText() {
  if (!midiStatusEl) {
    return;
  }
  if (!navigator.requestMIDIAccess) {
    midiStatusEl.textContent = t("midiUnavailable");
    return;
  }
  if (state.midiReady) {
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
    const high = status & 0xf0;
    if (high === 0x90 && velocity > 0) {
      activeMidiKeys.set(note, true);
    } else if (high === 0x80 || (high === 0x90 && velocity === 0)) {
      activeMidiKeys.delete(note);
    }
    updatePressedDisplay();
  };
}

function wireMidiInputs(access) {
  for (const input of access.inputs.values()) {
    bindMidiInput(input);
  }
}

function enableMidi() {
  if (state.midiReady) {
    refreshMidiStatusText();
    return;
  }
  if (!navigator.requestMIDIAccess) {
    refreshMidiStatusText();
    return;
  }
  if (midiStatusEl) {
    midiStatusEl.textContent = t("midiBusy");
  }
  navigator.requestMIDIAccess({ sysex: false }).then(
    (access) => {
      state.midiReady = true;
      wireMidiInputs(access);
      refreshMidiStatusText();
      updateMidiGate();
      renderQuestion();
    },
    () => {
      state.midiReady = false;
      refreshMidiStatusText();
    },
  );
}

function updateStats() {
  totalCountEl.textContent = `${state.total}/${QUESTIONS_PER_SET}`;
  correctCountEl.textContent = String(state.correct);
  roundCountEl.textContent = String(state.round);
}

function renderQuestion() {
  if (!state.midiReady) {
    questionEl.textContent = "";
    setFeedbackByKey("", "");
    updatePressedDisplay();
    return;
  }
  state.currentQuestion = buildQuestion();
  state.questionStartedAt = Date.now();
  questionEl.textContent = t("questionTemplate", { chord: state.currentQuestion.display });
  setFeedbackByKey("", "");
  updatePressedDisplay();
}

function addReviewNote({ kind, userAnswer, question, responseTime }) {
  state.reviewNotes.unshift({
    kind,
    userAnswer,
    chord: question.display,
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

function checkAnswer() {
  if (!state.midiReady) {
    return;
  }
  const responseTime = Date.now() - state.questionStartedAt;
  const held = getHeldPitchClassSet();
  if (held.size === 0) {
    setFeedbackByKey("emptyHeld", "error");
    return;
  }

  state.total += 1;
  const expected = state.currentQuestion.expectedPcSet;
  const ok = setsEqual(held, expected);

  if (ok) {
    state.correct += 1;
    if (responseTime > SLOW_RESPONSE_MS) {
      recordSlowResponse(state.currentQuestion);
      addReviewNote({
        kind: "slow",
        userAnswer: formatPcSet(held),
        question: state.currentQuestion,
        responseTime,
      });
    }
    setFeedbackByKey("correctFeedback", "success", { chord: state.currentQuestion.display });
  } else {
    recordMistake(state.currentQuestion);
    addReviewNote({
      kind: "mistake",
      userAnswer: formatPcSet(held),
      question: state.currentQuestion,
      responseTime,
    });
    setFeedbackByKey("wrongFeedback", "error", {
      chord: state.currentQuestion.display,
      held: formatPcSet(held),
      expected: [...expected]
        .sort((a, b) => a - b)
        .map((pc) => DISPLAY_NOTES[pc])
        .join(" "),
    });
  }

  updateStats();

  if (state.total >= QUESTIONS_PER_SET) {
    window.setTimeout(finishRound, 500);
    return;
  }

  window.setTimeout(renderQuestion, 220);
}

function revealAnswer() {
  if (!state.currentQuestion) {
    return;
  }
  const notes = expectedNoteNames(state.currentQuestion.rootLabel, state.currentQuestion.chordType);
  setFeedbackByKey("revealNotes", "success", { notes });
}

function renderReviewNotes() {
  mistakeNotesEl.innerHTML = "";
  if (state.reviewNotes.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-notes";
    p.textContent = t("emptyNotes");
    mistakeNotesEl.append(p);
    return;
  }
  for (const note of state.reviewNotes) {
    const art = document.createElement("article");
    art.className = `mistake-note ${note.kind === "slow" ? "slow-note" : ""}`.trim();
    const kind = document.createElement("p");
    kind.className = "note-kind";
    kind.textContent = note.kind === "slow" ? t("noteKindSlow") : t("noteKindMistake");
    const q = document.createElement("p");
    q.textContent = note.chord;
    const ya = document.createElement("p");
    ya.textContent = t("noteYourAnswer", { answer: note.userAnswer });
    const ca = document.createElement("p");
    ca.textContent = t("noteCorrectAnswer", { answer: note.chord });
    art.append(kind, q, ya, ca);
    if (note.kind === "slow") {
      const tl = document.createElement("p");
      tl.textContent = t("noteTime", { seconds: (note.responseTime / 1000).toFixed(1) });
      art.append(tl);
    }
    mistakeNotesEl.append(art);
  }
}

function applyStaticCopy() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.title = `${t("heroTitle")} · Zi Yin`;
  for (const element of document.querySelectorAll("[data-quiz]")) {
    const key = element.getAttribute("data-quiz");
    if (key) {
      element.textContent = t(key);
    }
  }
  refreshMidiStatusText();
}

function updateLanguageButtons() {
  langEnBtn.classList.toggle("is-active", state.language === "en");
  langZhBtn.classList.toggle("is-active", state.language === "zh");
}

function applyLanguage() {
  applyStaticCopy();
  updateLanguageButtons();
  updateStats();
  renderReviewNotes();
  if (state.midiReady && state.currentQuestion) {
    state.currentQuestion.display = buildChordLabel(state.currentQuestion.rootLabel, state.currentQuestion.chordType);
    questionEl.textContent = t("questionTemplate", { chord: state.currentQuestion.display });
  } else if (!state.midiReady) {
    questionEl.textContent = "";
  }
  feedbackEl.textContent = state.lastFeedback.key
    ? t(state.lastFeedback.key, state.lastFeedback.values || {})
    : "";
}

function setLanguage(language) {
  if (state.language === language) {
    return;
  }
  state.language = language;
  saveLanguage();
  applyLanguage();
}

function renderChordOptions() {
  chordOptionsEl.innerHTML = "";
  for (const chord of CHORD_TYPES) {
    const label = document.createElement("label");
    label.className = "option-chip";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.enabledChordTypes.has(chord.id);
    input.addEventListener("change", () => {
      if (input.checked) {
        state.enabledChordTypes.add(chord.id);
      } else if (state.enabledChordTypes.size > 1) {
        state.enabledChordTypes.delete(chord.id);
      } else {
        input.checked = true;
        setFeedbackByKey("needOneChordType", "error");
        return;
      }
      saveEnabledChordTypes();
      if (state.midiReady) {
        renderQuestion();
      }
    });
    const text = document.createElement("span");
    text.textContent = chord.id;
    label.append(input, text);
    chordOptionsEl.append(label);
  }
}

nextBtn.addEventListener("click", () => {
  if (state.midiReady) {
    renderQuestion();
  }
});
checkBtn.addEventListener("click", checkAnswer);
revealBtn.addEventListener("click", revealAnswer);
clearNotesBtn.addEventListener("click", clearMistakeNotes);
langEnBtn.addEventListener("click", () => setLanguage("en"));
langZhBtn.addEventListener("click", () => setLanguage("zh"));
if (midiBtn) {
  midiBtn.addEventListener("click", enableMidi);
}

renderChordOptions();
applyLanguage();
updateStats();
updateMidiGate();
renderReviewNotes();
renderQuestion();
updatePressedDisplay();
