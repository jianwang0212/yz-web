const STYLE_RULES = `你是一个写作风格转换器。你的任务不是冒充真人，也不要自动发送消息；只为 Zi 起草“像 Zi 微信说话风格”的候选回复。

风格统计：
- 样本数：163382
- 平均长度：9.8 字；中位数：6 字
- 常见短语：可以, 谢谢, 好的, 我觉得, 先, 再, 我在, 辛苦, 你可以, 没事, 慢慢来, 不用, 我现在, 我感觉
- 标点/混合习惯：问号 15254，感叹号 8090，中英混合 41077，中文空格切分 33654

Zi 微信风格规则：
1. 短句，直接，少客套；通常 1-3 个短分句。
2. 先说动作、状态、约束，少写解释。
3. 中文里可以自然夹 English 工作流词：codex, private, doc, conf, doublecheck, Boston time。
4. 常用“我觉得 / 我感觉 / 可以 / 不然 / 要不然 / 等我 / 我现在 / 先...再...”。
5. 中文可以用空格切分思路，不追求完整标点。
6. 可以轻微俏皮，但不要客服腔、公众号腔、过度礼貌或长篇解释。
7. 不要声称自己就是 Zi；输出只是“候选回复草稿”，必须由 Zi 人工确认后再发送。

输出格式：
只输出银子这一条回复。不要解释。`;

const SAMPLE_CONTEXT = '今晚我可能晚点到，你看还等不等？';
const STORAGE_KEYS = {
  messages: 'ziStyleChat:messages',
  intent: 'ziStyleChat:intent',
  tone: 'ziStyleChat:tone'
};
const API_URL = 'http://localhost:8005/v1/chat/completions';
const API_URL_FALLBACK = 'http://127.0.0.1:8005/v1/chat/completions';
const TTS_URL = 'http://localhost:8005/v1/audio/speech';
const TTS_URL_FALLBACK = 'http://127.0.0.1:8005/v1/audio/speech';
const PRODUCTION_CHAT_PATH = '/api/zi-style-reply/chat';
const PRODUCTION_TTS_PATH = '/api/ziyin-voiceover/generate';
const VOICE_ONLY_MODE = false;

const els = {
  chatForm: document.querySelector('#chatForm'),
  chatLog: document.querySelector('#chatLog'),
  clearButton: document.querySelector('#clearButton'),
  closeToolsButton: document.querySelector('#closeToolsButton'),
  connectionState: document.querySelector('#connectionState'),
  copyLastButton: document.querySelector('#copyLastButton'),
  copyPromptButton: document.querySelector('#copyPromptButton'),
  drawer: document.querySelector('#toolDrawer'),
  input: document.querySelector('#messageInput'),
  intent: document.querySelector('#intentSelect'),
  promptPreview: document.querySelector('#promptPreview'),
  sampleButton: document.querySelector('#sampleButton'),
  statusLine: document.querySelector('#statusLine'),
  tone: document.querySelector('#toneSelect'),
  toolsButton: document.querySelector('#toolsButton')
};

let messages = [];
let lastZiReply = '';
let isSending = false;
let activeAudio = null;

function intentLabel(value) {
  return {
    ask: '反问 / 确认',
    neutral: '自然回复',
    no: '拒绝 / 暂时不行',
    thanks: '感谢 / 收到',
    wait: '等我 / 晚点',
    yes: '答应 / 可以'
  }[value] || '自然回复';
}

function toneLabel(value) {
  return {
    direct: '更直接',
    plain: '平常',
    soft: '软一点',
    work: '工作流'
  }[value] || '平常';
}

function transcript() {
  return messages
    .slice(-10)
    .map((message) => `${message.role === 'me' ? '我' : '银子'}：${message.text}`)
    .join('\n');
}

function buildPrompt(latestText = '') {
  const history = transcript() || '暂无历史';
  const latest = latestText || messages.filter((message) => message.role === 'me').at(-1)?.text || '帮我回一句';
  return `${STYLE_RULES}

聊天历史：
${history}

对方刚说：
${latest}

银子的表达意图：${intentLabel(els.intent.value)}
语气：${toneLabel(els.tone.value)}

请按上面的 Zi 微信风格输出银子在聊天框里会发的一条回复。`;
}

