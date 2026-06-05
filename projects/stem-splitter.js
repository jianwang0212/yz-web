const STORAGE_KEYS = {
  artist: "stemSplitter:artist",
  title: "stemSplitter:title"
};

const els = {
  artistName: document.querySelector("#artistName"),
  audioFile: document.querySelector("#audioFile"),
  bgmAudio: document.querySelector("#bgmAudio"),
  bgmDownload: document.querySelector("#bgmDownload"),
  bgmTrack: document.querySelector("#bgmTrack"),
  dropZone: document.querySelector("#dropZone"),
  engineState: document.querySelector("#engineState"),
  fileMeta: document.querySelector("#fileMeta"),
  fileName: document.querySelector("#fileName"),
  form: document.querySelector("#stemForm"),
  globalSeek: document.querySelector("#globalSeek"),
  globalSeekSlider: document.querySelector("#globalSeekSlider"),
  globalSeekTime: document.querySelector("#globalSeekTime"),
  jobBadge: document.querySelector("#jobBadge"),
  openFolderButton: document.querySelector("#openFolderButton"),
  originalAudio: document.querySelector("#originalAudio"),
  originalDownload: document.querySelector("#originalDownload"),
  originalPlay: document.querySelector("#originalPlay"),
  originalTrack: document.querySelector("#originalTrack"),
  outputTitle: document.querySelector("#outputTitle"),
  resetButton: document.querySelector("#resetButton"),
  songMeta: document.querySelector("#songMeta"),
  songTitle: document.querySelector("#songTitle"),
  splitButton: document.querySelector("#splitButton"),
  statusLine: document.querySelector("#statusLine"),
  vocalAudio: document.querySelector("#vocalAudio"),
  vocalDownload: document.querySelector("#vocalDownload"),
  vocalPlay: document.querySelector("#vocalPlay"),
  vocalTrack: document.querySelector("#vocalTrack"),
  bgmPlay: document.querySelector("#bgmPlay"),
  youtubeButton: document.querySelector("#youtubeButton")
};

let selectedFile = null;
let originalObjectUrl = "";
let apiReady = false;
let currentJobId = "";
let activeAudio = null;
const LOCAL_API_ORIGIN = "http://127.0.0.1:4173";

function apiOrigin() {
  const isLocalStemServer =
    ["127.0.0.1", "localhost"].includes(window.location.hostname) && window.location.port === "4173";
  return isLocalStemServer ? window.location.origin : LOCAL_API_ORIGIN;
}

function apiUrl(path) {
  return new URL(path, apiOrigin()).href;
}

function outputUrl(path) {
  return new URL(path, apiOrigin()).href;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "--";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size >= 10 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function stamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
}

function updateSongMeta() {
  const title = els.songTitle.value.trim() || "Untitled";
  const artist = els.artistName.value.trim();
  els.songMeta.textContent = artist ? `${title} / ${artist}` : title;
  localStorage.setItem(STORAGE_KEYS.title, els.songTitle.value);
  localStorage.setItem(STORAGE_KEYS.artist, els.artistName.value);
}

function setStatus(message, isError = false) {
  els.statusLine.textContent = message;
  els.statusLine.classList.toggle("is-error", isError);
}

function setBusy(isBusy) {
  els.splitButton.disabled = isBusy;
  els.resetButton.disabled = isBusy;
  els.audioFile.disabled = isBusy;
  els.splitButton.textContent = isBusy ? "分离中" : "分离 Stems";
}

function setTrack(track, audio, download, state, url = "", filename = "") {
  const playButton = track.querySelector(".track-play-button");
  track.dataset.state = state;
  audio.hidden = true;
  download.hidden = !url;
  if (playButton) playButton.hidden = !url;
  if (url) {
    audio.src = url;
    download.href = url;
    download.download = filename;
    audio.load();
  } else {
    audio.pause();
    audio.removeAttribute("src");
    download.removeAttribute("href");
    if (playButton) playButton.textContent = "播放";
    if (audio === activeAudio) activeAudio = null;
  }
  syncGlobalSeek();
}

