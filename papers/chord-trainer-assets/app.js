const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);
const SPOKEN_ROOTS = ["C", "C sharp", "D", "E flat", "E", "F", "F sharp", "G", "A flat", "A.", "B flat", "B"];

const CHORD_CATEGORIES = {
  triads: [
    { id: "quality-major", suffix: "major", symbol: "", intervals: [0, 4, 7] },
    { id: "quality-minor", suffix: "minor", symbol: "m", intervals: [0, 3, 7] },
    { id: "quality-diminished", suffix: "diminished", symbol: "dim", intervals: [0, 3, 6] },
    { id: "quality-augmented", suffix: "augmented", symbol: "aug", intervals: [0, 4, 8] },
    { id: "quality-sus2", suffix: "sus2", symbol: "sus2", intervals: [0, 2, 7] },
    { id: "quality-sus4", suffix: "sus4", symbol: "sus4", intervals: [0, 5, 7] }
  ],
  sevenths: [
    { id: "quality-maj7", suffix: "major seventh", symbol: "maj7", intervals: [0, 4, 7, 11] },
    { id: "quality-min7", suffix: "minor seventh", symbol: "m7", intervals: [0, 3, 7, 10] },
    { id: "quality-dom7", suffix: "dominant seventh", symbol: "7", intervals: [0, 4, 7, 10] },
    { id: "quality-halfdim7", suffix: "half-diminished seventh", symbol: "m7b5", intervals: [0, 3, 6, 10] },
    { id: "quality-dom7sus4", suffix: "dominant seventh sus four", symbol: "7sus4", intervals: [0, 5, 7, 10] },
    { id: "quality-dim7", suffix: "diminished seventh", symbol: "dim7", intervals: [0, 3, 6, 9] }
  ],
  tensions: [
    { id: "quality-maj9", suffix: "major ninth", symbol: "maj9", intervals: [0, 4, 7, 11, 14] },
    { id: "quality-min9", suffix: "minor ninth", symbol: "m9", intervals: [0, 3, 7, 10, 14] },
    { id: "quality-dom9", suffix: "dominant ninth", symbol: "9", intervals: [0, 4, 7, 10, 14] },
    { id: "quality-minmaj7", suffix: "minor major seventh", symbol: "mMaj7", intervals: [0, 3, 7, 11] }
  ]
};

const state = {
  midiAccess: null,
  midiConnected: false,
  currentChord: null,
  heldNotes: new Set(),
  totalRounds: 0,
  correct: 0,
  incorrect: 0,
  streak: 0,
  hasAnsweredCurrent: false,
  stableTimerId: null,
  lastAttemptSignature: null,
  repeatQueue: [],
  currentRoundStartedAt: 0,
  roundRepeatScheduled: false,
  currentChordSource: "new"
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
  streakCount: document.querySelector("#streak-count"),
  newChord: document.querySelector("#new-chord"),
  repeatChord: document.querySelector("#repeat-chord"),
  showChord: document.querySelector("#show-chord"),
  resetScore: document.querySelector("#reset-score"),
  autoSpeak: document.querySelector("#auto-speak"),
  strictMode: document.querySelector("#strict-mode"),
  qualityMajor: document.querySelector("#quality-major"),
  qualityMinor: document.querySelector("#quality-minor"),
  qualityDiminished: document.querySelector("#quality-diminished"),
  qualityAugmented: document.querySelector("#quality-augmented"),
  qualitySus2: document.querySelector("#quality-sus2"),
  qualitySus4: document.querySelector("#quality-sus4"),
  qualityMaj7: document.querySelector("#quality-maj7"),
  qualityMin7: document.querySelector("#quality-min7"),
  qualityDom7: document.querySelector("#quality-dom7"),
  qualityHalfdim7: document.querySelector("#quality-halfdim7"),
  qualityDom7sus4: document.querySelector("#quality-dom7sus4"),
  qualityDim7: document.querySelector("#quality-dim7"),
  qualityMaj9: document.querySelector("#quality-maj9"),
  qualityMin9: document.querySelector("#quality-min9"),
  qualityDom9: document.querySelector("#quality-dom9"),
  qualityMinmaj7: document.querySelector("#quality-minmaj7"),
  targetChord: document.querySelector("#target-chord"),
  resultText: document.querySelector("#result-text"),
  selectionText: document.querySelector("#selection-text"),
  answerText: document.querySelector("#answer-text")
};

