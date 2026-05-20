const API_PATH = '/api/zapp-live-call/signaling';
const CLIENT_KEY = 'zappLiveCall:clientId';
const NAME_KEY = 'zappLiveCall:name';

const els = {
  acceptButton: document.querySelector('#acceptButton'),
  callButton: document.querySelector('#callButton'),
  callPanel: document.querySelector('#callPanel'),
  callState: document.querySelector('#callState'),
  callTimer: document.querySelector('#callTimer'),
  chatForm: document.querySelector('#chatForm'),
  chatLog: document.querySelector('#chatLog'),
  copyLinkButton: document.querySelector('#copyLinkButton'),
  declineButton: document.querySelector('#declineButton'),
  hangupButton: document.querySelector('#hangupButton'),
  incomingName: document.querySelector('#incomingName'),
  incomingPanel: document.querySelector('#incomingPanel'),
  messageInput: document.querySelector('#messageInput'),
  muteButton: document.querySelector('#muteButton'),
  remoteAudio: document.querySelector('#remoteAudio'),
  roomLabel: document.querySelector('#roomLabel'),
  statusText: document.querySelector('#statusText')
};

let roomId = '';
let clientId = localStorage.getItem(CLIENT_KEY) || crypto.randomUUID();
let displayName = localStorage.getItem(NAME_KEY) || `Zi-${clientId.slice(0, 4)}`;
let lastSeq = 0;
let pollTimer = null;
let peer = null;
let localStream = null;
let pendingOffer = null;
let pendingIceCandidates = [];
let callStartedAt = 0;
let callClock = null;
let isMuted = false;

localStorage.setItem(CLIENT_KEY, clientId);
localStorage.setItem(NAME_KEY, displayName);

function apiUrl(params = {}) {
  const url = new URL(API_PATH, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  }
  return url.href;
}

function setStatus(text) {
  els.statusText.textContent = text;
}