function getOutputAudios() {
  return [els.originalAudio, els.vocalAudio, els.bgmAudio].filter((audio) => audio.src);
}

function getGlobalDuration() {
  return Math.max(0, ...getOutputAudios().map((audio) => (Number.isFinite(audio.duration) ? audio.duration : 0)));
}

function getReferenceAudio() {
  return activeAudio && activeAudio.src ? activeAudio : getOutputAudios()[0] || null;
}

function updatePlayButtons() {
  [
    [els.originalAudio, els.originalPlay],
    [els.vocalAudio, els.vocalPlay],
    [els.bgmAudio, els.bgmPlay]
  ].forEach(([audio, button]) => {
    if (!button || button.hidden) return;
    button.textContent = audio.paused ? "播放" : "暂停";
  });
}

function syncGlobalSeek() {
  const audios = getOutputAudios();
  els.globalSeek.hidden = !audios.length;
  const duration = getGlobalDuration();
  const referenceAudio = getReferenceAudio();
  const currentTime = referenceAudio ? referenceAudio.currentTime : 0;
  if (!duration) {
    els.globalSeekSlider.value = "0";
    els.globalSeekTime.textContent = "0:00 / --";
    return;
  }
  els.globalSeekSlider.value = String(Math.round((currentTime / duration) * 1000));
  els.globalSeekTime.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
}

function setAllAudioTimes(seconds) {
  getOutputAudios().forEach((audio) => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(seconds, audio.duration);
    }
  });
  syncGlobalSeek();
}

function bindTrackAudio(audio) {
  ["loadedmetadata", "durationchange", "timeupdate", "seeked"].forEach((eventName) => {
    audio.addEventListener(eventName, () => {
      if (!activeAudio || audio === activeAudio) syncGlobalSeek();
    });
  });
  audio.addEventListener("play", () => {
    activeAudio = audio;
    getOutputAudios().forEach((otherAudio) => {
      if (otherAudio !== audio) otherAudio.pause();
    });
    updatePlayButtons();
    syncGlobalSeek();
  });
  ["pause", "ended"].forEach((eventName) => {
    audio.addEventListener(eventName, updatePlayButtons);
  });
}

async function toggleAudio(audio) {
  activeAudio = audio;
  if (audio.paused) {
    await audio.play();
  } else {
    audio.pause();
  }
  updatePlayButtons();
  syncGlobalSeek();
}

function showJobOutputs(payload) {
  if (!payload?.outputs) return;
  const cacheBust = `?t=${Date.now()}`;
  selectedFile = null;
  if (payload.title) els.songTitle.value = payload.title;
  if (payload.artist) els.artistName.value = payload.artist;
  updateSongMeta();
  setTrack(
    els.originalTrack,
    els.originalAudio,
    els.originalDownload,
    "ready",
    outputUrl(payload.outputs.original) + cacheBust,
    "original.mp3"
  );
  setTrack(
    els.vocalTrack,
    els.vocalAudio,
    els.vocalDownload,
    "ready",
    outputUrl(payload.outputs.vocals) + cacheBust,
    "vocals.mp3"
  );
  setTrack(
    els.bgmTrack,
    els.bgmAudio,
    els.bgmDownload,
    "ready",
    outputUrl(payload.outputs.bgm) + cacheBust,
    "bgm.mp3"
  );
  els.outputTitle.textContent = "Stems ready";
  els.jobBadge.textContent = payload.jobId || "loaded";
  els.openFolderButton.hidden = !payload.jobId;
  currentJobId = payload.jobId || "";
  els.fileName.textContent = "Loaded output";
  els.fileMeta.textContent = payload.folder || "original + vocals + bgm";
  setStatus("Loaded.");
}