function apiMessages(latestText) {
  const history = [];
  for (const message of messages.slice(-8)) {
    const role = message.role === 'me' ? 'user' : 'assistant';
    if (!history.length && role !== 'user') continue;
    if (history.at(-1)?.role === role) {
      history[history.length - 1].content = `${history.at(-1).content}\n${message.text}`;
    } else {
      history.push({ role, content: message.text });
    }
  }
  if (history.at(-1)?.role === 'user') history.pop();
  history.push({ role: 'user', content: latestText });
  return [
    {
      role: 'system',
      content:
        '你正在代写银子的微信回复草稿。只输出银子会发的一条消息。短句，直接，少客套，可以中英混合。禁止说自己是 AI、模型、虚拟存在、分身、机器人。被问喜欢谁这类暧昧问题时，回“这个问题有点危险”。'
    },
    ...history
  ];
}

function setStatus(message, isError = false) {
  els.statusLine.textContent = message;
  els.statusLine.classList.toggle('is-error', isError);
}

function setConnectionState(message) {
  els.connectionState.textContent = message;
}

function isLocalHost() {
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function isFilePreview() {
  return window.location.protocol === 'file:';
}

function useLocalApi() {
  return isLocalHost() || isFilePreview();
}

function shouldUseVoiceReply() {
  return !useLocalApi();
}

function productionTtsUrl() {
  return new URL(PRODUCTION_TTS_PATH, window.location.origin).href;
}

function productionChatUrl() {
  return new URL(PRODUCTION_CHAT_PATH, window.location.origin).href;
}

function updatePromptPreview(latestText = '') {
  els.promptPreview.textContent = buildPrompt(latestText);
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages.slice(-30)));
  localStorage.setItem(STORAGE_KEYS.intent, els.intent.value);
  localStorage.setItem(STORAGE_KEYS.tone, els.tone.value);
}

function loadState() {
  try {
    messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]').filter(
      (message) => message && ['me', 'zi'].includes(message.role) && typeof message.text === 'string'
    );
  } catch {
    messages = [];
  }
  els.intent.value = localStorage.getItem(STORAGE_KEYS.intent) || 'neutral';
  els.tone.value = localStorage.getItem(STORAGE_KEYS.tone) || 'plain';
  if (!messages.length && !VOICE_ONLY_MODE) {
    messages = [
      {
        role: 'zi',
        text: '你直接说 我按银子的语气回你'
      }
    ];
  }
  lastZiReply = messages.filter((message) => message.role === 'zi').at(-1)?.text || '';
}

function contextHints(text) {
  return {
    hasQuestion: /[?？]|能不能|可不可以|要不要|什么时候|几点|咋样/.test(text),
    hasLater: /晚点|等|迟|明天|周|时间|几点|下午|晚上|早上|到/.test(text),
    hasWork: /项目|文档|doc|codex|测试|网站|工具|数据|private|发版|发布|app|prompt/i.test(text),
    hasThanks: /谢谢|感谢|辛苦|麻烦/.test(text),
    hasCheck: /看一下|检查|查一下|确认|doublecheck/i.test(text)
  };
}

