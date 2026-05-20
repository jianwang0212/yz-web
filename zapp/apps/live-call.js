const LOCAL_CHAT_URL = 'http://localhost:8005/v1/chat/completions';
const LOCAL_CHAT_FALLBACK_URL = 'http://127.0.0.1:8005/v1/chat/completions';
const LOCAL_TTS_URL = 'http://localhost:8005/v1/audio/speech';
const LOCAL_TTS_FALLBACK_URL = 'http://127.0.0.1:8005/v1/audio/speech';
const PRODUCTION_CHAT_PATH = '/api/zi-style-reply/chat';
const PRODUCTION_TTS_PATH = '/api/ziyin-voiceover/generate';
const STORAGE_KEY = 'zappAiZiVoice:messages';

const STYLE_SYSTEM_PROMPT = `你正在代写银子的微信语音回复。只输出银子会说的一句话或两句话。

风格规则：
- 短句，直接，少客套，像微信语音里自然说话。
- 可以中英混合：codex, private, doc, doublecheck, Boston time。
- 常用“可以 / 等我 / 我先看一下 / 我觉得 / 我感觉 / 要不然 / 先...再...”。
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
let messages = [];
let listenTimeout = null;
let actionToken = 0;

function isLocalMode() {
  return (
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) ||
    window.location.protocol === 'file:' ||
    /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(window.location.hostname)
  );
}

function modeLabel() {
  return isLocalMode() ? '本地 WeClone 8005' : 'thisisyz Zi style + ElevenLabs';
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
  const history = messages.slice(-8).map((message) => ({
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

async function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function requestLocalChat(body) {
  try {
    return await postJson(localApiUrl('/v1/chat/completions'), body);
  } catch {
    try {
      return await postJson(LOCAL_CHAT_URL, body);
    } catch {
      return postJson(LOCAL_CHAT_FALLBACK_URL, body);
    }
  }
}

async function requestAiReply(text) {
  const body = {
    model: 'gpt-3.5-turbo',
    messages: apiMessages(text),
    temperature: 0.55,
    top_p: 0.7,
    max_tokens: 120
  };
  const response = isLocalMode() ? await requestLocalChat(body) : await postJson(productionUrl(PRODUCTION_CHAT_PATH), body);

  if (!response.ok) throw new Error(`chat ${response.status}`);
  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}

async function requestVoice(text) {
  if (!isLocalMode()) {
    const response = await postJson(productionUrl(PRODUCTION_TTS_PATH), { text });
    if (!response.ok) throw new Error(`tts ${response.status}`);
    return response.blob();
  }

  const body = {
    model: 'eleven_multilingual_v2',
    voice: 'kITDn23VjnL9Oo4bL8Ad',
    input: text
  };
  let response;
  try {
    response = await postJson(localApiUrl('/v1/audio/speech'), body);
  } catch {
    try {
      response = await postJson(LOCAL_TTS_URL, body);
    } catch {
      response = await postJson(LOCAL_TTS_FALLBACK_URL, body);
    }
  }
  if (!response.ok) throw new Error(`local tts ${response.status}`);
  return response.blob();
}

function playBlob(blob, token) {
  if (token !== actionToken) return;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }
  const audio = new Audio(URL.createObjectURL(blob));
  activeAudio = audio;
  setOrbState('speaking');
  setStatus('银子正在说');
  audio.addEventListener('ended', () => {
    if (token !== actionToken) return;
    activeAudio = null;
    setOrbState(listening ? 'listening' : 'idle');
    setStatus(listening ? '继续说，我在听' : '点麦克风开始说话');
    if (listening) restartRecognition();
  });
  audio.play().catch(() => {
    setStatus('点屏幕播放语音');
    setOrbState('idle');
  });
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

async function sendMessage(text) {
  if (thinking || !text.trim()) return;
  const token = ++actionToken;
  const resumeAfterReply = listening;
  thinking = true;
  listening = false;
  clearListenTimeout();
  stopRecognition();
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
    setLiveCaption(isLocalMode() ? '8005 没连上，用了本地 fallback' : '线上 clone 暂时没连上，用了 fallback');
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
  instance.continuous = false;

  let finalTranscript = '';
  instance.onstart = () => {
    clearListenTimeout();
    listenTimeout = setTimeout(() => {
      if (!thinking && listening) {
        stopRecognition();
        listening = false;
        setOrbState('idle');
        setStatus('没听到声音，再点麦克风');
        setLiveCaption(`${modeLabel()} · 等待重新开始`);
      }
    }, 12000);
    setOrbState('listening');
    setStatus('正在听你说');
  };
  instance.onresult = (event) => {
    let interim = '';
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript.trim();
      if (event.results[index].isFinal) finalTranscript += transcript;
      else interim += transcript;
    }
    if (interim) setLiveCaption(interim);
  };
  instance.onerror = () => {
    clearListenTimeout();
    listening = false;
    setStatus('语音识别失败，可以打字');
    setLiveCaption(`${modeLabel()} · 识别失败，按钮可重新开始`);
    setOrbState('idle');
  };
  instance.onend = () => {
    clearListenTimeout();
    const text = finalTranscript.trim();
    finalTranscript = '';
    if (text && listening) {
      sendMessage(text);
      return;
    }
    if (listening && !thinking && !activeAudio) {
      listening = false;
      setStatus('没听清，再点麦克风');
      setOrbState('idle');
    }
  };
  return instance;
}

function startRecognition() {
  if (!SpeechRecognition) {
    listening = false;
    setStatus('当前浏览器不支持语音识别，可以打字');
    setLiveCaption('当前浏览器不支持语音识别，可以直接打字。');
    setOrbState('idle');
    return;
  }
  recognition = recognition || createRecognition();
  try {
    recognition.start();
  } catch {
    listening = false;
    clearListenTimeout();
    setOrbState('idle');
    setStatus('语音识别没有启动，再点一次');
  }
}

function stopRecognition() {
  try {
    recognition?.stop();
  } catch {}
}

function restartRecognition() {
  if (!listening || thinking || activeAudio) return;
  setTimeout(startRecognition, 300);
}

function startVoiceMode() {
  if (thinking) return;
  actionToken += 1;
  listening = true;
  setLiveCaption(`${modeLabel()} · 正在听`);
  startRecognition();
}

function endVoiceMode() {
  actionToken += 1;
  listening = false;
  thinking = false;
  clearListenTimeout();
  stopRecognition();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
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
  setLiveCaption(`${modeLabel()} · 对话已清空`);
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
