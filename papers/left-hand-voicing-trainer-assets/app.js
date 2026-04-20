const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const SPOKEN_ROOTS = ["C", "C sharp", "D", "E flat", "E", "F", "F sharp", "G", "A flat", "A.", "B flat", "B"];
const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);

const CHORD_TYPES = [
  { id: "quality-maj7", suffix: "major seventh", symbol: "maj7", third: 4, seventh: 11 },
  { id: "quality-min7", suffix: "minor seventh", symbol: "m7", third: 3, seventh: 10 },
  { id: "quality-dom7", suffix: "dominant seventh", symbol: "7", third: 4, seventh: 10 },
  { id: "quality-dom7sus4", suffix: "dominant seven sus four", symbol: "7sus4", third: 5, seventh: 10 },
  { id: "quality-dim7", suffix: "diminished seventh", symbol: "dim7", third: 3, seventh: 9 },
  { id: "quality-halfdim7", suffix: "half diminished seventh", symbol: "m7b5", third: 3, seventh: 10 }
];

const VOICING_RULES = [
  { minBassMidi: 28, label: "E1+", degrees: ["1", "5", "1+"] },
  { minBassMidi: 33, label: "A1+", degrees: ["1", "5", "3"] },
  { minBassMidi: 34, label: "Bb1+", degrees: ["1", "5", "9"] },
  { minBassMidi: 35, label: "B1+", degrees: ["1", "5", "9", "3"] },
  { minBassMidi: 38, label: "D2+", degrees: ["1", "5", "7"] }
];

const DOMINANT_VOICING_RULES = [
  { minBassMidi: 36, label: "C2+", degreeSets: [["1", "b7", "3"], ["1", "b7"]] },
  { minBassMidi: 38, label: "D2+", degreeSets: [["1", "5", "b7"]] },
  { minBassMidi: 44, label: "Ab2+", degreeSets: [["1", "3", "b7"]] }
];

const DOMINANT_SUS_VOICING_RULES = [
  { minBassMidi: 38, label: "D2+", degreeSets: [["1", "b7"]] }
];

const DIMINISHED_SEVENTH_VOICING_RULES = [
  { minBassMidi: 38, label: "D2+", degreeSets: [["1", "6"]] }
];

const HALF_DIMINISHED_VOICING_RULES = [
  { minBassMidi: 36, label: "C2+", degreeSets: [["1", "b7"]] }
];

const state = {
  midiAccess: null,
  currentPrompt: null,
  heldNotes: new Set(),
  totalRounds: 0,
  correct: 0,
  incorrect: 0,
  hasAnsweredCurrent: false,
  stableTimerId: null,
  lastAttemptSignature: null,
  repeatQueue: [],
  currentRoundStartedAt: 0,
  roundRepeatScheduled: false,
  lastAttemptNotes: [],
  hasUserInteracted: false,
  pendingAutoSpeak: false
};

const elements = {
  connectMidi: document.querySelector("#connect-midi"),
  midiStatus: document.querySelector("#midi-status"),
  voiceStatus: document.querySelector("#voice-status"),
  pressedNotes: document.querySelector("#pressed-notes"),
  keyboard: document.querySelector("#keyboard"),
  progressText: document.querySelector("#progress-text"),
  progressBar: document.querySelector("#progress-bar"),
  correctCount: document.querySelector("#correct-count"),
  incorrectCount: document.querySelector("#incorrect-count"),
  reviewCount: document.querySelector("#review-count"),
  newChord: document.querySelector("#new-chord"),
  repeatChord: document.querySelector("#repeat-chord"),
  showChord: document.querySelector("#show-chord"),
  resetScore: document.querySelector("#reset-score"),
  autoSpeak: document.querySelector("#auto-speak"),
  qualityMaj7: document.querySelector("#quality-maj7"),
  qualityMin7: document.querySelector("#quality-min7"),
  qualityDom7: document.querySelector("#quality-dom7"),
  qualityDom7sus4: document.querySelector("#quality-dom7sus4"),
  qualityDim7: document.querySelector("#quality-dim7"),
  qualityHalfdim7: document.querySelector("#quality-halfdim7"),
  targetChord: document.querySelector("#target-chord"),
  liveNotesText: document.querySelector("#live-notes-text"),
  resultText: document.querySelector("#result-text"),
  selectionText: document.querySelector("#selection-text"),
  answerText: document.querySelector("#answer-text")
};

const qualityInputs = [
  elements.qualityMaj7,
  elements.qualityMin7,
  elements.qualityDom7,
  elements.qualityDom7sus4,
  elements.qualityDim7,
  elements.qualityHalfdim7
].filter(Boolean);