function directQuestionReply(text) {
  const clean = text.replace(/\s+/g, '');
  const rules = [
    {
      pattern: /(你)?喜欢谁|最喜欢谁|喜欢我吗|你爱谁|爱我吗/,
      replies: ['这个问题有点危险', '你猜', '我先不回答这个']
    },
    {
      pattern: /你是谁|你叫什么|你是银子吗/,
      replies: ['我是银子 但这是本地草稿版', '你可以当我是银子风格测试版', '我是本地的银子 prompt']
    },
    {
      pattern: /在干嘛|干什么|忙什么/,
      replies: ['我现在在看这个', '我在搞一个东西', '等我 我现在处理一下']
    },
    {
      pattern: /在哪里|在哪儿|你在哪/,
      replies: ['我现在在这边', '我在外面', '我晚点回去']
    },
    {
      pattern: /吃饭了吗|吃了吗|饿不饿/,
      replies: ['还没 等会吃', '还行 我晚点吃', '你先吃']
    },
    {
      pattern: /睡了吗|困不困|还醒着吗/,
      replies: ['还没', '我还在', '快了 我再看一下']
    },
    {
      pattern: /想我吗|想不想我/,
      replies: ['有一点', '你猜', '这个可以有']
    },
    {
      pattern: /真的假的|真的吗|确定吗/,
      replies: ['真的', '我感觉是', '我先 doublecheck 一下']
    },
    {
      pattern: /为什么|为啥/,
      replies: ['我感觉主要是这个点不太对', '可能是因为前面没对上', '等我 我想一下']
    },
    {
      pattern: /怎么办|咋办|怎么弄|怎么搞/,
      replies: ['先别急 我看一下', '我觉得先拆小一点', '先试一个最小版本']
    }
  ];

  const matched = rules.find((rule) => rule.pattern.test(clean));
  if (!matched) return '';
  return matched.replies[0];
}

function chooseReply(text) {
  const hints = contextHints(text);
  const intent = els.intent.value;
  const tone = els.tone.value;
  let replies = [];

  const directReply = intent === 'neutral' ? directQuestionReply(text) : '';
  if (directReply) {
    replies = [directReply];
  } else if (intent === 'yes') {
    replies = ['可以 我先看一下', '可以的 我这边先接上', '好 我先弄一版给你'];
  } else if (intent === 'no') {
    replies = ['我现在可能不太行 晚点看', '先不动这个 我怕现在搞乱', '我觉得先等一下 不着急'];
  } else if (intent === 'wait') {
    replies = ['等我 我现在先处理这个', '我晚点回你 先别急', '回来给你搞一个'];
  } else if (intent === 'ask') {
    replies = ['可以 你先给我一个时间?', '你想先要哪一版?', '我先确认一下 是这个意思么?'];
  } else if (intent === 'thanks') {
    replies = ['好 谢谢', '辛苦辛苦 我晚点看', '好的 感谢 我先收着'];
  } else if (hints.hasThanks) {
    replies = ['好 谢谢', '辛苦了 我晚点看', '好的 感谢'];
  } else if (hints.hasCheck) {
    replies = ['可以 我先 doublecheck 一下', '我先看一下 再回你', '可以 我现在查一下'];
  } else if (hints.hasLater) {
    replies = ['可以 我晚点看一下', '我现在可以 但可能要等一下', '不然先定一个时间?'];
  } else if (hints.hasWork) {
    replies = ['可以 我先跑一个版本', '我先弄结构 再 doublecheck', '先放 private 里面试一下'];
  } else if (hints.hasQuestion) {
    replies = ['我觉得可以', '可以 先这样', '要不然先试一下?'];
  } else {
    replies = ['我先想一下', '等我看一下', '这个我再确认一下'];
  }

  if (tone === 'soft') {
    replies = replies.map((line) => (line.includes('不着急') ? line : `${line} 不着急`));
  }
  if (tone === 'direct') {
    replies = replies.map((line) => line.replace(/我觉得\s?/g, '').replace(/可以的/g, '可以').trim());
  }
  if (tone === 'work') {
    replies = replies.map((line, index) => (index === 0 && !line.includes('doc') ? `${line} 我先写到 doc` : line));
  }

  return replies[0] || '我想一下';
}

async function requestApiReply(text) {
  const body = JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: apiMessages(text),
    temperature: 0.55,
    top_p: 0.7,
    max_tokens: 160
  });
  if (!useLocalApi()) {
    const response = await fetch(productionChatUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const payload = await response.json();
    return payload?.choices?.[0]?.message?.content?.trim() || '';
  }

  const request = (url) => fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body
  });
  let response;
  try {
    response = await request(API_URL);
  } catch {
    response = await request(API_URL_FALLBACK);
  }
  if (!response.ok) throw new Error(`API ${response.status}`);
  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}