async function openOutputFolder() {
  if (!currentJobId) return;
  try {
    const response = await fetch(apiUrl("/api/stem-split/open-folder"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: currentJobId })
    });
    if (!response.ok) throw new Error(await parseError(response));
    const payload = await response.json();
    setStatus(`Opened: ${payload.folder}`);
  } catch (error) {
    setStatus(error.message || "打开文件夹失败。", true);
  }
}

async function loadJobFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("job");
  if (!jobId || !/^[\p{L}\p{N}._-]+$/u.test(jobId)) return;
  try {
    const response = await fetch(outputUrl(`/stem-splitter-output/${jobId}/manifest.json?t=${Date.now()}`), {
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Job not found: ${jobId}`);
    const payload = await response.json();
    showJobOutputs(payload);
  } catch (error) {
    setStatus(error.message || "加载输出失败。", true);
  }
}

function resetOutputs(keepOriginal = false) {
  if (!keepOriginal && originalObjectUrl) {
    URL.revokeObjectURL(originalObjectUrl);
    originalObjectUrl = "";
  }
  if (!keepOriginal) {
    setTrack(els.originalTrack, els.originalAudio, els.originalDownload, "empty");
  }
  setTrack(els.vocalTrack, els.vocalAudio, els.vocalDownload, "empty");
  setTrack(els.bgmTrack, els.bgmAudio, els.bgmDownload, "empty");
  els.outputTitle.textContent = selectedFile ? "等待分离" : "等待音频";
  els.jobBadge.textContent = "--";
  els.openFolderButton.hidden = true;
  currentJobId = "";
}

function showOriginal(file) {
  if (originalObjectUrl) URL.revokeObjectURL(originalObjectUrl);
  originalObjectUrl = URL.createObjectURL(file);
  const extension = file.name.split(".").pop() || "mp3";
  const safeTitle = (els.songTitle.value.trim() || "original").replace(/[^\p{L}\p{N}]+/gu, "_");
  setTrack(els.originalTrack, els.originalAudio, els.originalDownload, "ready", originalObjectUrl, `${safeTitle}_original.${extension}`);
  els.outputTitle.textContent = "Original ready";
  els.jobBadge.textContent = formatBytes(file.size);
}

function handleFile(file) {
  selectedFile = file;
  els.fileName.textContent = file.name;
  els.fileMeta.textContent = `${formatBytes(file.size)} · ${file.type || "audio"}`;
  showOriginal(file);
  setStatus(apiReady ? "Local engine ready." : "Original loaded. Local engine offline.");
  resetOutputs(true);
}

function openYoutubeSearch() {
  const query = encodeURIComponent(`${els.songTitle.value.trim()} ${els.artistName.value.trim()} official audio youtube`);
  window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank", "noopener,noreferrer");
}

async function parseError(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    return payload?.error || payload?.detail || `请求失败：${response.status}`;
  }
  return (await response.text().catch(() => "")) || `请求失败：${response.status}`;
}

async function checkHealth() {
  try {
    const response = await fetch(apiUrl(`/api/stem-split/health?t=${Date.now()}`), { cache: "no-store" });
    if (!response.ok) throw new Error("offline");
    const payload = await response.json();
    apiReady = Boolean(payload.demucsAvailable && payload.ffmpegAvailable);
    els.engineState.textContent = apiReady ? "Ready" : "Setup";
    setStatus(apiReady ? "Local engine ready." : "Install Demucs + ffmpeg for separation.");
  } catch {
    apiReady = false;
    els.engineState.textContent = "Offline";
    setStatus("Local API offline. Start Stem Splitter on 127.0.0.1:4173.");
  }
}

async function splitStems() {
  if (!selectedFile) {
    setStatus("请选择本地音频。", true);
    return;
  }

  setBusy(true);
  setStatus("Processing.");
  els.outputTitle.textContent = "Separating";
  els.jobBadge.textContent = "running";
  els.vocalTrack.dataset.state = "processing";
  els.bgmTrack.dataset.state = "processing";

  const body = new FormData();
  body.append("title", els.songTitle.value.trim());
  body.append("artist", els.artistName.value.trim());
  body.append("engine", "demucs");
  body.append("audio", selectedFile, selectedFile.name);

  try {
    const response = await fetch(apiUrl("/api/stem-split/jobs"), { method: "POST", body });
    if (!response.ok) throw new Error(await parseError(response));
    const payload = await response.json();
    const cacheBust = `?t=${Date.now()}`;

    setTrack(els.originalTrack, els.originalAudio, els.originalDownload, "ready", payload.outputs.original + cacheBust, "original.mp3");
    setTrack(els.vocalTrack, els.vocalAudio, els.vocalDownload, "ready", payload.outputs.vocals + cacheBust, "vocals.mp3");
    setTrack(els.bgmTrack, els.bgmAudio, els.bgmDownload, "ready", payload.outputs.bgm + cacheBust, "bgm.mp3");

    els.outputTitle.textContent = "Stems ready";
    els.jobBadge.textContent = payload.jobId || stamp();
    els.openFolderButton.hidden = !payload.jobId;
    currentJobId = payload.jobId || "";
    setStatus("Done.");
  } catch (error) {
    els.vocalTrack.dataset.state = "empty";
    els.bgmTrack.dataset.state = "empty";
    els.outputTitle.textContent = "Original ready";
    els.jobBadge.textContent = selectedFile ? formatBytes(selectedFile.size) : "--";
    els.openFolderButton.hidden = true;
    currentJobId = "";
    setStatus(error.message || "分离失败。", true);
  } finally {
    setBusy(false);
  }
}

function resetForm() {
  selectedFile = null;
  els.songTitle.value = "喜剧之王";
  els.artistName.value = "李荣浩";
  els.audioFile.value = "";
  els.fileName.textContent = "选择 MP3 / WAV / M4A";
  els.fileMeta.textContent = "本地文件";
  updateSongMeta();
  resetOutputs();
  setStatus(apiReady ? "Local engine ready." : "Local API offline. Start Stem Splitter on 127.0.0.1:4173.");
}

function loadState() {
  const savedTitle = localStorage.getItem(STORAGE_KEYS.title);
  const savedArtist = localStorage.getItem(STORAGE_KEYS.artist);
  if (savedTitle) els.songTitle.value = savedTitle;
  if (savedArtist) els.artistName.value = savedArtist;
  updateSongMeta();
}

els.songTitle.addEventListener("input", updateSongMeta);
els.artistName.addEventListener("input", updateSongMeta);
els.youtubeButton.addEventListener("click", openYoutubeSearch);
els.resetButton.addEventListener("click", resetForm);
els.openFolderButton.addEventListener("click", openOutputFolder);
els.originalPlay.addEventListener("click", () => toggleAudio(els.originalAudio).catch((error) => setStatus(error.message || "播放失败。", true)));
els.vocalPlay.addEventListener("click", () => toggleAudio(els.vocalAudio).catch((error) => setStatus(error.message || "播放失败。", true)));
els.bgmPlay.addEventListener("click", () => toggleAudio(els.bgmAudio).catch((error) => setStatus(error.message || "播放失败。", true)));
els.globalSeekSlider.addEventListener("input", () => {
  const duration = getGlobalDuration();
  if (!duration) return;
  setAllAudioTimes((Number(els.globalSeekSlider.value) / 1000) * duration);
});
els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  splitStems();
});

els.audioFile.addEventListener("change", () => {
  const [file] = els.audioFile.files || [];
  if (file) handleFile(file);
});

["dragenter", "dragover"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.add("is-hover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("is-hover");
  });
});

els.dropZone.addEventListener("drop", (event) => {
  const [file] = event.dataTransfer?.files || [];
  if (file) handleFile(file);
});

bindTrackAudio(els.originalAudio);
bindTrackAudio(els.vocalAudio);
bindTrackAudio(els.bgmAudio);

loadState();
checkHealth();
loadJobFromUrl();
