const LOCAL_CHAT_URL = 'http://localhost:8005/v1/chat/completions';
const LOCAL_CHAT_FALLBACK_URL = 'http://127.0.0.1:8005/v1/chat/completions';
const LOCAL_TTS_URL = 'http://localhost:8005/v1/audio/speech';
const LOCAL_TTS_FALLBACK_URL = 'http://127.0.0.1:8005/v1/audio/speech';
const PRODUCTION_CHAT_PATH = '/api/zi-style-reply/chat';
const PRODUCTION_TTS_PATH = '/api/ziyin-voiceover/generate';
const PRODUCTION_TRANSCRIBE_PATH = '/api/live-call/transcribe';
const STORAGE_KEY = 'zappAiZiVoice:messages';
const CHAT_TIMEOUT_MS = 8000;
const TRANSCRIBE_TIMEOUT_MS = 30000;
const TTS_TIMEOUT_MS = 90000;
const RESTART_DELAY_MS = 900;
const RECORDER_MAX_MS = 5500;
const SILENT_AUDIO_URL =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

const STYLE_SYSTEM_PROMPT = `你正在代写银子的微信语音回复。只输出银子会说的一句话或两句话。

风格规则：
- 短句，直接，少客套，像微信语音里自然说话。
- 可以中英混合：codex, private, doc, doublecheck, Boston time。
- 常用“可以 / 等我 / 我先看一下 / 我觉得 / 我感觉 / 要不然 / 先...再...”。
- 为了像实时语音，优先 8 到 24 个字，最多一句。
- 不要说自己是 AI、模型、虚拟人、机器人。
- 如果被问“你是谁”，只说“我是银子这边的语音版本”。
- 输出只能是回复内容，不要解释。`;

const els = {
  callButton: document.querySelector('#callButton'),
  chatForm: document.querySelector('#chatForm'),
  hangupButton: document.querySelector('#hangupButton'),
  liveCaption: document.querySelector('#liveCaption'),
  messageInput: document.querySelector('#messageInput'),
  micButton: document.querySelector('#micButton'),
  orb: document.querySelector('#callButton'),
  playReplyButton: document.querySelector('#playReplyButton'),
  replyCaption: document.querySelector('#replyCaption'),
  resetButton: document.querySelector('#resetButton'),
  statusText: document.querySelector('#statusText'),
  transcriptPanel: document.querySelector('#transcriptPanel')
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;
let thinking = false;
let activeAudio = null;
let replyAudio = null;
let audioUnlocked = false;
let lastAudioUrl = '';
let messages = [];
let listenTimeout = null;
let recognitionRestartTimer = null;
let ignoreRecognitionEnd = false;
let recorderStream = null;
let recorder = null;
let recorderTimer = null;
let recorderStarting = false;
let actionToken = 0;

function isLocalMode() {
  return (
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) ||
    window.location.protocol === 'file:' ||
    /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(window.location.hostname)
  );
}