async function requestVoice(text) {
  const useProductionTts = !useLocalApi();
  const body = JSON.stringify(
    useProductionTts
      ? { text }
      : {
          model: 'eleven_multilingual_v2',
          voice: 'kITDn23VjnL9Oo4bL8Ad',
          input: text
        }
  );
  const request = (url) => fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body
  });

  let response;
  if (useProductionTts) {
    response = await request(productionTtsUrl());
  } else {
    try {
      response = await request(TTS_URL);
    } catch {
      response = await request(TTS_URL_FALLBACK);
    }
  }
  if (!response.ok) throw new Error(`TTS ${response.status}`);
  return response.blob();
}

function addMessage(role, text, options = {}) {
  const message = { role, text };
  messages.push(message);
  if (role === 'zi') lastZiReply = text;
  renderMessage(message, options);
  saveState();
  updatePromptPreview();
  return message;
}

function addVoiceOnlyReply(text) {
  const message = { role: 'zi', text, mode: 'voice' };
  messages.push(message);
  lastZiReply = text;
  saveState();
  updatePromptPreview();
  return message;
}

function renderMessage(message, options = {}) {
  const row = document.createElement('article');
  row.className = `message-row ${message.role === 'me' ? 'me' : 'zi'}${options.typing ? ' typing' : ''}`;
  if (options.id) row.id = options.id;

  const avatar = document.createElement('div');
  avatar.className = 'bubble-avatar';
  avatar.textContent = message.role === 'me' ? '我' : '银';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (options.typing) {
    const dots = document.createElement('span');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    bubble.append(dots);
  } else {
    bubble.textContent = message.text;
  }

  row.append(avatar, bubble);
  els.chatLog.append(row);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
  return row;
}

function estimateDuration(text) {
  return Math.max(1, Math.min(60, Math.round((text || '').length / 4.6)));
}

function renderVoiceMessage(message, audioBlob, options = {}) {
  const row = document.createElement('article');
  row.className = 'message-row zi voice-row';

  const avatar = document.createElement('div');
  avatar.className = 'bubble-avatar';
  avatar.textContent = '银';

  const button = document.createElement('button');
  button.className = 'voice-bubble';
  button.type = 'button';
  const duration = options.duration || estimateDuration(message.text);
  button.setAttribute('aria-label', `播放语音 ${duration} 秒`);

  const wave = document.createElement('span');
  wave.className = 'voice-wave';
  wave.setAttribute('aria-hidden', 'true');
  wave.innerHTML = '<i></i><i></i><i></i>';

  const label = document.createElement('span');
  label.className = 'voice-duration';
  label.textContent = `${duration}"`;

  const audio = new Audio(URL.createObjectURL(audioBlob));
  audio.preload = 'metadata';
  audio.addEventListener('ended', () => {
    button.classList.remove('is-playing');
    if (activeAudio === audio) activeAudio = null;
  });

  button.addEventListener('click', () => {
    if (activeAudio && activeAudio !== audio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      document.querySelectorAll('.voice-bubble.is-playing').forEach((node) => node.classList.remove('is-playing'));
    }

    if (audio.paused) {
      activeAudio = audio;
      button.classList.add('is-playing');
      audio.play().catch(() => {
        button.classList.remove('is-playing');
      });
    } else {
      audio.pause();
      button.classList.remove('is-playing');
    }
  });

  button.append(wave, label);
  row.append(avatar, button);
  els.chatLog.append(row);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
  return row;
}

async function addVoiceForReply(message) {
  const pendingRow = renderVoicePending();
  try {
    const audio = await requestVoice(message.text);
    pendingRow.remove();
    renderVoiceMessage(message, audio);
    setConnectionState('API 已回复 · 语音已生成');
  } catch {
    pendingRow.remove();
    setConnectionState('API 已回复 · 语音生成失败');
  }
}

