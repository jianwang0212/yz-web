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
const DEFAULT_FEEDBACK = { key: "", type: "", values: null };

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

const state = {
  currentQuestion: null,
  total: 0,
  correct: 0,
  round: 1,
  language: loadLanguage(),
  enabledIntervals: new Set(INTERVALS.map((interval) => interval.id)),
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
const accuracyCountEl = document.getElementById("accuracy-count");
const intervalOptionsEl = document.getElementById("interval-options");
const mistakeNotesEl = document.getElementById("mistake-notes");

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
    notesLabel: "Review",
    notesTitle: "Sticky Notes",
    clearButton: "Clear",
    emptyNotes: "Wrong or slow answers will leave sticky notes here.",
    statsLabel: "Stats",
    progressTitle: "Progress",
    setProgressLabel: "Set Progress",
    correctLabel: "Correct",
    roundLabel: "Round",
    intervalLabel: "Intervals",
    intervalTitle: "Interval Types",
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
    notesLabel: "错题",
    notesTitle: "贴纸板",
    clearButton: "清空",
    emptyNotes: "答错后会在这里留下小贴纸。",
    statsLabel: "统计",
    progressTitle: "进度",
    setProgressLabel: "本组进度",
    correctLabel: "答对",
    roundLabel: "组数",
    intervalLabel: "题型",
    intervalTitle: "扩展音程",
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
  return stored === "zh" ? "zh" : "en";
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

function toDisplayNote(noteName) {
  const pitchClass = getPitchClass(noteName);
  return pitchClass === null ? null : DISPLAY_NOTES[pitchClass];
}

function getDisplayedTarget(rootName, interval) {
  const root = parseNote(rootName);

  if (!root) {
    return null;
  }

  return DISPLAY_NOTES[(root.pitchClass + interval.semitones) % 12];
}

function getQuestionKey(answer, interval) {
  return `${answer}|${interval.id}`;
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
  const availableIntervals = INTERVALS.filter((interval) => state.enabledIntervals.has(interval.id));
  const candidates = [];

  for (const interval of availableIntervals) {
    for (const answer of ROOT_POOL) {
      candidates.push({
        interval,
        answer,
        key: getQuestionKey(answer, interval),
      });
    }
  }

  const picked = weightedPick(candidates, (candidate) => {
    const mistakeBoost = state.mistakeCounts[candidate.key] || 0;
    return getIntervalWeight(candidate.interval) + mistakeBoost * 2.2;
  });
  const target = getDisplayedTarget(picked.answer, picked.interval);

  return {
    interval: picked.interval,
    answer: picked.answer,
    target,
    key: picked.key,
  };
}

function updateStats() {
  totalCountEl.textContent = `${state.total}/${QUESTIONS_PER_SET}`;
  correctCountEl.textContent = String(state.correct);
  accuracyCountEl.textContent = `${state.round}`;
}

function renderQuestion() {
  state.currentQuestion = buildQuestion();
  state.questionStartedAt = Date.now();
  questionEl.textContent = t("questionTemplate", {
    target: state.currentQuestion.target,
    interval: state.currentQuestion.interval.label,
  });
  answerInput.value = "";
  setFeedbackByKey("", "");
  answerInput.focus();
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

  if (!rawAnswer.trim()) {
    setFeedbackByKey("emptyInput", "error");
    return;
  }

  if (!parseNote(rawAnswer)) {
    setFeedbackByKey("invalidInput", "error");
    return;
  }

  state.total += 1;

  if (isCorrectAnswer(rawAnswer, state.currentQuestion)) {
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
      target: state.currentQuestion.target,
      answer: state.currentQuestion.answer,
      interval: state.currentQuestion.interval.label,
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
      target: state.currentQuestion.target,
      answer: state.currentQuestion.answer,
      interval: state.currentQuestion.interval.label,
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
      target: state.currentQuestion.target,
      interval: state.currentQuestion.interval.label,
    });
  } else {
    questionEl.textContent = t("loading");
  }

  feedbackEl.textContent = state.lastFeedback.key ? t(state.lastFeedback.key, state.lastFeedback.values || {}) : "";
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

      renderQuestion();
    });

    const text = document.createElement("span");
    text.textContent = interval.label;

    label.append(input, text);
    intervalOptionsEl.append(label);
  }
}

answerForm.addEventListener("submit", submitAnswer);
nextBtn.addEventListener("click", renderQuestion);
revealBtn.addEventListener("click", revealAnswer);
clearNotesBtn.addEventListener("click", clearMistakeNotes);
langEnBtn.addEventListener("click", () => setLanguage("en"));
langZhBtn.addEventListener("click", () => setLanguage("zh"));

renderIntervalOptions();
applyLanguage();
updateStats();
renderQuestion();