function isLoopbackOrFileMode() {
  return window.location.protocol === 'file:' || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function isInsecureLanMode() {
  return window.location.protocol === 'http:' && !isLoopbackOrFileMode() && !window.isSecureContext;
}

function isIphoneMode() {
  return /iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isMobileVoiceMode() {
  return isIphoneMode() || (navigator.maxTouchPoints > 0 && window.innerWidth < 900);
}

function modeLabel() {
  return isLocalMode() ? '本地 WeClone 8005' : 'thisisyz Zi style + ElevenLabs';
}

function speechUnavailableMessage(error = '') {
  if (isInsecureLanMode()) return '当前是 HTTP 局域网地址，浏览器不允许接入麦克风';
  if (error === 'not-allowed' || error === 'service-not-allowed') return '麦克风权限被浏览器拒绝';
  if (error === 'no-speech' || error === 'aborted') return '继续听你说';
  if (error === 'audio-capture') return '没有检测到可用麦克风';
  if (error === 'network') return '语音识别在重连';
  return '继续听你说';
}

function speechUnavailableCaption(error = '') {
  if (isInsecureLanMode()) return '本地语音输入要用 http://localhost 或 HTTPS；192.168 的 HTTP 只能打字。';
  if (error === 'not-allowed' || error === 'service-not-allowed') return '请在浏览器地址栏允许麦克风权限后再试。';
  return `${modeLabel()} · 继续听`;
}

function setStatus(text) {
  els.statusText.textContent = text;
}

function setLiveCaption(text) {
  els.liveCaption.textContent = text;
}

function setOrbState(state) {
  els.orb.classList.toggle('is-listening', state === 'listening');
  els.orb.classList.toggle('is-thinking', state === 'thinking');
  els.orb.classList.toggle('is-speaking', state === 'speaking');
  els.micButton.classList.toggle('is-active', state === 'listening');
}

function clearListenTimeout() {
  clearTimeout(listenTimeout);
  listenTimeout = null;
}

function clearRecognitionRestartTimer() {
  clearTimeout(recognitionRestartTimer);
  recognitionRestartTimer = null;
}

function clearRecorderTimer() {
  clearTimeout(recorderTimer);
  recorderTimer = null;
}

function productionUrl(path) {
  return new URL(path, window.location.origin).href;
}

function localApiUrl(path) {
  if (window.location.protocol === 'file:' || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) {
    return `http://localhost:8005${path}`;
  }
  return `http://${window.location.hostname}:8005${path}`;
}

function loadMessages() {
  try {
    messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').filter(
      (message) => message && ['me', 'zi'].includes(message.role) && typeof message.text === 'string'
    );
  } catch {
    messages = [];
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
}

function renderTranscript() {
  els.transcriptPanel.replaceChildren();
  for (const message of messages.slice(-4)) {
    const line = document.createElement('div');
    line.className = `transcript-line ${message.role === 'me' ? 'me' : 'zi'}`;
    line.textContent = message.text;
    els.transcriptPanel.append(line);
  }
  els.transcriptPanel.scrollTop = els.transcriptPanel.scrollHeight;
}

function apiMessages(latestText) {
  const history = messages.slice(-4).map((message) => ({
    role: message.role === 'me' ? 'user' : 'assistant',
    content: message.text
  }));
  if (history.at(-1)?.role === 'user') history.pop();
  history.push({ role: 'user', content: latestText });
  return [{ role: 'system', content: STYLE_SYSTEM_PROMPT }, ...history];
}

function fallbackReply(text) {
  if (/在吗|听得到|hello|你好/i.test(text)) return '我在 你说';
  if (/忙|干嘛|做什么/.test(text)) return '我现在在看这个 等我一下';
  if (/可以|能不能|行吗|要不要/.test(text)) return '可以 我先看一下';
  if (/为什么|为啥/.test(text)) return '我感觉主要是这个点没对上';
  if (/怎么办|怎么弄|咋办/.test(text)) return '先别急 我们拆小一点';
  return '我先想一下 你继续说';
}

function quickReply(text) {
  if (/听到|听得见|听见|可以说话|可以打电话|能说话|电话/.test(text)) return '可以 我能听到 你继续说';
  if (/还在|继续|在听|没听到|听不到/.test(text)) return '在 我听着 你继续说';
  if (/速度|太慢|有点慢|卡/.test(text)) return '有点慢 我再优化一下';
  if (/总结|小结|归纳/.test(text)) return '我先总结一下';
  return '';
}

async function postJson(url, body, timeoutMs = CHAT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function requestLocalChat(body) {
  if (!isLoopbackOrFileMode()) {
    return postJson(localApiUrl('/v1/chat/completions'), body, CHAT_TIMEOUT_MS);
  }
  try {
    return await postJson(localApiUrl('/v1/chat/completions'), body, CHAT_TIMEOUT_MS);
  } catch {
    try {
      return await postJson(LOCAL_CHAT_URL, body, CHAT_TIMEOUT_MS);
    } catch {
      return postJson(LOCAL_CHAT_FALLBACK_URL, body, CHAT_TIMEOUT_MS);
    }
  }
}

async function requestAiReply(text) {
  const instantReply = quickReply(text);
  if (instantReply) return instantReply;

  const body = {
    model: 'gpt-3.5-turbo',
    messages: apiMessages(text),
    temperature: 0.55,
    top_p: 0.7,
    max_tokens: 56
  };
  const response = isLocalMode()
    ? await requestLocalChat(body)
    : await postJson(productionUrl(PRODUCTION_CHAT_PATH), body, CHAT_TIMEOUT_MS);

  if (!response.ok) throw new Error(`chat ${response.status}`);
  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}

function preferredAudioMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg'];
  return types.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';
}

async function blobToBase64(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('audio read failed'));
    reader.readAsDataURL(blob);
  });
  return dataUrl.includes(',') ? dataUrl.split(',').pop() : dataUrl;
}