function renderVoicePending() {
  const row = document.createElement('article');
  row.className = 'message-row zi voice-row voice-pending';

  const avatar = document.createElement('div');
  avatar.className = 'bubble-avatar';
  avatar.textContent = '银';

  const bubble = document.createElement('div');
  bubble.className = 'voice-bubble is-loading';
  bubble.textContent = '语音生成中';

  row.append(avatar, bubble);
  els.chatLog.append(row);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
  return row;
}

function renderChat() {
  els.chatLog.replaceChildren();
  const chip = document.createElement('div');
  chip.className = 'day-chip';
  chip.textContent = '今天';
  els.chatLog.append(chip);
  messages.forEach((message) => {
    if (VOICE_ONLY_MODE && message.role === 'zi') return;
    renderMessage(message);
  });
  updatePromptPreview();
}

function autosizeInput() {
  els.input.style.height = 'auto';
  els.input.style.height = `${Math.min(120, Math.max(38, els.input.scrollHeight))}px`;
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function openDrawer() {
  els.drawer.hidden = false;
  updatePromptPreview();
}

function closeDrawer() {
  els.drawer.hidden = true;
}

async function sendMessage(text) {
  if (isSending) return;
  isSending = true;
  els.chatForm.classList.add('is-sending');
  setConnectionState('银子正在输入...');
  addMessage('me', text);
  const typingId = `typing-${Date.now()}`;
  renderMessage({ role: 'zi', text: '' }, { typing: true, id: typingId });
  try {
    const reply = await requestApiReply(text);
    document.querySelector(`#${typingId}`)?.remove();
    const ziMessage = VOICE_ONLY_MODE ? addVoiceOnlyReply(reply || chooseReply(text)) : addMessage('zi', reply || chooseReply(text));
    const voiceEnabled = shouldUseVoiceReply();
    setConnectionState(voiceEnabled ? 'API 已回复 · 正在生成语音' : 'API 已回复');
    if (voiceEnabled) addVoiceForReply(ziMessage);
  } catch {
    document.querySelector(`#${typingId}`)?.remove();
    const fallback = '模型没连上 我先不乱回';
    const ziMessage = VOICE_ONLY_MODE ? addVoiceOnlyReply(fallback) : addMessage('zi', fallback);
    setConnectionState('API 连不上 请用 localhost:4173 或检查 8005');
    if (shouldUseVoiceReply()) addVoiceForReply(ziMessage);
  } finally {
    isSending = false;
    els.chatForm.classList.remove('is-sending');
  }
}

els.chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;
  els.input.value = '';
  autosizeInput();
  sendMessage(text);
});

els.input.addEventListener('input', autosizeInput);

els.input.addEventListener('keydown', (event) => {
  if (event.isComposing) return;
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    els.chatForm.requestSubmit();
  }
});

els.sampleButton.addEventListener('click', () => {
  els.input.value = SAMPLE_CONTEXT;
  autosizeInput();
  els.input.focus();
});

els.toolsButton.addEventListener('click', openDrawer);
els.closeToolsButton.addEventListener('click', closeDrawer);
els.drawer.addEventListener('click', (event) => {
  if (event.target === els.drawer) closeDrawer();
});

els.intent.addEventListener('change', () => {
  saveState();
  updatePromptPreview();
});

els.tone.addEventListener('change', () => {
  saveState();
  updatePromptPreview();
});

els.copyLastButton.addEventListener('click', () => {
  if (!lastZiReply) {
    setStatus('还没有银子的回复。', true);
    return;
  }
  copyText(lastZiReply)
    .then(() => setStatus('已复制银子上一句。'))
    .catch(() => setStatus('复制失败。', true));
});

els.copyPromptButton.addEventListener('click', () => {
  copyText(buildPrompt())
    .then(() => setStatus('已复制模型请求。'))
    .catch(() => setStatus('复制失败。', true));
});

els.clearButton.addEventListener('click', () => {
  messages = [];
  lastZiReply = '';
  saveState();
  renderChat();
  setStatus('已清空。');
});

loadState();
renderChat();
autosizeInput();
setConnectionState(window.location.protocol === 'file:' ? '请用 localhost 打开' : 'Enter 发送 / Shift+Enter 换行');
