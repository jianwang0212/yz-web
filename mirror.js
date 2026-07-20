const mirrorNavCopy = {
    zh: {
        'nav.home': '首页',
        'nav.yearReview': '年度总结',
        'nav.works': '作品',
        'nav.contact': '联系',
        'nav.more': '更多',
        'nav.projects': '项目',
        'nav.engineering': '工程 / GitHub',
        'nav.timeline': '时间线',
        'nav.resume': '简历',
        'nav.finance': '财务仪表盘',
        'nav.interests': '兴趣爱好',
        'nav.highlights': '主要亮点'
    },
    en: {
        'nav.home': 'Home',
        'nav.yearReview': 'Year Review',
        'nav.works': 'Works',
        'nav.contact': 'Contact',
        'nav.more': 'More',
        'nav.projects': 'Projects',
        'nav.engineering': 'Engineering / GitHub',
        'nav.timeline': 'Timeline',
        'nav.resume': 'Resume',
        'nav.finance': 'Finance Dashboard',
        'nav.interests': 'Interests',
        'nav.highlights': 'Highlights'
    }
};

function getMirrorLanguage() {
    if (window.ziPageSupportsEnglish === false) return 'zh';
    return localStorage.getItem('language') === 'en' ? 'en' : 'zh';
}

function applyMirrorLanguage() {
    const lang = getMirrorLanguage();
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        const value = mirrorNavCopy[lang][key];
        if (value) {
            element.textContent = value;
        }
    });

    document.querySelectorAll('.lang-btn, .lang-btn-mobile').forEach((button) => {
        const isActive = button.id.includes(lang);
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function initMirrorLanguage() {
    applyMirrorLanguage();
    window.addEventListener('site-language-change', applyMirrorLanguage);

    document.addEventListener('click', (event) => {
        const button = event.target.closest('#lang-zh, #lang-en, #lang-zh-mobile, #lang-en-mobile, .lang-btn, .lang-btn-mobile');
        if (!button) return;

        const text = button.textContent.trim().toLowerCase();
        const lang = button.id.includes('en') || text === 'english' ? 'en' : 'zh';
        event.preventDefault();
        event.stopPropagation();
        localStorage.setItem('language', lang);
        applyMirrorLanguage();
        window.dispatchEvent(new CustomEvent('site-language-change', { detail: { language: lang } }));
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMirrorLanguage);
} else {
    initMirrorLanguage();
}

window.addEventListener('load', () => {
    if (!window.location.hash) return;
    window.setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
            target.scrollIntoView({ block: 'start' });
        }
    }, 120);
});

const mirrorAudio = document.getElementById('mirror-audio-player');
const mirrorCanvas = document.getElementById('mirror-visualizer');

if (mirrorAudio && mirrorCanvas) {
    const ctx = mirrorCanvas.getContext('2d');
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    let audioContext;
    let analyser;
    let source;
    let dataArray;
    let animationFrame;
    let idleDrawTime = 0;
    let isCanvasVisible = true;
    let seeded = 0;

    const palette = ['#778b83', '#a98c81', '#b5a27c', '#6f7d83'];

    function resizeCanvas() {
        const ratio = window.devicePixelRatio || 1;
        const rect = mirrorCanvas.getBoundingClientRect();
        mirrorCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
        mirrorCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
    }

    function drawIdle() {
        const width = mirrorCanvas.width;
        const height = mirrorCanvas.height;
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < 76; i += 1) {
            const x = (i / 75) * width;
            const base = Math.sin(i * 0.42 + seeded) * 0.34 + Math.cos(i * 0.17) * 0.18;
            const barHeight = (0.24 + Math.abs(base)) * height * 0.6;
            ctx.fillStyle = palette[i % palette.length];
            ctx.globalAlpha = 0.28;
            ctx.fillRect(x, (height - barHeight) / 2, Math.max(2, width / 128), barHeight);
        }
        seeded += 0.012;
        ctx.globalAlpha = 1;
    }

    function drawActive() {
        if (!analyser || !dataArray) return;
        analyser.getByteFrequencyData(dataArray);
        const width = mirrorCanvas.width;
        const height = mirrorCanvas.height;
        const bars = 88;
        const step = Math.floor(dataArray.length / bars);
        const barWidth = width / bars;

        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < bars; i += 1) {
            const value = dataArray[i * step] / 255;
            const eased = Math.pow(value, 0.82);
            const barHeight = Math.max(3, eased * height * 0.84);
            ctx.fillStyle = palette[i % palette.length];
            ctx.globalAlpha = 0.34 + eased * 0.54;
            ctx.fillRect(i * barWidth, (height - barHeight) / 2, Math.max(2, barWidth - 3), barHeight);
        }
        ctx.globalAlpha = 1;
        animationFrame = requestAnimationFrame(drawActive);
    }

    function bootAudioGraph() {
        if (audioContext || !AudioContextCtor) return;
        audioContext = new AudioContextCtor();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source = audioContext.createMediaElementSource(mirrorAudio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    function renderIdleLoop(timestamp = 0) {
        if (!mirrorAudio.paused || !isCanvasVisible || document.hidden) return;
        if (!idleDrawTime || timestamp - idleDrawTime > 80) {
            drawIdle();
            idleDrawTime = timestamp;
        }
        animationFrame = requestAnimationFrame(renderIdleLoop);
    }

    resizeCanvas();
    drawIdle();

    if ('IntersectionObserver' in window) {
        const visualizerObserver = new IntersectionObserver((entries) => {
            isCanvasVisible = entries.some((entry) => entry.isIntersecting);
            cancelAnimationFrame(animationFrame);
            if (mirrorAudio.paused && isCanvasVisible) {
                renderIdleLoop();
            }
        }, { threshold: 0.12 });
        visualizerObserver.observe(mirrorCanvas);
    } else {
        renderIdleLoop();
    }

    mirrorAudio.addEventListener('play', async () => {
        bootAudioGraph();
        if (!audioContext) return;
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        cancelAnimationFrame(animationFrame);
        drawActive();
    });

    mirrorAudio.addEventListener('pause', () => {
        cancelAnimationFrame(animationFrame);
        renderIdleLoop();
    });

    mirrorAudio.addEventListener('ended', () => {
        cancelAnimationFrame(animationFrame);
        renderIdleLoop();
    });

    window.addEventListener('resize', () => {
        resizeCanvas();
        if (mirrorAudio.paused) drawIdle();
    });

    document.addEventListener('visibilitychange', () => {
        cancelAnimationFrame(animationFrame);
        if (!document.hidden && mirrorAudio.paused && isCanvasVisible) {
            renderIdleLoop();
        }
    });
}