async function requestTranscription(blob) {
  const response = await postJson(
    productionUrl(PRODUCTION_TRANSCRIBE_PATH),
    {
      audioBase64: await blobToBase64(blob),
      mimeType: blob.type || 'audio/webm'
    },
    TRANSCRIBE_TIMEOUT_MS
  );
  if (!response.ok) throw new Error(`transcribe ${response.status}`);
  const payload = await response.json();
  return payload?.text?.trim() || '';
}

async function requestVoice(text) {
  if (!isLocalMode()) {
    const response = await postJson(productionUrl(PRODUCTION_TTS_PATH), { text }, TTS_TIMEOUT_MS);
    if (!response.ok) throw new Error(`tts ${response.status}`);
    return response.blob();
  }

  const body = {
    model: 'eleven_multilingual_v2',
    voice: 'kITDn23VjnL9Oo4bL8Ad',
    input: text
  };
  let response;
  if (!isLoopbackOrFileMode()) {
    response = await postJson(localApiUrl('/v1/audio/speech'), body, TTS_TIMEOUT_MS);
    if (!response.ok) throw new Error(`local tts ${response.status}`);
    return response.blob();
  }
  try {
    response = await postJson(localApiUrl('/v1/audio/speech'), body, TTS_TIMEOUT_MS);
  } catch {
    try {
      response = await postJson(LOCAL_TTS_URL, body, TTS_TIMEOUT_MS);
    } catch {
      response = await postJson(LOCAL_TTS_FALLBACK_URL, body, TTS_TIMEOUT_MS);
    }
  }
  if (!response.ok) throw new Error(`local tts ${response.status}`);
  return response.blob();
}

function showPlayButton(blob, token) {
  if (token !== actionToken) return null;
  if (lastAudioUrl) URL.revokeObjectURL(lastAudioUrl);
  lastAudioUrl = URL.createObjectURL(blob);
  els.playReplyButton.hidden = false;
  els.playReplyButton.textContent = '播放银子语音';
  return lastAudioUrl;
}

function getReplyAudio() {
  if (replyAudio) return replyAudio;
  replyAudio = new Audio();
  replyAudio.preload = 'auto';
  replyAudio.playsInline = true;
  replyAudio.setAttribute('playsinline', '');
  return replyAudio;
}

function unlockAudioPlayback() {
  if (audioUnlocked) return;
  const audio = getReplyAudio();
  audio.pause();
  audio.src = SILENT_AUDIO_URL;
  audio.currentTime = 0;
  audio.muted = false;
  const playPromise = audio.play();
  if (playPromise?.then) {
    playPromise
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audioUnlocked = true;
      })
      .catch(() => {});
  } else {
    audioUnlocked = true;
  }
}

function playAudioUrl(url, token) {
  if (!url || token !== actionToken) return;
  if (token !== actionToken) return;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }
  const audio = getReplyAudio();
  audio.muted = false;
  audio.src = url;
  audio.currentTime = 0;
  activeAudio = audio;
  setOrbState('speaking');
  setStatus('银子正在说');
  els.playReplyButton.textContent = '正在播放';
  audio.onended = () => {
    if (token !== actionToken) return;
    activeAudio = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    els.playReplyButton.textContent = '重播银子语音';
    setOrbState(listening ? 'listening' : 'idle');
    setStatus(listening ? '继续说，我在听' : '点麦克风开始说话');
    if (listening) restartRecognition();
  };
  audio.onerror = () => {
    if (token !== actionToken) return;
    activeAudio = null;
    audio.removeAttribute('src');
    audio.load();
    els.playReplyButton.textContent = '点这里播放银子语音';
    setStatus('音频加载失败，点播放重试');
    setOrbState(listening ? 'listening' : 'idle');
    if (listening) restartRecognition();
  };
  audio.play().catch(() => {
    if (token !== actionToken) return;
    activeAudio = null;
    audio.removeAttribute('src');
    audio.load();
    els.playReplyButton.textContent = '点这里播放银子语音';
    setStatus('点播放按钮听银子语音');
    setOrbState(listening ? 'listening' : 'idle');
    if (listening) restartRecognition();
  });
}

function playBlob(blob, token) {
  const url = showPlayButton(blob, token);
  playAudioUrl(url, token);
}

async function speakReply(text, token) {
  if (token !== actionToken) return;
  setStatus(isLocalMode() ? '正在请求本地语音' : '正在生成 ElevenLabs 语音');
  try {
    const blob = await requestVoice(text);
    playBlob(blob, token);
  } catch {
    if (token !== actionToken) return;
    setStatus('语音生成失败，文字已显示');
    setOrbState(listening ? 'listening' : 'idle');
    if (listening) restartRecognition();
  }
}