const qualityInputs = [
  elements.qualityMajor,
  elements.qualityMinor,
  elements.qualityDiminished,
  elements.qualityAugmented,
  elements.qualitySus2,
  elements.qualitySus4,
  elements.qualityMaj7,
  elements.qualityMin7,
  elements.qualityDom7,
  elements.qualityHalfdim7,
  elements.qualityDom7sus4,
  elements.qualityDim7,
  elements.qualityMaj9,
  elements.qualityMin9,
  elements.qualityDom9,
  elements.qualityMinmaj7
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
    if (elements.targetChord) {
      elements.targetChord.textContent = "初始化失败";
    }
    if (elements.resultText) {
      setResult("页面初始化出了点问题，请刷新页面再试。", "error");
    }
  }
}

function bindEvents() {
  elements.connectMidi.addEventListener("click", connectMidi);
  elements.newChord.addEventListener("click", () => {
    try {
      startNewRound();
    } catch (error) {
      console.error(error);
      setResult("开始新和弦时出了点问题，请刷新页面再试。", "error");
    }
  });
  elements.repeatChord.addEventListener("click", () => speakCurrentChord(true));
  elements.showChord.addEventListener("click", revealCurrentChord);
  elements.resetScore.addEventListener("click", resetScore);
  qualityInputs.forEach(input => {
    input.addEventListener("change", () => {
      ensureAtLeastOneQuality();
      updateSelectionSummary();
      if (state.currentChord) {
        setResult("练习范围已更新，下一题会按你勾选的类型出题。", "neutral");
      }
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

  for (let midi = 36; midi <= 96; midi += 1) {
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
    state.midiConnected = true;
    const inputNames = [...state.midiAccess.inputs.values()].map(input => input.name).filter(Boolean);
    elements.midiStatus.textContent = inputNames.length ? inputNames.join(", ") : "已连接";
    setResult("MIDI 已连接，现在可以开始新一轮和弦训练。", "neutral");
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

    const connectedInputs = [...state.midiAccess.inputs.values()]
      .filter(input => input.state === "connected")
      .map(input => input.name)
      .filter(Boolean);

    elements.midiStatus.textContent = connectedInputs.length ? connectedInputs.join(", ") : "已连接，等待输入";
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

  if (state.heldNotes.size === 0 && state.currentChord && !state.hasAnsweredCurrent) {
    state.lastAttemptSignature = null;
    setResult("请再试一次。", "neutral");
  }

  scheduleEvaluation();
}

function scheduleEvaluation() {
  window.clearTimeout(state.stableTimerId);

  if (!state.currentChord || state.heldNotes.size === 0 || state.hasAnsweredCurrent) {
    return;
  }

  state.stableTimerId = window.setTimeout(() => {
    evaluateCurrentHeldNotes();
  }, 180);
}

function evaluateCurrentHeldNotes() {
  if (!state.currentChord || state.hasAnsweredCurrent) {
    return;
  }

  const played = [...state.heldNotes].sort((a, b) => a - b);
  const targetExact = state.currentChord.notes.slice().sort((a, b) => a - b);
  const strictMode = elements.strictMode.checked;

  const matches = strictMode
    ? arraysEqual(played, targetExact)
    : pitchClassSetEquals(played, targetExact);

  if (matches) {
    const elapsedMs = Date.now() - state.currentRoundStartedAt;

    if (elapsedMs > 5000 && !state.roundRepeatScheduled) {
      queueChordForReview(state.currentChord);
      state.roundRepeatScheduled = true;
    }

    state.correct += 1;
    state.totalRounds += 1;
    state.streak += 1;
    state.hasAnsweredCurrent = true;
    state.lastAttemptSignature = null;
    setResult(
      elapsedMs > 5000
        ? `答对了: ${state.currentChord.label}，但超过 5 秒，已加入复习。`
        : `答对了: ${state.currentChord.label}`,
      "success"
    );
    elements.answerText.textContent = `你弹的是 ${formatPlayedNotes(played)}。`;
    updateSelectionSummary();
    updateScoreboard();
    window.setTimeout(startNewRound, 900);
    return;
  }

  if (strictMode ? played.length >= targetExact.length : uniquePitchClasses(played).length >= uniquePitchClasses(targetExact).length) {
    const attemptSignature = strictMode
      ? played.join("-")
      : uniquePitchClasses(played).join("-");

    if (attemptSignature !== state.lastAttemptSignature) {
      state.incorrect += 1;
      state.streak = 0;
      state.lastAttemptSignature = attemptSignature;
      if (!state.roundRepeatScheduled) {
        queueChordForReview(state.currentChord);
        state.roundRepeatScheduled = true;
        updateSelectionSummary();
      }
      updateScoreboard();
    }

    setResult(`还不对，继续试这题。这个和弦已加入复习。`, "error");
    elements.answerText.textContent = `你弹的是 ${formatPlayedNotes(played)}。松开后可以再弹一次。`;
  }
}

function startNewRound() {
  ensureAtLeastOneQuality();
  const pool = buildChordPool();
  if (pool.length === 0) {
    setResult("请至少勾选一种练习类型。", "error");
    return;
  }

  if (state.repeatQueue.length > 0) {
    state.currentChord = state.repeatQueue.shift();
    state.currentChordSource = "review";
  } else {
    state.currentChord = pool[Math.floor(Math.random() * pool.length)];
    state.currentChordSource = "new";
  }

  state.hasAnsweredCurrent = false;
  state.lastAttemptSignature = null;
  state.currentRoundStartedAt = Date.now();
  state.roundRepeatScheduled = false;
  state.heldNotes.clear();
  updateKeyboardHighlights();
  updatePressedNotes();
  elements.targetChord.textContent = state.currentChord.label;
  elements.answerText.textContent = "";
  setResult(
    state.currentChordSource === "review"
      ? "复习题：请再次弹出这个和弦。"
      : "请在 MIDI 键盘上弹出这个和弦。",
    "neutral"
  );
  updateSelectionSummary();

  if (elements.autoSpeak.checked) {
    speakCurrentChord(false);
  }
}

function buildChordPool() {
  const rootMidiBase = 48;
  const roots = Array.from({ length: 12 }, (_, index) => index);
  const definitions = getSelectedChordDefinitions();

  return roots.flatMap(root => {
    return definitions.map(definition => {
      const intervals = definition.intervals;
      const notes = intervals.map(interval => rootMidiBase + root + interval);
      return {
        root,
        suffix: definition.suffix,
        notes,
        label: `${NOTE_NAMES[root]}${definition.symbol}`,
        spokenLabel: `${SPOKEN_ROOTS[root]} ${definition.suffix}`
      };
    });
  });
}

function revealCurrentChord() {
  if (!state.currentChord) {
    setResult("请先开始一轮，再显示答案。", "neutral");
    return;
  }

  elements.answerText.textContent = `答案: ${state.currentChord.label} = ${formatPlayedNotes(state.currentChord.notes)}。`;
}

function resetScore() {
  state.totalRounds = 0;
  state.correct = 0;
  state.incorrect = 0;
  state.streak = 0;
  state.hasAnsweredCurrent = false;
  state.lastAttemptSignature = null;
  state.currentChord = null;
  state.heldNotes.clear();
  updateKeyboardHighlights();
  updatePressedNotes();
  updateScoreboard();
  elements.targetChord.textContent = "加载中...";
  elements.answerText.textContent = "";
  setResult("统计已重置。", "neutral");
  startNewRound();
}

function speakCurrentChord(force) {
  if (!state.currentChord) {
    if (force) {
      setResult("请先开始一轮，再播报和弦。", "neutral");
    }
    return;
  }

  if (!("speechSynthesis" in window)) {
    elements.voiceStatus.textContent = "语音不可用";
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.currentChord.spokenLabel);
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

function updateScoreboard() {
  const total = Math.max(state.totalRounds, 1);
  const progress = state.totalRounds === 0 ? 0 : Math.round((state.correct / total) * 100);
  elements.progressText.textContent = `${progress}%`;
  elements.progressBar.style.width = `${progress}%`;
  elements.correctCount.textContent = String(state.correct);
  elements.incorrectCount.textContent = String(state.incorrect);
  elements.streakCount.textContent = String(state.streak);
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

function uniquePitchClasses(notes) {
  return [...new Set(notes.map(note => note % 12))].sort((a, b) => a - b);
}

function pitchClassSetEquals(a, b) {
  const normalizedA = uniquePitchClasses(a);
  const normalizedB = uniquePitchClasses(b);
  return arraysEqual(normalizedA, normalizedB);
}

function getSelectedChordDefinitions() {
  return Object.values(CHORD_CATEGORIES)
    .flat()
    .filter(definition => {
      const input = document.querySelector(`#${definition.id}`);
      return input ? input.checked : false;
    });
}

function ensureAtLeastOneQuality() {
  const anyChecked = qualityInputs.some(input => input.checked);
  if (!anyChecked) {
    elements.qualityMajor.checked = true;
  }
}

function updateSelectionSummary() {
  const labels = Object.values(CHORD_CATEGORIES)
    .flat()
    .filter(definition => {
      const input = document.querySelector(`#${definition.id}`);
      return input ? input.checked : false;
    })
    .map(definition => definition.symbol || "major");

  if (!elements.selectionText) {
    return;
  }

  elements.selectionText.textContent = labels.length
    ? `当前题库: ${labels.join(", ")} | 复习队列: ${state.repeatQueue.length}`
    : `当前会从你勾选的和弦类型里随机出题。 | 复习队列: ${state.repeatQueue.length}`;
}

function queueChordForReview(chord) {
  if (!chord) {
    return;
  }

  state.repeatQueue.push({ ...chord, notes: [...chord.notes] });
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