function init() {
  try {
    assertRequiredElements();
    buildKeyboard();
    bindEvents();
    updateScoreboard();
    updateSelectionSummary();
    updatePressedNotes();
    window.setTimeout(startNewRound, 0);
  } catch (error) {
    console.error(error);
    elements.targetChord.textContent = "初始化失败";
    setResult("页面初始化出了点问题，请刷新页面再试。", "error");
  }
}

function assertRequiredElements() {
  const required = [
    ["connectMidi", elements.connectMidi],
    ["newChord", elements.newChord],
    ["repeatChord", elements.repeatChord],
    ["showChord", elements.showChord],
    ["resetScore", elements.resetScore],
    ["targetChord", elements.targetChord],
    ["resultText", elements.resultText],
    ["keyboard", elements.keyboard]
  ];
  const missing = required.filter(([, element]) => !element).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing required elements: ${missing.join(", ")}`);
  }
}

function bindEvents() {
  const markInteracted = () => {
    const shouldReplayPendingPrompt = !state.hasUserInteracted && state.pendingAutoSpeak && Boolean(state.currentPrompt);
    state.hasUserInteracted = true;
    if (shouldReplayPendingPrompt) {
      state.pendingAutoSpeak = false;
      window.setTimeout(() => speakCurrentPrompt(false), 0);
    }
  };

  window.addEventListener("pointerdown", markInteracted, { passive: true });
  window.addEventListener("keydown", markInteracted);
  elements.connectMidi.addEventListener("click", connectMidi);
  elements.newChord.addEventListener("click", startNewRound);
  elements.repeatChord.addEventListener("click", () => speakCurrentPrompt(true));
  elements.showChord.addEventListener("click", revealAnswer);
  elements.resetScore.addEventListener("click", resetScore);
  qualityInputs.forEach(input => {
    input.addEventListener("change", () => {
      ensureAtLeastOneQuality();
      updateSelectionSummary();
      startNewRound();
    });
  });

  if (!("speechSynthesis" in window)) {
    elements.voiceStatus.textContent = "语音不可用";
  }
}

function buildKeyboard() {
  const inner = document.createElement("div");
  inner.className = "keyboard-inner";
  let whiteIndex = 0;

  for (let midi = 24; midi <= 84; midi += 1) {
    const pitchClass = midi % 12;
    const isWhite = WHITE_PITCH_CLASSES.has(pitchClass);

    if (isWhite) {
      const key = document.createElement("button");
      key.type = "button";
      key.className = "white-key";
      key.dataset.midi = String(midi);
      key.title = midiToName(midi);
      key.style.left = `${whiteIndex * 42}px`;
      inner.appendChild(key);
      whiteIndex += 1;
    } else {
      const key = document.createElement("button");
      key.type = "button";
      key.className = "black-key";
      key.dataset.midi = String(midi);
      key.title = midiToName(midi);
      key.style.left = `${whiteIndex * 42 - 13}px`;
      inner.appendChild(key);
    }
  }

  elements.keyboard.appendChild(inner);
}

async function connectMidi() {
  if (!navigator.requestMIDIAccess) {
    elements.midiStatus.textContent = "浏览器不支持 Web MIDI";
    setResult("这个浏览器不支持 Web MIDI，建议用 Chrome 或 Edge。", "error");
    return;
  }

  try {
    state.midiAccess = await navigator.requestMIDIAccess();
    attachMidiListeners();
    const inputNames = [...state.midiAccess.inputs.values()].map(input => input.name).filter(Boolean);
    elements.midiStatus.textContent = inputNames.length ? inputNames.join(", ") : "已连接";
    setResult("MIDI 已连接，现在可以开始训练。", "neutral");
  } catch (error) {
    console.error(error);
    elements.midiStatus.textContent = "权限被拒绝";
    setResult("浏览器没有拿到 MIDI 权限。", "error");
  }
}

function attachMidiListeners() {
  if (!state.midiAccess) {
    return;
  }

  for (const input of state.midiAccess.inputs.values()) {
    input.onmidimessage = handleMidiMessage;
  }

  state.midiAccess.onstatechange = () => {
    for (const input of state.midiAccess.inputs.values()) {
      input.onmidimessage = handleMidiMessage;
    }
  };
}

function handleMidiMessage(event) {
  const [status, note, velocity] = event.data;
  const command = status & 0xf0;

  if (command === 0x90 && velocity > 0) {
    state.heldNotes.add(note);
  } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
    state.heldNotes.delete(note);
  } else {
    return;
  }

  updateKeyboardHighlights();
  updatePressedNotes();

  if (state.heldNotes.size > 0) {
    state.lastAttemptNotes = [...state.heldNotes].sort((a, b) => a - b);
  }

  if (state.heldNotes.size === 0 && state.currentPrompt && !state.hasAnsweredCurrent) {
    state.lastAttemptSignature = null;
    setResult("请再试一次。", "neutral");
  }

  scheduleEvaluation();
}

function scheduleEvaluation() {
  window.clearTimeout(state.stableTimerId);

  if (!state.currentPrompt || state.heldNotes.size === 0 || state.hasAnsweredCurrent) {
    return;
  }

  state.stableTimerId = window.setTimeout(evaluateHeldNotes, 180);
}

function evaluateHeldNotes() {
  if (!state.currentPrompt || state.hasAnsweredCurrent) {
    return;
  }

  const played = [...state.heldNotes].sort((a, b) => a - b);
  state.lastAttemptNotes = [...played];
  const evaluation = evaluateVoicingAttempt(state.currentPrompt, played);

  if (evaluation.matches) {
    const elapsedMs = Date.now() - state.currentRoundStartedAt;
    if (elapsedMs > 5000 && !state.roundRepeatScheduled) {
      queuePromptForReview(state.currentPrompt);
      state.roundRepeatScheduled = true;
    }

    state.correct += 1;
    state.totalRounds += 1;
    state.hasAnsweredCurrent = true;
    state.lastAttemptSignature = null;
    updateScoreboard();
    updateSelectionSummary();
    setResult(
      elapsedMs > 5000
        ? `答对了: ${state.currentPrompt.label}，但超过 5 秒，已加入复习。`
        : `答对了: ${state.currentPrompt.label}`,
      "success"
    );
    elements.answerText.textContent = `你弹的是 ${formatPlayedNotes(played)}。匹配规则 ${evaluation.rule.label}: ${evaluation.degreeLabel}。`;
    window.setTimeout(startNewRound, 900);
    return;
  }

  if (played.length >= 3) {
    const attemptSignature = played.join("-");
    if (attemptSignature !== state.lastAttemptSignature) {
      state.incorrect += 1;
      state.lastAttemptSignature = attemptSignature;
      if (!state.roundRepeatScheduled) {
        queuePromptForReview(state.currentPrompt);
        state.roundRepeatScheduled = true;
      }
      updateScoreboard();
      updateSelectionSummary();
    }

    setResult(`还不对，继续试这题。这个 voicing 已加入复习。`, "error");
    elements.answerText.textContent = evaluation.message;
  }
}

function evaluateVoicingAttempt(prompt, played) {
  const bass = played[0];
  const bassPitchClass = bass % 12;
  if (bassPitchClass !== prompt.root) {
    return {
      matches: false,
      message: `你弹的是 ${formatPlayedNotes(played)}。最低音需要是 ${NOTE_NAMES[prompt.root]}，但你现在最低音是 ${midiToName(bass)}。`
    };
  }

  const rule = getRuleForBass(bass);
  const candidates = buildExpectedVoicings(prompt, bass, rule);
  const matchedCandidate = candidates.find(candidate => arraysEqual(played, candidate.notes));
  const matches = Boolean(matchedCandidate);
  const degreeLabel = formatRuleDegrees(rule, prompt.type);
  const answerLabel = candidates.map(candidate => `${candidate.degreeLabel}: ${formatPlayedNotes(candidate.notes)}`).join(" 或 ");

  return {
    matches,
    rule,
    degreeLabel,
    message: matches
      ? ""
      : `你弹的是 ${formatPlayedNotes(played)}。当前最低音 ${midiToName(bass)} 对应规则 ${rule.label}: ${degreeLabel}。正确答案可以是 ${answerLabel}。`
  };
}

function getRuleForBass(bassMidi) {
  const activeRules = getRulesForType(state.currentPrompt?.type);
  let activeRule = activeRules[0];
  for (const rule of activeRules) {
    if (bassMidi >= rule.minBassMidi) {
      activeRule = rule;
    }
  }
  return activeRule;
}

function buildExpectedVoicings(prompt, bassMidi, rule) {
  const isDominant = prompt.type.symbol === "7";
  const degreeMap = {
    "1": 0,
    "1+": 12,
    "3": isDominant ? prompt.type.third : prompt.type.third + 12,
    "b3": isDominant ? 3 : 15,
    "5": 7,
    "4": 5,
    "6": 9,
    "7": prompt.type.seventh,
    "b7": 10,
    "9": 14
  };

  const degreeSets = rule.degreeSets || [rule.degrees];

  return degreeSets.map(degrees => {
    const notes = [];
    for (const degree of degrees) {
      let note = bassMidi + degreeMap[degree];
      while (notes.length > 0 && note <= notes[notes.length - 1]) {
        note += 12;
      }
      notes.push(note);
    }
    const degreeLabel = degrees
      .map(degree => displayDegree(degree, prompt.type))
      .join(" - ");

    return { notes, degreeLabel };
  });
}

function formatRuleDegrees(rule, type) {
  const degreeSets = rule.degreeSets || [rule.degrees];
  return degreeSets
    .map(degrees => degrees.map(degree => displayDegree(degree, type)).join(" - "))
    .join(" 或 ");
}

function getRulesForType(type) {
  switch (type?.symbol) {
    case "7":
      return DOMINANT_VOICING_RULES;
    case "7sus4":
      return DOMINANT_SUS_VOICING_RULES;
    case "dim7":
      return DIMINISHED_SEVENTH_VOICING_RULES;
    case "m7b5":
      return HALF_DIMINISHED_VOICING_RULES;
    default:
      return VOICING_RULES;
  }
}

function displayDegree(degree, type) {
  if (degree === "6") {
    return "6";
  }
  if (degree === "4") {
    return "4";
  }
  if (degree === "3") {
    return type.third === 3 ? "b3" : "3";
  }
  if (degree === "7") {
    return type.seventh === 10 ? "b7" : "7";
  }
  if (degree === "1+") {
    return "1";
  }
  return degree;
}

function startNewRound() {
  ensureAtLeastOneQuality();
  const pool = buildPromptPool();
  if (pool.length === 0) {
    setResult("请至少勾选一种练习类型。", "error");
    return;
  }

  state.currentPrompt = state.repeatQueue.length > 0 ? state.repeatQueue.shift() : pool[Math.floor(Math.random() * pool.length)];
  state.hasAnsweredCurrent = false;
  state.lastAttemptSignature = null;
  state.currentRoundStartedAt = Date.now();
  state.roundRepeatScheduled = false;
  state.lastAttemptNotes = [];
  state.heldNotes.clear();
  updateKeyboardHighlights();
  updatePressedNotes();
  updateSelectionSummary();
  elements.targetChord.textContent = state.currentPrompt.label;
  elements.answerText.textContent = "";
  setResult("请按最低音所在区间，弹出正确的左手 voicing。", "neutral");

  if (elements.autoSpeak.checked) {
    speakCurrentPrompt(false);
  } else {
    state.pendingAutoSpeak = false;
  }
}

function buildPromptPool() {
  const selectedTypes = getSelectedChordTypes();

  return NOTE_NAMES.flatMap((_, root) =>
    selectedTypes.map(type => ({
      root,
      type,
      label: `${NOTE_NAMES[root]}${type.symbol}`,
      spokenLabel: `${SPOKEN_ROOTS[root]} ${type.suffix}`
    }))
  );
}

function getSelectedChordTypes() {
  return CHORD_TYPES.filter(type => {
    const input = document.querySelector(`#${type.id}`);
    return input && input.checked;
  });
}