async function startRecorderMode() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    startRecognition();
    return;
  }
  if (recorderStarting || recorder?.state === 'recording') return;
  recorderStarting = true;
  try {
    recorderStream =
      recorderStream ||
      (await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }));
    if (!listening || thinking || activeAudio) return;

    const chunks = [];
    const mimeType = preferredAudioMimeType();
    recorder = new MediaRecorder(recorderStream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      clearRecorderTimer();
      if (!listening || thinking || activeAudio || !chunks.length) {
        if (listening && !thinking && !activeAudio) restartRecognition();
        return;
      }
      const token = actionToken;
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
      setStatus('正在转写你说的话');
      try {
        const text = await requestTranscription(blob);
        if (token !== actionToken || !listening) return;
        if (text) {
          sendMessage(text);
          return;
        }
        setStatus('没听清，继续说');
      } catch {
        if (token !== actionToken || !listening) return;
        setStatus('手机转写未配置，切回浏览器识别');
        startRecognition();
        return;
      }
      if (listening && !thinking && !activeAudio) restartRecognition();
    };
    recorder.start();
    setOrbState('listening');
    setStatus('正在听你说');
    setLiveCaption(`${modeLabel()} · 手机录音转写`);
    recorderTimer = setTimeout(() => {
      if (recorder?.state === 'recording') recorder.stop();
    }, RECORDER_MAX_MS);
  } catch {
    setStatus('手机录音启动失败，切回浏览器识别');
    startRecognition();
  } finally {
    recorderStarting = false;
  }
}

async function sendMessage(text) {
  if (thinking || !text.trim()) return;
  const token = ++actionToken;
  const resumeAfterReply = listening;
  thinking = true;
  listening = isMobileVoiceMode() ? resumeAfterReply : false;
  clearListenTimeout();
  if (!isMobileVoiceMode()) {
    stopRecognition({ ignoreEnd: true });
  }
  setOrbState('thinking');
  setStatus(isLocalMode() ? '正在问本地 WeClone' : '正在问 Zi style clone');
  setLiveCaption(`你：${text}`);
  messages.push({ role: 'me', text });
  saveMessages();
  renderTranscript();

  let reply = '';
  try {
    reply = (await requestAiReply(text)) || fallbackReply(text);
  } catch {
    if (token !== actionToken) return;
    reply = fallbackReply(text);
    setLiveCaption(isLocalMode() ? '8005 超时，用了本地 fallback' : '线上 clone 超时，用了 fallback');
  }

  if (token !== actionToken) return;
  messages.push({ role: 'zi', text: reply });
  saveMessages();
  renderTranscript();
  els.replyCaption.textContent = reply;
  thinking = false;
  listening = resumeAfterReply;
  await speakReply(reply, token);
}

function createRecognition() {
  if (!SpeechRecognition) return null;
  const instance = new SpeechRecognition();
  instance.lang = 'zh-CN';
  instance.interimResults = true;
  instance.continuous = isMobileVoiceMode();

  let finalTranscript = '';
  instance.onstart = () => {
    ignoreRecognitionEnd = false;
    clearListenTimeout();
    clearRecognitionRestartTimer();
    listenTimeout = setTimeout(() => {
      if (!thinking && listening) {
        stopRecognition();
        setStatus('继续听你说');
        setLiveCaption(`${modeLabel()} · 继续听`);
      }
    }, 15000);
    setOrbState('listening');
    setStatus('正在听你说');
  };
  instance.onresult = (event) => {
    if (thinking || activeAudio) return;
    let interim = '';
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript.trim();
      if (event.results[index].isFinal) finalTranscript += transcript;
      else interim += transcript;
    }
    if (isMobileVoiceMode() && finalTranscript.trim()) {
      const text = finalTranscript.trim();
      finalTranscript = '';
      sendMessage(text);
      return;
    }
    if (interim) setLiveCaption(interim);
  };
  instance.onerror = (event) => {
    clearListenTimeout();
    const error = event?.error || '';
    const fatal = error === 'not-allowed' || error === 'service-not-allowed' || error === 'audio-capture';
    if (ignoreRecognitionEnd) return;
    if (fatal || isInsecureLanMode()) {
      listening = false;
      setStatus(speechUnavailableMessage(error));
      setLiveCaption(speechUnavailableCaption(error));
      setOrbState('idle');
      return;
    }
    setStatus(speechUnavailableMessage(error));
    setLiveCaption(speechUnavailableCaption(error));
  };
  instance.onend = () => {
    clearListenTimeout();
    const text = finalTranscript.trim();
    finalTranscript = '';
    if (ignoreRecognitionEnd) {
      ignoreRecognitionEnd = false;
      return;
    }
    if (isMobileVoiceMode() && (thinking || activeAudio)) return;
    if (text && listening) {
      sendMessage(text);
      return;
    }
    if (listening && !thinking && !activeAudio) {
      setStatus('继续听你说');
      setOrbState('listening');
      restartRecognition();
    }
  };
  return instance;
}

