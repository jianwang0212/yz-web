const QUESTIONS_PER_SET = 10;
const SLOW_RESPONSE_MS = 8000;

const LANGUAGE_STORAGE_KEY = "degree-quiz-language";
const MISTAKE_STORAGE_KEY = "degree-quiz-mistakes";
const KEYS_STORAGE_KEY = "degree-quiz-enabled-keys";
const DEGREE_SLOTS_STORAGE_KEY = "degree-quiz-enabled-degree-slots";

const ALL_ANSWER_LABELS = (() => {
  const out = [];
  for (let d = 1; d <= 7; d += 1) {
    out.push(`b${d}`, String(d), `#${d}`);
  }
  return out;
})();

const DEFAULT_FEEDBACK = { key: "", type: "", values: null };

const MAJOR_KEYS = [
  { id: "C", label: "C", scale: ["C", "D", "E", "F", "G", "A", "B"] },
  { id: "Db", label: "Db", scale: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"] },
  { id: "D", label: "D", scale: ["D", "E", "F#", "G", "A", "B", "C#"] },
  { id: "Eb", label: "Eb", scale: ["Eb", "F", "G", "Ab", "Bb", "C", "D"] },
  { id: "E", label: "E", scale: ["E", "F#", "G#", "A", "B", "C#", "D#"] },
  { id: "F", label: "F", scale: ["F", "G", "A", "Bb", "C", "D", "E"] },
  { id: "Gb", label: "Gb", scale: ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"] },
  { id: "G", label: "G", scale: ["G", "A", "B", "C", "D", "E", "F#"] },
  { id: "Ab", label: "Ab", scale: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"] },
  { id: "A", label: "A", scale: ["A", "B", "C#", "D", "E", "F#", "G#"] },
  { id: "Bb", label: "Bb", scale: ["Bb", "C", "D", "Eb", "F", "G", "A"] },
  { id: "B", label: "B", scale: ["B", "C#", "D#", "E", "F#", "G#", "A#"] },
];

const state = {
  currentQuestion: null,
  total: 0,
  correct: 0,
  round: 1,
  language: loadLanguage(),
  enabledKeys: loadEnabledKeys(),
  enabledDegreeSlots: loadEnabledDegreeSlots(),
  mistakeCounts: loadMistakeCounts(),
  questionStartedAt: Date.now(),
  reviewNotes: [],
  lastFeedback: { ...DEFAULT_FEEDBACK },
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
const roundCountEl = document.getElementById("round-count");
const keyOptionsEl = document.getElementById("key-options");
const degreeScopeOptionsEl = document.getElementById("degree-scope-options");
const mistakeNotesEl = document.getElementById("mistake-notes");

const COPY = {
  en: {
    heroTitle: "Key Signature Degree Quiz",
    heroSubtitle: "Examples: In C major, E is 3. In C major, Eb is b3.",
    questionLabel: "Question",
    nextButton: "Next",
    answerLabel: "Your Answer",
    answerPlaceholder: "Type 1–7, or b3 / #4",
    submitButton: "Submit",
    revealButton: "Show Answer",
    notesLabel: "Review",
    notesTitle: "Sticky Notes",
    clearButton: "Clear",
    emptyNotes: "Wrong or slow answers will leave sticky notes here.",
    statsLabel: "Stats",
    progressTitle: "Progress",
    setProgressLabel: "Set Progress",
    correctLabel: "Correct",
    roundLabel: "Round",
    keyLabel: "Keys",
    keyTitle: "12 Major Keys",
    keySelectAll: "Select all",
    keySelectNone: "Clear all",
    keyBulkHint: "“Clear all” keeps C only — at least one key must stay on.",
    degreeScopeLabel: "Degree types",
    degreeScopeTitle: "Question pool",
    degreeSelectAll: "Select all",
    degreeSelectNone: "Clear all",
    degreeBulkHint: "“Clear all” keeps natural 1 only — at least one type must stay on. Unchecked types won’t appear as answers.",
    loading: "Loading...",
    questionTemplate: "In the key of {key}, {note} is which degree?",
    noteKindSlow: "Too Slow",
    noteKindMistake: "Wrong",
    noteYourAnswer: "You wrote: {answer}",
    noteCorrectAnswer: "Correct answer: {answer}",
    noteTime: "Time: {seconds} sec",
    emptyInput: "Enter a degree (e.g. 3, b3, #4).",
    invalidInput: "Invalid. Use 1–7, or a single b or # before 1–7 (e.g. b3, #4).",
    correctFeedback: "Correct. {note} is degree {answer} in {key}.",
    wrongFeedback: "Wrong. {note} is degree {answer} in {key}.",
    revealFeedback: "Answer: {answer}.",
    finishRound: "Round {round} complete: {correct} / {total}. Starting next round.",
    needOneKey: "Keep at least one key enabled.",
    needOneDegreeSlot: "Keep at least one degree type enabled.",
  },
  zh: {
    heroTitle: "调号级数测试",
    heroSubtitle: "例：我们现在在 C 调，E 是几级？答案：3。我们现在在 C 调，Eb 是几级？答案：b3。",
    questionLabel: "题目",
    nextButton: "换一题",
    answerLabel: "你的答案",
    answerPlaceholder: "输入 1–7，或 b3 / #4",
    submitButton: "提交",
    revealButton: "显示答案",
    notesLabel: "错题",
    notesTitle: "贴纸板",
    clearButton: "清空",
    emptyNotes: "答错或想太久后会在这里留下小贴纸。",
    statsLabel: "统计",
    progressTitle: "进度",
    setProgressLabel: "本组进度",
    correctLabel: "答对",
    roundLabel: "组数",
    keyLabel: "调号",
    keyTitle: "12 个调",
    keySelectAll: "全选",
    keySelectNone: "全不选",
    keyBulkHint: "「全不选」会只保留 C 调（至少要留一个调）。",
    degreeScopeLabel: "级数范围",
    degreeScopeTitle: "选题",
    degreeSelectAll: "全选",
    degreeSelectNone: "全不选",
    degreeBulkHint: "「全不选」只保留自然 1 级（至少要留一种）。未勾选的级数类型不会作为题目答案出现。",
    loading: "加载中...",
    questionTemplate: "我们现在在 {key} 调，{note} 是几级？",
    noteKindSlow: "想太久",
    noteKindMistake: "答错了",
    noteYourAnswer: "你写的是: {answer}",
    noteCorrectAnswer: "正确答案: {answer}",
    noteTime: "用时: {seconds} 秒",
    emptyInput: "先输入级数（例如 3、b3、#4）。",
    invalidInput: "格式不对。请输入 1–7，或在 1–7 前只加一个 b 或 #（例如 b3、#4）。题目不会出现重升重降。",
    correctFeedback: "对。{key} 调里，{note} 是 {answer} 级。",
    wrongFeedback: "错。{key} 调里，{note} 是 {answer} 级。",
    revealFeedback: "答案是 {answer} 级。",
    finishRound: "第 {round} 组完成: {correct} / {total}。下一组开始。",
    needOneKey: "至少保留一个调号。",
    needOneDegreeSlot: "至少保留一种级数类型。",
  },
};

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

function normalizeAnswerInput(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/♭/g, "b")
    .replace(/♯/g, "#");
}

function normalizeDegreeInput(value) {
  const match = normalizeAnswerInput(value).match(/([1-7])/);
  return match ? match[1] : "";
}

function parseAnswer(value) {
  const normalized = normalizeAnswerInput(value);
  const match = normalized.match(/^([b#]?)([1-7])$/i);
  if (!match) {
    return null;
  }
  const acc = match[1].toLowerCase();
  const degree = Number.parseInt(match[2], 10);
  const semitoneOffset = acc === "b" ? -1 : acc === "#" ? 1 : 0;
  return { degree, semitoneOffset, label: `${acc}${degree}`.toLowerCase() };
}

function formatAnswerLabel({ degree, semitoneOffset }) {
  if (semitoneOffset === 0) {
    return String(degree);
  }
  const prefix = semitoneOffset < 0 ? "b".repeat(Math.abs(semitoneOffset)) : "#".repeat(semitoneOffset);
  return `${prefix}${degree}`;
}

const NATURAL_PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parseNote(noteName) {
  const normalized = normalizeAnswerInput(noteName);
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
    accidentalCount: accidentals.split("").reduce((sum, ch) => sum + (ch === "#" ? 1 : -1), 0),
  };
}

function pitchClassFromKeyDegree(key, degree, semitoneOffset) {
  const base = key.scale[degree - 1];
  const parsed = parseNote(base);
  if (!parsed) {
    return null;
  }
  return ((parsed.pitchClass + semitoneOffset) % 12 + 12) % 12;
}

function getAcceptedAnswerLabels(key, targetPitchClass) {
  const accepted = [];
  for (let degree = 1; degree <= 7; degree += 1) {
    for (const semitoneOffset of [-1, 0, 1]) {
      const pitch = pitchClassFromKeyDegree(key, degree, semitoneOffset);
      if (pitch === null) {
        continue;
      }
      if (pitch === targetPitchClass) {
        accepted.push(formatAnswerLabel({ degree, semitoneOffset }));
      }
    }
  }
  // stable display order: b -> natural -> #
  const score = (label) => (label.startsWith("b") ? -1 : label.startsWith("#") ? 1 : 0);
  accepted.sort((a, b) => score(a) - score(b) || a.length - b.length || a.localeCompare(b));
  return Array.from(new Set(accepted));
}

const DISPLAY_BY_PC_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const DISPLAY_BY_PC_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function keyPrefersFlats(key) {
  return !["D", "E", "G", "A", "B"].includes(key.id);
}

/**
 * Question note spelling: match how musicians write in that key.
 * - Flat-preference keys: never show sharps (e.g. Bb major → Eb, not D#).
 * - Sharp-preference keys: never show flats (e.g. D major → D#, not Eb).
 * - Still collapse bb / ## to a single-accidental name first.
 * - Flat keys: final spelling always uses the flat chromatic map (Cb→B, Fb→E, etc.).
 */
function finalizeFlatKeyNoteDisplay(noteStr, key) {
  if (!keyPrefersFlats(key)) {
    return noteStr;
  }
  const p = parseNote(noteStr);
  if (!p) {
    return noteStr;
  }
  return DISPLAY_BY_PC_FLAT[p.pitchClass];
}

function displayNoteForQuestion(rawNote, key) {
  let parsed = parseNote(rawNote);
  if (!parsed) {
    return rawNote;
  }

  let noteStr = rawNote;
  if (Math.abs(parsed.accidentalCount) > 1) {
    const table0 = keyPrefersFlats(key) ? DISPLAY_BY_PC_FLAT : DISPLAY_BY_PC_SHARP;
    noteStr = table0[parsed.pitchClass];
    parsed = parseNote(noteStr);
    if (!parsed) {
      return finalizeFlatKeyNoteDisplay(noteStr, key);
    }
  }

  const prefersFlats = keyPrefersFlats(key);
  if (prefersFlats && noteStr.includes("#")) {
    noteStr = DISPLAY_BY_PC_FLAT[parsed.pitchClass];
    parsed = parseNote(noteStr);
  } else if (!prefersFlats && noteStr.includes("b")) {
    noteStr = DISPLAY_BY_PC_SHARP[parsed.pitchClass];
    parsed = parseNote(noteStr);
  }

  return finalizeFlatKeyNoteDisplay(noteStr, key);
}

function alterNoteSpelling(noteName, semitoneOffset) {
  const parsed = parseNote(noteName);
  if (!parsed) {
    return noteName;
  }
  const next = parsed.accidentalCount + semitoneOffset;
  const clamped = Math.max(-2, Math.min(2, next));
  const acc = clamped === 0 ? "" : clamped > 0 ? "#".repeat(clamped) : "b".repeat(Math.abs(clamped));
  return `${parsed.letter}${acc}`;
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

function loadEnabledKeys() {
  try {
    const raw = window.localStorage.getItem(KEYS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const allowed = new Set(MAJOR_KEYS.map((k) => k.id));
      const clean = parsed.filter((id) => allowed.has(id));
      if (clean.length > 0) {
        return new Set(clean);
      }
    }
  } catch {
    // ignore
  }
  return new Set(MAJOR_KEYS.map((k) => k.id));
}

function saveEnabledKeys() {
  window.localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(Array.from(state.enabledKeys)));
}

function loadEnabledDegreeSlots() {
  try {
    const raw = window.localStorage.getItem(DEGREE_SLOTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const allowed = new Set(ALL_ANSWER_LABELS);
      const clean = parsed.filter((id) => allowed.has(id));
      if (clean.length > 0) {
        return new Set(clean);
      }
    }
  } catch {
    // ignore
  }
  return new Set(ALL_ANSWER_LABELS);
}

function saveEnabledDegreeSlots() {
  window.localStorage.setItem(DEGREE_SLOTS_STORAGE_KEY, JSON.stringify(Array.from(state.enabledDegreeSlots)));
}

function getQuestionKey(keyId, note) {
  return `${keyId}|${note}`;
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
  const availableKeys = MAJOR_KEYS.filter((k) => state.enabledKeys.has(k.id));
  const candidates = [];

  for (const key of availableKeys) {
    for (let degreeIndex = 0; degreeIndex < key.scale.length; degreeIndex += 1) {
      const baseNote = key.scale[degreeIndex];
      const degree = degreeIndex + 1;
      for (const semitoneOffset of [-1, 0, 1]) {
        const rawNote = alterNoteSpelling(baseNote, semitoneOffset);
        const note = displayNoteForQuestion(rawNote, key);
        const answerLabel = formatAnswerLabel({ degree, semitoneOffset });
        const notePitchClass = parseNote(note)?.pitchClass ?? null;
        candidates.push({
          key,
          note,
          degree,
          semitoneOffset,
          answerLabel,
          notePitchClass,
          weightKey: getQuestionKey(key.id, `${note}|${answerLabel}`),
        });
      }
    }
  }

  const filtered = candidates.filter((c) => state.enabledDegreeSlots.has(c.answerLabel));
  const pool = filtered.length > 0 ? filtered : candidates;

  const picked = weightedPick(pool, (candidate) => {
    const mistakeBoost = state.mistakeCounts[candidate.weightKey] || 0;
    return 1 + mistakeBoost * 2.2;
  });

  return {
    key: picked.key,
    note: picked.note,
    degree: picked.degree,
    semitoneOffset: picked.semitoneOffset,
    answerLabel: picked.answerLabel,
    notePitchClass: picked.notePitchClass,
    weightKey: picked.weightKey,
  };
}

function updateStats() {
  totalCountEl.textContent = `${state.total}/${QUESTIONS_PER_SET}`;
  correctCountEl.textContent = String(state.correct);
  roundCountEl.textContent = String(state.round);
}

function renderQuestion() {
  state.currentQuestion = buildQuestion();
  state.questionStartedAt = Date.now();
  questionEl.textContent = t("questionTemplate", {
    key: state.currentQuestion.key.label,
    note: state.currentQuestion.note,
  });
  answerInput.value = "";
  setFeedbackByKey("", "");
  answerInput.focus();
}

function addReviewNote({ kind, userAnswer, question, responseTime }) {
  const targetPc =
    typeof question.notePitchClass === "number"
      ? question.notePitchClass
      : parseNote(question.note)?.pitchClass ?? null;
  const correctDisplay =
    targetPc === null ? question.answerLabel : getAcceptedAnswerLabels(question.key, targetPc).join(" / ");
  state.reviewNotes.unshift({
    kind,
    userAnswer: normalizeAnswerInput(userAnswer),
    key: question.key.label,
    note: question.note,
    degree: correctDisplay,
    responseTime,
  });
  renderReviewNotes();
}

function clearMistakeNotes() {
  state.reviewNotes = [];
  renderReviewNotes();
}

function recordMistake(question) {
  state.mistakeCounts[question.weightKey] = (state.mistakeCounts[question.weightKey] || 0) + 1;
  saveMistakeCounts();
}

function recordSlowResponse(question) {
  state.mistakeCounts[question.weightKey] = (state.mistakeCounts[question.weightKey] || 0) + 0.7;
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

function parseDegree(userAnswer) {
  const parsed = parseAnswer(userAnswer);
  return parsed ? parsed : null;
}

function submitAnswer(event) {
  event.preventDefault();
  const rawAnswer = answerInput.value;
  const responseTime = Date.now() - state.questionStartedAt;

  if (!String(rawAnswer).trim()) {
    setFeedbackByKey("emptyInput", "error");
    return;
  }

  const parsed = parseDegree(rawAnswer);
  if (!parsed || parsed.degree < 1 || parsed.degree > 7 || Math.abs(parsed.semitoneOffset) > 1) {
    setFeedbackByKey("invalidInput", "error");
    return;
  }

  state.total += 1;

  const targetPitch =
    typeof state.currentQuestion.notePitchClass === "number"
      ? state.currentQuestion.notePitchClass
      : parseNote(state.currentQuestion.note)?.pitchClass ?? null;
  const userPitch = pitchClassFromKeyDegree(state.currentQuestion.key, parsed.degree, parsed.semitoneOffset);
  const isCorrect = targetPitch !== null && userPitch !== null && targetPitch === userPitch;
  const acceptedLabels = targetPitch === null ? [] : getAcceptedAnswerLabels(state.currentQuestion.key, targetPitch);
  const isEnharmonic =
    isCorrect && acceptedLabels.length > 0 && !acceptedLabels.includes(normalizeAnswerInput(rawAnswer).toLowerCase());

  if (isCorrect) {
    state.correct += 1;
    if (responseTime > SLOW_RESPONSE_MS) {
      recordSlowResponse(state.currentQuestion);
      addReviewNote({
        kind: "slow",
        userAnswer: rawAnswer,
        question: state.currentQuestion,
        responseTime,
      });
    }
    setFeedbackByKey("correctFeedback", "success", {
      key: state.currentQuestion.key.label,
      note: state.currentQuestion.note,
      answer: isEnharmonic ? normalizeAnswerInput(rawAnswer).toLowerCase() : state.currentQuestion.answerLabel,
    });
  } else {
    recordMistake(state.currentQuestion);
    addReviewNote({
      kind: "mistake",
      userAnswer: rawAnswer,
      question: state.currentQuestion,
      responseTime,
    });
    setFeedbackByKey("wrongFeedback", "error", {
      key: state.currentQuestion.key.label,
      note: state.currentQuestion.note,
      answer:
        targetPitch === null
          ? state.currentQuestion.answerLabel
          : getAcceptedAnswerLabels(state.currentQuestion.key, targetPitch).join(" / "),
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
  const targetPitch =
    typeof state.currentQuestion.notePitchClass === "number"
      ? state.currentQuestion.notePitchClass
      : parseNote(state.currentQuestion.note)?.pitchClass ?? null;
  const accepted =
    targetPitch === null ? [state.currentQuestion.answerLabel] : getAcceptedAnswerLabels(state.currentQuestion.key, targetPitch);
  setFeedbackByKey("revealFeedback", "success", { answer: accepted.join(" / ") });
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
      key: reviewNote.key,
      note: reviewNote.note,
    });

    const yourAnswerLine = document.createElement("p");
    yourAnswerLine.textContent = t("noteYourAnswer", { answer: reviewNote.userAnswer });

    const correctAnswerLine = document.createElement("p");
    correctAnswerLine.textContent = t("noteCorrectAnswer", { answer: reviewNote.degree });

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

  if (state.currentQuestion) {
    questionEl.textContent = t("questionTemplate", {
      key: state.currentQuestion.key.label,
      note: state.currentQuestion.note,
    });
  } else {
    questionEl.textContent = t("loading");
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

function selectAllKeys() {
  state.enabledKeys = new Set(MAJOR_KEYS.map((k) => k.id));
  saveEnabledKeys();
  renderKeyOptions();
  renderQuestion();
}

function clearKeysToCOnly() {
  state.enabledKeys = new Set(["C"]);
  saveEnabledKeys();
  renderKeyOptions();
  renderQuestion();
}

function selectAllDegreeSlots() {
  state.enabledDegreeSlots = new Set(ALL_ANSWER_LABELS);
  saveEnabledDegreeSlots();
  renderDegreeScopeOptions();
  renderQuestion();
}

function clearDegreeSlotsToNaturalOneOnly() {
  state.enabledDegreeSlots = new Set(["1"]);
  saveEnabledDegreeSlots();
  renderDegreeScopeOptions();
  renderQuestion();
}

function renderKeyOptions() {
  keyOptionsEl.innerHTML = "";

  for (const key of MAJOR_KEYS) {
    const label = document.createElement("label");
    label.className = "option-chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.enabledKeys.has(key.id);
    input.addEventListener("change", () => {
      if (input.checked) {
        state.enabledKeys.add(key.id);
      } else if (state.enabledKeys.size > 1) {
        state.enabledKeys.delete(key.id);
      } else {
        input.checked = true;
        setFeedbackByKey("needOneKey", "error");
        return;
      }

      saveEnabledKeys();
      renderQuestion();
    });

    const text = document.createElement("span");
    text.textContent = key.label;

    label.append(input, text);
    keyOptionsEl.append(label);
  }
}

function renderDegreeScopeOptions() {
  if (!degreeScopeOptionsEl) {
    return;
  }
  degreeScopeOptionsEl.innerHTML = "";

  for (const label of ALL_ANSWER_LABELS) {
    const chip = document.createElement("label");
    chip.className = "option-chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.enabledDegreeSlots.has(label);
    input.addEventListener("change", () => {
      if (input.checked) {
        state.enabledDegreeSlots.add(label);
      } else if (state.enabledDegreeSlots.size > 1) {
        state.enabledDegreeSlots.delete(label);
      } else {
        input.checked = true;
        setFeedbackByKey("needOneDegreeSlot", "error");
        return;
      }

      saveEnabledDegreeSlots();
      renderQuestion();
    });

    const text = document.createElement("span");
    text.textContent = label;

    chip.append(input, text);
    degreeScopeOptionsEl.append(chip);
  }
}

answerForm.addEventListener("submit", submitAnswer);
nextBtn.addEventListener("click", renderQuestion);
revealBtn.addEventListener("click", revealAnswer);
clearNotesBtn.addEventListener("click", clearMistakeNotes);
langEnBtn.addEventListener("click", () => setLanguage("en"));
langZhBtn.addEventListener("click", () => setLanguage("zh"));

const keySelectAllBtn = document.getElementById("key-select-all");
const keySelectNoneBtn = document.getElementById("key-select-none");
if (keySelectAllBtn) {
  keySelectAllBtn.addEventListener("click", selectAllKeys);
}
if (keySelectNoneBtn) {
  keySelectNoneBtn.addEventListener("click", clearKeysToCOnly);
}

const degreeSelectAllBtn = document.getElementById("degree-select-all");
const degreeSelectNoneBtn = document.getElementById("degree-select-none");
if (degreeSelectAllBtn) {
  degreeSelectAllBtn.addEventListener("click", selectAllDegreeSlots);
}
if (degreeSelectNoneBtn) {
  degreeSelectNoneBtn.addEventListener("click", clearDegreeSlotsToNaturalOneOnly);
}

renderKeyOptions();
renderDegreeScopeOptions();
applyLanguage();
updateStats();
renderQuestion();