function loadSpeechVoices() {
  if (!("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    return Promise.resolve(voices);
  }

  return new Promise(resolve => {
    let settled = false;
    const finish = nextVoices => {
      if (settled) {
        return;
      }
      settled = true;
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(nextVoices);
    };
    const handleVoicesChanged = () => finish(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    window.setTimeout(() => finish(window.speechSynthesis.getVoices()), 1200);
  });
}

function pickPreferredVoice(voices) {
  const englishVoices = voices.filter(voice => voice.lang?.toLowerCase().startsWith("en"));
  return (
    englishVoices.find(voice => voice.default) ||
    englishVoices.find(voice => /samantha|alex|daniel|victoria|karen/i.test(voice.name || "")) ||
    englishVoices[0] ||
    voices[0] ||
    null
  );
}

async function speakCurrentPrompt(force) {
  if (!state.currentPrompt) {
    if (force) {
      setResult("请先开始一轮，再播报题目。", "neutral");
    }
    return;
  }

  if (!("speechSynthesis" in window)) {
    elements.voiceStatus.textContent = "语音不可用";
    return;
  }

  if (!force && !state.hasUserInteracted) {
    state.pendingAutoSpeak = true;
    elements.voiceStatus.textContent = "点一下页面启用";
    return;
  }

  state.pendingAutoSpeak = false;
  const synth = window.speechSynthesis;
  const voices = await loadSpeechVoices();
  const preferredVoice = pickPreferredVoice(voices);

  synth.cancel();
  synth.resume();

  const utterance = new SpeechSynthesisUtterance(state.currentPrompt.spokenLabel);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.lang = "en-US";
  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang || "en-US";
  }
  let started = false;
  utterance.onstart = () => {
    started = true;
    elements.voiceStatus.textContent = preferredVoice ? `播报中 ${preferredVoice.name}` : "播报中";
  };
  utterance.onend = () => {
    elements.voiceStatus.textContent = started ? "已播报" : "语音未启动";
  };
  utterance.onerror = event => {
    if (event.error === "interrupted" || event.error === "canceled") {
      elements.voiceStatus.textContent = "已就绪";
      return;
    }
    if (event.error === "not-allowed") {
      elements.voiceStatus.textContent = "点一下页面启用";
      return;
    }
    elements.voiceStatus.textContent = `语音错误 ${event.error}`;
  };
  synth.speak(utterance);
}

function revealAnswer() {
  if (!state.currentPrompt) {
    return;
  }

  const examples = [
    ...buildExpectedVoicings(state.currentPrompt, midiForRootNear(36, state.currentPrompt.root), getRuleForBass(midiForRootNear(36, state.currentPrompt.root))),
    ...buildExpectedVoicings(state.currentPrompt, midiForRootNear(48, state.currentPrompt.root), getRuleForBass(midiForRootNear(48, state.currentPrompt.root)))
  ];

  const uniqueExamples = [];
  const seen = new Set();
  for (const example of examples) {
    const key = example.notes.join("-");
    if (!seen.has(key)) {
      seen.add(key);
      uniqueExamples.push(example);
    }
  }

  elements.answerText.textContent = uniqueExamples
    .map(example => `${example.degreeLabel}: ${formatPlayedNotes(example.notes)}`)
    .join(" | ");
}

function midiForRootNear(baseMidi, rootPitchClass) {
  let midi = baseMidi;
  while (midi % 12 !== rootPitchClass) {
    midi += 1;
  }
  return midi;
}

function resetScore() {
  state.totalRounds = 0;
  state.correct = 0;
  state.incorrect = 0;
  state.hasAnsweredCurrent = false;
  state.lastAttemptSignature = null;
  state.repeatQueue = [];
  state.currentPrompt = null;
  state.lastAttemptNotes = [];
  state.heldNotes.clear();
  updateKeyboardHighlights();
  updatePressedNotes();
  updateScoreboard();
  updateSelectionSummary();
  elements.targetChord.textContent = "加载中...";
  elements.answerText.textContent = "";
  setResult("统计已重置。", "neutral");
  startNewRound();
}

function queuePromptForReview(prompt) {
  state.repeatQueue.push({ ...prompt, type: { ...prompt.type } });
}

function ensureAtLeastOneQuality() {
  if (!qualityInputs.some(input => input.checked)) {
    elements.qualityMaj7.checked = true;
  }
}

function updateSelectionSummary() {
  const labels = getSelectedChordTypes().map(type => type.symbol);

  elements.selectionText.textContent = `当前题库: ${labels.join(", ")} | 复习队列: ${state.repeatQueue.length}`;
}

function updateScoreboard() {
  const total = Math.max(state.totalRounds, 1);
  const progress = state.totalRounds === 0 ? 0 : Math.round((state.correct / total) * 100);
  elements.progressText.textContent = `${progress}%`;
  elements.progressBar.style.width = `${progress}%`;
  elements.correctCount.textContent = String(state.correct);
  elements.incorrectCount.textContent = String(state.incorrect);
  elements.reviewCount.textContent = String(state.repeatQueue.length);
}

function updatePressedNotes() {
  const notes = [...state.heldNotes].sort((a, b) => a - b);
  const formatted = notes.length ? formatPlayedNotes(notes) : "无";
  elements.pressedNotes.textContent = formatted;
  if (elements.liveNotesText) {
    elements.liveNotesText.textContent = `当前按住: ${formatted}`;
  }
}

function updateKeyboardHighlights() {
  document.querySelectorAll("[data-midi]").forEach(key => {
    const midi = Number(key.dataset.midi);
    key.classList.toggle("active", state.heldNotes.has(midi));
  });
}

function setResult(message, tone) {
  elements.resultText.textContent = message;
  elements.resultText.className = `result-text ${tone}`;
}

function formatPlayedNotes(notes) {
  return notes.map(midiToName).join(" - ");
}

function midiToName(midi) {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