function startRecognition() {
  if (isMobileVoiceMode() && !isLocalMode()) {
    startRecorderMode();
    return;
  }
  clearRecognitionRestartTimer();
  if (isInsecureLanMode()) {
    listening = false;
    clearListenTimeout();
    setStatus(speechUnavailableMessage());
    setLiveCaption(speechUnavailableCaption());
    setOrbState('idle');
    return;
  }
  if (!SpeechRecognition) {
    listening = false;
    setStatus('当前浏览器不支持语音识别，可以打字');
    setLiveCaption('当前浏览器不支持语音识别，可以直接打字。');
    setOrbState('idle');
    return;
  }
  recognition = createRecognition();
  try {
    recognition.start();
  } catch {
    clearListenTimeout();
    if (listening && !thinking && !activeAudio) {
      setStatus('继续听你说');
      recognitionRestartTimer = setTimeout(startRecognition, 500);
      return;
    }
    setOrbState('idle');
    setStatus('语音识别没有启动，再点一次');
  }
}

function stopRecognition({ ignoreEnd = false } = {}) {
  clearRecorderTimer();
  if (recorder?.state === 'recording') {
    try {
      recorder.stop();
    } catch {}
  }
  if (ignoreEnd) ignoreRecognitionEnd = true;
  try {
    recognition?.stop();
  } catch {}
}

function restartRecognition() {
  if (!listening || thinking || activeAudio) return;
  clearRecognitionRestartTimer();
  recognitionRestartTimer = setTimeout(startRecognition, RESTART_DELAY_MS);
}

function startVoiceMode() {
  if (thinking) return;
  actionToken += 1;
  listening = true;
  unlockAudioPlayback();
  setLiveCaption(`${modeLabel()} · 正在听`);
  startRecognition();
}

function endVoiceMode() {
  actionToken += 1;
  listening = false;
  thinking = false;
  clearListenTimeout();
  clearRecognitionRestartTimer();
  stopRecognition({ ignoreEnd: true });
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (replyAudio) {
    replyAudio.pause();
    replyAudio.removeAttribute('src');
    replyAudio.load();
  }
  recorderStream?.getTracks().forEach((track) => track.stop());
  recorderStream = null;
  setOrbState('idle');
  setStatus('点麦克风开始说话');
  setLiveCaption(`${modeLabel()} · 已结束`);
}

function autosizeInput() {
  els.messageInput.style.height = 'auto';
  els.messageInput.style.height = `${Math.min(132, els.messageInput.scrollHeight)}px`;
}

els.callButton.addEventListener('click', () => {
  if (listening) endVoiceMode();
  else startVoiceMode();
});

els.micButton.addEventListener('click', () => {
  if (listening) endVoiceMode();
  else startVoiceMode();
});

els.hangupButton.addEventListener('click', endVoiceMode);
els.resetButton.addEventListener('click', () => {
  messages = [];
  saveMessages();
  renderTranscript();
  els.replyCaption.textContent = '';
  els.playReplyButton.hidden = true;
  setLiveCaption(`${modeLabel()} · 对话已清空`);
});

els.playReplyButton.addEventListener('click', () => {
  audioUnlocked = true;
  playAudioUrl(lastAudioUrl, actionToken);
});

els.chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = els.messageInput.value.trim();
  if (!text) return;
  els.messageInput.value = '';
  autosizeInput();
  sendMessage(text);
});

els.messageInput.addEventListener('input', autosizeInput);
els.messageInput.addEventListener('keydown', (event) => {
  if (event.isComposing) return;
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    els.chatForm.requestSubmit();
  }
});

loadMessages();
renderTranscript();
setLiveCaption(`${modeLabel()} · 点麦克风开始`);
