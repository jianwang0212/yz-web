function getOnePersonLanguage() {
    return localStorage.getItem('language') === 'en' ? 'en' : 'zh';
}

function applyOnePersonLanguage() {
    const language = getOnePersonLanguage();
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('.lang-btn, .lang-btn-mobile').forEach((button) => {
        const active = button.id.includes(language);
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function initOnePersonLanguage() {
    applyOnePersonLanguage();
    window.addEventListener('site-language-change', applyOnePersonLanguage);
    document.addEventListener('click', (event) => {
        const button = event.target.closest('#lang-zh, #lang-en, #lang-zh-mobile, #lang-en-mobile, .lang-btn, .lang-btn-mobile');
        if (!button) return;
        const language = button.id.includes('en') || button.textContent.trim().toLowerCase() === 'english' ? 'en' : 'zh';
        localStorage.setItem('language', language);
        applyOnePersonLanguage();
        window.dispatchEvent(new CustomEvent('site-language-change', { detail: { language } }));
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnePersonLanguage);
} else {
    initOnePersonLanguage();
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function applyOnePersonMotionPreference() {
    if (!reducedMotion.matches) return;
    document.querySelectorAll('.one-person-page video').forEach((video) => video.pause());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOnePersonMotionPreference);
} else {
    applyOnePersonMotionPreference();
}
reducedMotion.addEventListener?.('change', applyOnePersonMotionPreference);

window.addEventListener('load', () => {
    if (!window.location.hash) return;
    window.setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' }), 120);
});

const audio = document.getElementById('one-person-audio-player');
const canvas = document.getElementById('one-person-visualizer');
const playToggle = document.getElementById('one-person-play-toggle');

if (audio && playToggle) {
    const updatePlayToggle = () => {
        const playing = !audio.paused;
        playToggle.textContent = playing ? '暂停母带 / Pause master' : '播放母带 / Play master';
        playToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
        delete playToggle.dataset.state;
    };

    playToggle.addEventListener('click', async () => {
        if (!audio.paused) {
            audio.pause();
            return;
        }
        try {
            await audio.play();
        } catch {
            playToggle.textContent = '请使用下方播放器 / Use player below';
            playToggle.dataset.state = 'error';
        }
    });

    audio.addEventListener('play', updatePlayToggle);
    audio.addEventListener('pause', updatePlayToggle);
    audio.addEventListener('ended', updatePlayToggle);
}

if (audio && canvas) {
    const context = canvas.getContext('2d');
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const palette = ['#8f2f2b', '#bd8d45', '#6f4a36', '#d6ad6b'];
    let audioContext;
    let analyser;
    let data;
    let frame;
    let canvasVisible = true;
    let idlePhase = 0;

    function resizeCanvas() {
        const ratio = window.devicePixelRatio || 1;
        const bounds = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
        canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
    }

    function drawBars(values, count, active) {
        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / count;
        context.clearRect(0, 0, width, height);
        for (let index = 0; index < count; index += 1) {
            const value = values(index);
            const barHeight = Math.max(3, value * height * (active ? 0.84 : 0.62));
            context.fillStyle = palette[index % palette.length];
            context.globalAlpha = active ? 0.34 + value * 0.54 : 0.26;
            context.fillRect(index * barWidth, (height - barHeight) / 2, Math.max(2, barWidth - 3), barHeight);
        }
        context.globalAlpha = 1;
    }

    function drawIdle() {
        drawBars((index) => 0.24 + Math.abs(Math.sin(index * 0.39 + idlePhase) * 0.34 + Math.cos(index * 0.15) * 0.16), 76, false);
        idlePhase += 0.018;
    }

    function drawActive() {
        if (!analyser || !data) return;
        analyser.getByteFrequencyData(data);
        const step = Math.max(1, Math.floor(data.length / 88));
        drawBars((index) => Math.pow(data[index * step] / 255, 0.82), 88, true);
        frame = requestAnimationFrame(drawActive);
    }

    function drawIdleLoop() {
        if (!audio.paused || !canvasVisible || document.hidden || reducedMotion.matches) return;
        drawIdle();
        frame = window.setTimeout(() => requestAnimationFrame(drawIdleLoop), 80);
    }

    function bootAudioGraph() {
        if (audioContext || !AudioContextCtor || window.location.protocol === 'file:') return;
        audioContext = new AudioContextCtor();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        data = new Uint8Array(analyser.frequencyBinCount);
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    resizeCanvas();
    drawIdle();

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            canvasVisible = entries.some((entry) => entry.isIntersecting);
            cancelAnimationFrame(frame);
            clearTimeout(frame);
            if (canvasVisible && audio.paused) drawIdleLoop();
        }, { threshold: 0.12 }).observe(canvas);
    } else {
        drawIdleLoop();
    }

    audio.addEventListener('play', async () => {
        bootAudioGraph();
        if (!audioContext) return;
        if (audioContext.state === 'suspended') await audioContext.resume();
        cancelAnimationFrame(frame);
        clearTimeout(frame);
        drawActive();
    });

    for (const eventName of ['pause', 'ended']) {
        audio.addEventListener(eventName, () => {
            cancelAnimationFrame(frame);
            clearTimeout(frame);
            drawIdleLoop();
        });
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        if (audio.paused) drawIdle();
    });
}
