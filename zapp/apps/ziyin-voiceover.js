const MAX_CHARS = 4500;
const SAMPLE_TEXT = '我先用这句话试一下，听听是不是像我平时发微信语音的状态。';
const STORAGE_KEYS = {
  lastText: 'ziyinVoiceover:lastText'
};

const els = {
  audioMeta: document.querySelector('#audioMeta'),
  audioPlayer: document.querySelector('#audioPlayer'),
  charCount: document.querySelector('#charCount'),
  clearButton: document.querySelector('#clearButton'),
  connectionState: document.querySelector('#connectionState'),
  downloadLink: document.querySelector('#downloadLink'),
  form: document.querySelector('#voiceForm'),
  generateButton: document.querySelector('#generateButton'),
  outputTitle: document.querySelector('#outputTitle'),
  playerEmpty: document.querySelector('#playerEmpty'),
  sampleButton: document.querySelector('#sampleButton'),
  shareButton: document.querySelector('#shareButton'),
  statusLine: document.querySelector('#statusLine'),
  text: document.querySelector('#scriptText')
};

let currentAudioUrl = '';
let currentAudioBlob = null;

function defaultApiUrl() {
  return new URL('../../api/ziyin-voiceover/generate', window.location.href).href;
}

function stamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('');
}

function setBusy(isBusy) {
  els.generateButton.disabled = isBusy;
  els.sampleButton.disabled = isBusy;
  els.clearButton.disabled = isBusy;
  els.connectionState.textContent = isBusy ? 'Generating' : 'Ready';
  els.generateButton.textContent = isBusy ? '生成中' : '生成音频';
  els.playerEmpty.classList.toggle('is-loading', isBusy);
}

function setStatus(message, isError = false) {
  els.statusLine.textContent = message;
  els.statusLine.classList.toggle('is-error', isError);
}

function updateCharCount() {
  const count = els.text.value.length;
  els.charCount.textContent = `${count} / ${MAX_CHARS}`;
  els.charCount.style.color = count > MAX_CHARS * 0.92 ? 'var(--signal)' : '';
}

function resetAudio() {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
  }
  currentAudioUrl = '';
  currentAudioBlob = null;
  els.audioPlayer.hidden = true;
  els.audioPlayer.removeAttribute('src');
  els.downloadLink.hidden = true;
  els.shareButton.hidden = true;
  els.playerEmpty.hidden = false;
  els.outputTitle.textContent = '等待生成';
  els.audioMeta.textContent = '--';
}

function loadState() {
  els.text.value = localStorage.getItem(STORAGE_KEYS.lastText) || '';
  updateCharCount();
}

async function parseError(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null);
    return payload?.error || payload?.detail || `请求失败：${response.status}`;
  }
  return (await response.text().catch(() => '')) || `请求失败：${response.status}`;
}

async function generateAudio(text) {
  const headers = { 'content-type': 'application/json' };

  const response = await fetch(defaultApiUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  return response.blob();
}

function showAudio(blob, text) {
  resetAudio();
  currentAudioBlob = blob;
  currentAudioUrl = URL.createObjectURL(blob);

  const filename = `ziyin_voiceover_${stamp()}.mp3`;
  els.audioPlayer.src = currentAudioUrl;
  els.audioPlayer.hidden = false;
  els.downloadLink.href = currentAudioUrl;
  els.downloadLink.download = filename;
  els.downloadLink.hidden = false;
  els.shareButton.hidden = !navigator.share || !navigator.canShare;
  els.playerEmpty.hidden = true;
  els.outputTitle.textContent = '已生成';
  els.audioMeta.textContent = `${Math.max(1, Math.round(blob.size / 1024))} KB`;

  localStorage.setItem(STORAGE_KEYS.lastText, text);
  els.audioPlayer.play().catch(() => {});
}

async function shareAudio() {
  if (!currentAudioBlob || !navigator.share) return;
  const file = new File([currentAudioBlob], `ziyin_voiceover_${stamp()}.mp3`, { type: 'audio/mpeg' });
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return;
  await navigator.share({ files: [file], title: 'ZiYin Voiceover' });
}

els.text.addEventListener('input', () => {
  updateCharCount();
  localStorage.setItem(STORAGE_KEYS.lastText, els.text.value);
});

els.sampleButton.addEventListener('click', () => {
  els.text.value = SAMPLE_TEXT;
  updateCharCount();
  localStorage.setItem(STORAGE_KEYS.lastText, els.text.value);
  els.text.focus();
});

els.shareButton.addEventListener('click', () => {
  shareAudio().catch((error) => setStatus(error.message || '分享失败。', true));
});

els.clearButton.addEventListener('click', () => {
  els.text.value = '';
  localStorage.removeItem(STORAGE_KEYS.lastText);
  updateCharCount();
  resetAudio();
  setStatus('');
  els.text.focus();
});

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = els.text.value.trim();
  if (!text) {
    setStatus('先输入文字。', true);
    els.text.focus();
    return;
  }
  if (text.length > MAX_CHARS) {
    setStatus(`最多 ${MAX_CHARS} 字。`, true);
    return;
  }

  setBusy(true);
  setStatus('正在生成。');
  els.outputTitle.textContent = '生成中';
  els.audioMeta.textContent = '--';

  try {
    const blob = await generateAudio(text);
    showAudio(blob, text);
    setStatus('生成完成。');
  } catch (error) {
    resetAudio();
    setStatus(error.message || '生成失败。', true);
  } finally {
    setBusy(false);
  }
});

loadState();
