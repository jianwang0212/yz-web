const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const SPOKEN_ROOTS = ["C", "C sharp", "D", "E flat", "E", "F", "F sharp", "G", "A flat", "A.", "B flat", "B"];
const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);

const CHORD_TYPES = [
  { id: "quality-maj7", suffix: "major seventh", symbol: "maj7", third: 4, seventh: 11 },
  { id: "quality-min7", suffix: "minor seventh", symbol: "m7", third: 3, seventh: 10 }
];

const VOICING_RULES = [
  { minBassMidi: 28, label: "E1+", degrees: ["1", "5", "1+"] },
  { minBassMidi: 33, label: "A1+", degrees: ["1", "5", "3"] },
  { minBassMidi: 34, label: "Bb1+", degrees: ["1", "5", "9"] },
  { minBassMidi: 35, label: "B1+", degrees: ["1", "5", "9", "3"] },
  { minBassMidi: 38, label: "D2+", degrees: ["1", "5", "7"] }
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
  roundRepeatScheduled: false
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
  targetChord: document.querySelector("#target-chord"),
  resultText: document.querySelector("#result-text"),
  selectionText: document.querySelector("#selection-text"),
  answerText: document.querySelector("#answer-text")
};

const qualityInputs = [elements.qualityMaj7, elements.qualityMin7].filter(Boolean);

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
  elements.connectMidi.addEventListener("click", connectMidi);
  elements.newChord.addEventListener("click", startNewRound);
  elements.repeatChord.addEventListener("click", () => speakCurrentPrompt(true));
  elements.showChord.addEventListener("click", revealAnswer);
  elements.resetScore.addEventListener("click", resetScore);
  qualityInputs.forEach(input => {
    input.addEventListener("change", () => {
      ensureAtLeastOneQuality();
      updateSelectionSummary();
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
      message: `最低音需要是 ${NOTE_NAMES[prompt.root]}。你现在最低音是 ${midiToName(bass)}。`
    };
  }

  const rule = getRuleForBass(bass);
  const expected = buildExpectedVoicing(prompt, bass, rule);
  const matches = arraysEqual(played, expected.notes);

  return {
    matches,
    rule,
    degreeLabel: rule.degrees.join(" - ").replaceAll("3", prompt.type.symbol === "m7" ? "b3" : "3").replaceAll("7", prompt.type.symbol === "m7" ? "b7" : "7"),
    message: matches
      ? ""
      : `当前最低音 ${midiToName(bass)} 对应规则 ${rule.label}: ${expected.degreeLabel}。正确答案应是 ${formatPlayedNotes(expected.notes)}。`
  };
}

function getRuleForBass(bassMidi) {
  let activeRule = VOICING_RULES[0];
  for (const rule of VOICING_RULES) {
    if (bassMidi >= rule.minBassMidi) {
      activeRule = rule;
    }
  }
  return activeRule;
}

function buildExpectedVoicing(prompt, bassMidi, rule) {
  const degreeMap = {
    "1": 0,
    "1+": 12,
    "3": prompt.type.third,
    "5": 7,
    "7": prompt.type.seventh,
    "9": 14
  };

  const notes = rule.degrees.map(degree => bassMidi + degreeMap[degree]);
  const degreeLabel = rule.degrees
    .map(degree => {
      if (degree === "3" && prompt.type.third === 3) {
        return "b3";
      }
      if (degree === "7" && prompt.type.seventh === 10) {
        return "b7";
      }
      return degree === "1+" ? "1" : degree;
    })
    .join(" - ");

  return { notes, degreeLabel };
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
  state.heldNotes.clear();
  updateKeyboardHighlights();
  updatePressedNotes();
  updateSelectionSummary();
  elements.targetChord.textContent = state.currentPrompt.label;
  elements.answerText.textContent = "";
  setResult("请按最低音所在区间，弹出正确的左手 voicing。", "neutral");

  if (elements.autoSpeak.checked) {
    speakCurrentPrompt(false);
  }
}

function buildPromptPool() {
  const selectedTypes = CHORD_TYPES.filter(type => {
    const input = document.querySelector(`#${type.id}`);
    return input && input.checked;
  });

  return NOTE_NAMES.flatMap((_, root) =>
    selectedTypes.map(type => ({
      root,
      type,
      label: `${NOTE_NAMES[root]}${type.symbol}`,
      spokenLabel: `${SPOKEN_ROOTS[root]} ${type.suffix}`
    }))
  );
}

function speakCurrentPrompt(force) {
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

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.currentPrompt.spokenLabel);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.lang = "en-US";
  utterance.onstart = () => {
    elements.voiceStatus.textContent = "播报中";
  };
  utterance.onend = () => {
    elements.voiceStatus.textContent = "已就绪";
  };
  utterance.onerror = () => {
    elements.voiceStatus.textContent = "语音错误";
  };
  window.speechSynthesis.speak(utterance);
}

function revealAnswer() {
  if (!state.currentPrompt) {
    return;
  }

  const examples = [
    buildExpectedVoicing(state.currentPrompt, midiForRootNear(36, state.currentPrompt.root), getRuleForBass(midiForRootNear(36, state.currentPrompt.root))),
    buildExpectedVoicing(state.currentPrompt, midiForRootNear(48, state.currentPrompt.root), getRuleForBass(midiForRootNear(48, state.currentPrompt.root)))
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
  const labels = [];
  if (elements.qualityMaj7.checked) {
    labels.push("maj7");
  }
  if (elements.qualityMin7.checked) {
    labels.push("m7");
  }

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
  elements.pressedNotes.textContent = notes.length ? formatPlayedNotes(notes) : "无";
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
