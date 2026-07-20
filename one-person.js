function getOnePersonLanguage() {
    if (window.ziPageSupportsEnglish === false) return 'zh';
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

const audio = document.getElementById('one-person-audio-player');
const playToggle = document.getElementById('one-person-play-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sessionVideos = Array.from(document.querySelectorAll('.one-person-page video'));

function videoSource(video) {
    return video.querySelector('source[data-src]');
}

function unloadVideo(video) {
    const source = videoSource(video);
    video.pause();
    if (!source?.hasAttribute('src')) return;
    source.removeAttribute('src');
    video.load();
}

function audioIsPlaying() {
    return Boolean(audio && !audio.paused && !audio.ended);
}

function loadVisibleVideo(video) {
    if (video.dataset.inView !== 'true' || reducedMotion.matches || audioIsPlaying()) return;
    const source = videoSource(video);
    if (!source) return;
    if (!source.hasAttribute('src')) {
        source.src = source.dataset.src;
        video.load();
    }
    if (video.hasAttribute('data-autoplay')) {
        video.play().catch(() => {});
    }
}

function resumeVisibleVideos() {
    sessionVideos.forEach(loadVisibleVideo);
}

if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            entry.target.dataset.inView = entry.isIntersecting ? 'true' : 'false';
            if (entry.isIntersecting) {
                loadVisibleVideo(entry.target);
            } else {
                unloadVideo(entry.target);
            }
        });
    }, { threshold: 0.1 });
    sessionVideos.forEach((video) => videoObserver.observe(video));
} else {
    sessionVideos.forEach((video) => {
        const bounds = video.getBoundingClientRect();
        video.dataset.inView = bounds.bottom > 0 && bounds.top < window.innerHeight ? 'true' : 'false';
    });
    resumeVisibleVideos();
}

reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) {
        sessionVideos.forEach(unloadVideo);
    } else {
        resumeVisibleVideos();
    }
});

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
    audio.addEventListener('play', () => sessionVideos.forEach(unloadVideo));
    for (const eventName of ['pause', 'ended']) {
        audio.addEventListener(eventName, () => {
            updatePlayToggle();
            resumeVisibleVideos();
        });
    }
}

window.addEventListener('load', () => {
    if (!window.location.hash) return;
    window.setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' }), 120);
});