function roomFromLocation() {
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return (params.get('room') || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

function setRoom(nextRoom) {
  roomId = nextRoom;
  els.roomLabel.textContent = roomId;
  const params = new URLSearchParams();
  params.set('room', roomId);
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${params.toString()}`);
}

function appendSystem(text) {
  const node = document.createElement('div');
  node.className = 'system-chip';
  node.textContent = text;
  els.chatLog.append(node);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function appendMessage({ mine = false, name = '对方', text }) {
  const row = document.createElement('div');
  row.className = `message-row${mine ? ' me' : ''}`;

  const avatar = document.createElement('div');
  avatar.className = 'bubble-avatar';
  avatar.textContent = mine ? '我' : name.slice(0, 1).toUpperCase();

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  row.append(avatar, bubble);
  els.chatLog.append(row);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

async function sendSignal(type, payload = {}) {
  const response = await fetch(apiUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ roomId, clientId, name: displayName, type, payload })
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'Signal failed');
  if (!roomId) setRoom(data.roomId);
  return data;
}

async function poll() {
  if (!roomId) return;
  try {
    const response = await fetch(apiUrl({ roomId, clientId, after: lastSeq }), { cache: 'no-store' });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Poll failed');
    for (const event of data.events) {
      lastSeq = Math.max(lastSeq, event.seq);
      await handleEvent(event);
    }
    setStatus(data.peers.length > 1 ? `${data.peers.length} 人在线` : '等对方打开链接');
  } catch (error) {
    setStatus('连接重试中');
  }
}

function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(poll, 1200);
  poll();
}

async function createPeer() {
  if (peer) return peer;

  peer = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  peer.onicecandidate = (event) => {
    if (event.candidate) sendSignal('ice', { candidate: event.candidate }).catch(() => {});
  };

  peer.ontrack = (event) => {
    els.remoteAudio.srcObject = event.streams[0];
    markCallConnected();
  };

  peer.onconnectionstatechange = () => {
    if (['failed', 'closed', 'disconnected'].includes(peer.connectionState)) endCall(false);
    if (peer.connectionState === 'connected') markCallConnected();
  };

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  for (const track of localStream.getTracks()) peer.addTrack(track, localStream);
  await flushPendingIce();
  return peer;
}

async function flushPendingIce() {
  if (!peer?.remoteDescription || !pendingIceCandidates.length) return;
  const candidates = pendingIceCandidates;
  pendingIceCandidates = [];
  for (const candidate of candidates) {
    try {
      await peer.addIceCandidate(candidate);
    } catch {}
  }
}

function showCallPanel(text) {
  els.callPanel.hidden = false;
  els.callState.textContent = text;
}

function hideIncoming() {
  els.incomingPanel.hidden = true;
  pendingOffer = null;
}

function startClock() {
  clearInterval(callClock);
  callStartedAt = Date.now();
  callClock = setInterval(() => {
    const elapsed = Math.floor((Date.now() - callStartedAt) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    els.callTimer.textContent = `${minutes}:${seconds}`;
  }, 500);
}

function markCallConnected() {
  if (!callStartedAt) startClock();
  showCallPanel('通话中');
}

async function startCall() {
  if (!navigator.mediaDevices?.getUserMedia) {
    appendSystem('当前浏览器不支持麦克风通话');
    return;
  }

  try {
    showCallPanel('正在呼叫');
    const pc = await createPeer();
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    await sendSignal('ring', { state: 'calling' });
    await sendSignal('offer', { sdp: pc.localDescription });
  } catch (error) {
    appendSystem('发起通话失败，请检查麦克风权限');
    endCall(false);
  }
}

async function acceptCall() {
  if (!pendingOffer) return;

  try {
    const pc = await createPeer();
    await pc.setRemoteDescription(pendingOffer.payload.sdp);
    await flushPendingIce();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendSignal('answer', { sdp: pc.localDescription });
    hideIncoming();
    showCallPanel('接通中');
  } catch (error) {
    appendSystem('接听失败，请检查麦克风权限');
    endCall(true);
  }
}

function endCall(send = true) {
  clearInterval(callClock);
  callClock = null;
  callStartedAt = 0;
  els.callTimer.textContent = '00:00';
  els.callPanel.hidden = true;
  hideIncoming();

  if (peer) {
    peer.onicecandidate = null;
    peer.ontrack = null;
    peer.close();
    peer = null;
  }
  pendingIceCandidates = [];

  if (localStream) {
    for (const track of localStream.getTracks()) track.stop();
    localStream = null;
  }

  els.remoteAudio.srcObject = null;
  isMuted = false;
  els.muteButton.textContent = '静音';
  if (send) sendSignal('hangup', { state: 'ended' }).catch(() => {});
}

async function handleEvent(event) {
  if (event.type === 'chat') {
    appendMessage({ mine: false, name: event.name, text: event.payload.text });
    return;
  }

  if (event.type === 'join') {
    appendSystem(`${event.name || '对方'} 进入房间`);
    return;
  }

  if (event.type === 'ring') {
    appendSystem(`${event.name || '对方'} 正在呼叫`);
    return;
  }

  if (event.type === 'offer') {
    pendingOffer = event;
    els.incomingName.textContent = event.name || '对方';
    els.incomingPanel.hidden = false;
    return;
  }

  if (event.type === 'answer' && peer) {
    await peer.setRemoteDescription(event.payload.sdp);
    await flushPendingIce();
    showCallPanel('接通中');
    return;
  }

  if (event.type === 'ice' && event.payload.candidate) {
    if (!peer?.remoteDescription) {
      pendingIceCandidates.push(event.payload.candidate);
      return;
    }
    try {
      await peer.addIceCandidate(event.payload.candidate);
    } catch {}
    return;
  }

  if (event.type === 'hangup') {
    appendSystem(`${event.name || '对方'} 已挂断`);
    endCall(false);
  }
}

async function boot() {
  const existingRoom = roomFromLocation();
  if (existingRoom) {
    setRoom(existingRoom);
  } else {
    const data = await sendSignal('join', { state: 'new' });
    setRoom(data.roomId);
  }
  appendSystem('复制房间链接给另一台设备即可聊天或语音通话');
  await sendSignal('join', { state: 'online' });
  startPolling();
}

els.chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = els.messageInput.value.trim();
  if (!text) return;
  els.messageInput.value = '';
  appendMessage({ mine: true, name: displayName, text });
  try {
    await sendSignal('chat', { text });
  } catch {
    appendSystem('消息发送失败');
  }
});

els.messageInput.addEventListener('input', () => {
  els.messageInput.style.height = 'auto';
  els.messageInput.style.height = `${Math.min(130, els.messageInput.scrollHeight)}px`;
});

els.copyLinkButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(window.location.href);
  appendSystem('已复制房间链接');
});

els.callButton.addEventListener('click', startCall);
els.acceptButton.addEventListener('click', acceptCall);
els.declineButton.addEventListener('click', () => {
  hideIncoming();
  sendSignal('hangup', { state: 'declined' }).catch(() => {});
});
els.hangupButton.addEventListener('click', () => endCall(true));
els.muteButton.addEventListener('click', () => {
  if (!localStream) return;
  isMuted = !isMuted;
  for (const track of localStream.getAudioTracks()) track.enabled = !isMuted;
  els.muteButton.textContent = isMuted ? '取消静音' : '静音';
});

window.addEventListener('beforeunload', () => {
  navigator.sendBeacon?.(
    apiUrl(),
    new Blob([JSON.stringify({ roomId, clientId, name: displayName, type: 'leave', payload: { state: 'offline' } })], {
      type: 'application/json'
    })
  );
});

boot().catch(() => {
  setStatus('连接失败');
  appendSystem('实时服务暂时不可用');
});
