(function () {
    const NAV_ITEMS = [
        { id: 'home', key: 'nav.home', zh: '首页', en: 'Home', href: '/' },
        { id: 'works', key: 'nav.works', zh: '作品', en: 'Works', href: '/works' },
        { id: 'essays', key: 'nav.essays', zh: '文章', en: 'Essays', href: '/essays/' },
        { id: 'projects', key: 'nav.projects', zh: '项目', en: 'Projects', href: '/projects' },
        { id: 'about', key: 'nav.about', zh: '关于', en: 'About', href: '/resume' }
    ];

    const ENGLISH_CONTENT_PATHS = new Set([
        '/',
        '/essays',
        '/essays/why-mpe',
        '/essays/why-berklee',
        '/essays/vocal-training-system',
        '/berklee',
        '/interests',
        '/contact',
        '/projects',
        '/projects/apartment-sublet',
        '/projects/interval-quiz',
        '/projects/degree-quiz',
        '/projects/chord-quiz'
    ]);

    function normalizePath(pathname) {
        const path = pathname.replace(/\/+$/, '') || '/';
        const withoutExtension = path.endsWith('.html') ? path.slice(0, -5) || '/' : path;
        const physicalAliases = {
            '/index': '/',
            '/essays/index': '/essays',
            '/papers/apartment-sublet': '/projects/apartment-sublet',
            '/papers/interval-quiz': '/projects/interval-quiz',
            '/papers/degree-quiz': '/projects/degree-quiz',
            '/papers/chord-quiz': '/projects/chord-quiz'
        };
        return physicalAliases[withoutExtension] || withoutExtension;
    }

    function supportsEnglishContent(pathname) {
        return ENGLISH_CONTENT_PATHS.has(normalizePath(pathname));
    }

    window.ziPageSupportsEnglish = supportsEnglishContent(window.location.pathname);
    document.documentElement.dataset.languageSwitch = window.ziPageSupportsEnglish ? 'available' : 'unavailable';

    function currentSection(pathname) {
        const path = normalizePath(pathname);
        if (path === '/') return 'home';
        if (path === '/works' || path.startsWith('/works/') || path === '/berklee') return 'works';
        if (
            path === '/essays' ||
            path.startsWith('/essays/') ||
            path === '/year-review' ||
            path === '/2026-h1-review'
        ) return 'essays';
        if (
            path === '/projects' ||
            path.startsWith('/projects/') ||
            path === '/engineering' ||
            path === '/financial-dashboard' ||
            path === '/papers'
        ) return 'projects';
        if (['/resume', '/timeline', '/highlights', '/interests', '/contact'].includes(path)) return 'about';
        return '';
    }

    function isPrimaryDestination(item, pathname) {
        const path = normalizePath(pathname);
        const target = normalizePath(item.href);
        return path === target || (item.id === 'essays' && path === '/essays');
    }

    function renderNavigation(nav) {
        const canSwitchLanguage = window.ziPageSupportsEnglish;
        const preferredLang = localStorage.getItem('language') === 'en' ? 'en' : 'zh';
        const lang = canSwitchLanguage ? preferredLang : 'zh';
        const section = currentSection(window.location.pathname);
        const pathname = window.location.pathname;
        const pressed = (value) => value === lang ? 'true' : 'false';
        const activeClass = (value, base) => value === lang ? `${base} active` : base;
        const languageControls = {
            mobile: `<li class="nav-menu-lang-item">
                        <div class="nav-lang-toggle-mobile" aria-label="Language">
                            <button id="lang-zh-mobile" class="${activeClass('zh', 'lang-btn-mobile')}" type="button" aria-label="${lang === 'en' ? 'Switch to Chinese' : '切换到中文'}" aria-pressed="${pressed('zh')}">中文</button>
                            <button id="lang-en-mobile" class="${activeClass('en', 'lang-btn-mobile')}" type="button" aria-label="Switch to English" aria-pressed="${pressed('en')}">English</button>
                        </div>
                    </li>`,
            desktop: `<div class="nav-lang-toggle" aria-label="Language">
                    <button id="lang-zh" class="${activeClass('zh', 'lang-btn')}" type="button" aria-label="${lang === 'en' ? 'Switch to Chinese' : '切换到中文'}" aria-pressed="${pressed('zh')}">中文</button>
                    <button id="lang-en" class="${activeClass('en', 'lang-btn')}" type="button" aria-label="Switch to English" aria-pressed="${pressed('en')}">English</button>
                </div>`
        };
        const links = NAV_ITEMS.map((item) => {
            const active = item.id === section;
            const current = active
                ? ` aria-current="${isPrimaryDestination(item, pathname) ? 'page' : 'location'}"`
                : '';
            const className = active ? ' class="nav-link active"' : ' class="nav-link"';
            return `<li><a href="${item.href}"${className}${current} data-nav-id="${item.id}" data-i18n="${item.key}">${item[lang]}</a></li>`;
        }).join('');

        nav.className = 'navbar site-global-nav';
        if (nav.dataset.siteNavInjected === 'true') {
            document.body.classList.add('site-nav-injected');
        }
        nav.setAttribute('aria-label', lang === 'en' ? 'Primary navigation' : '主导航');
        document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
        nav.innerHTML = `
            <div class="container site-nav-inner">
                <a class="nav-brand site-title" href="/" aria-label="${lang === 'en' ? 'Back to Zi Yin home' : '返回 Zi Yin 首页'}">
                    <span class="name-en">Zi Yin</span>
                    <span class="name-sep">·</span>
                    <span class="name-zh">银子</span>
                </a>
                <ul class="nav-menu" id="primary-navigation">
                    ${links}
                    ${canSwitchLanguage ? languageControls.mobile : ''}
                </ul>
                ${canSwitchLanguage ? languageControls.desktop : ''}
                <button class="hamburger" type="button" aria-label="${lang === 'en' ? 'Open navigation' : '打开导航菜单'}" aria-controls="primary-navigation" aria-expanded="false">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        `;

        bindNavigation(nav);
    }

    function bindNavigation(nav) {
        const menu = nav.querySelector('.nav-menu');
        const hamburger = nav.querySelector('.hamburger');

        function closeMenu() {
            menu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }

        hamburger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const isOpen = menu.classList.toggle('active');
            hamburger.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
        });

        nav.querySelectorAll('.nav-menu a').forEach((link) => {
            link.addEventListener('click', closeMenu);
        });

        nav.querySelectorAll('.lang-btn, .lang-btn-mobile').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                const lang = button.id.includes('en') ? 'en' : 'zh';
                localStorage.setItem('language', lang);
                renderNavigation(nav);
                const setSiteLanguage = window.setSiteLanguage;
                const setPageLanguage = window.setLanguage;
                if (typeof setSiteLanguage === 'function') {
                    setSiteLanguage(lang);
                } else {
                    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
                }
                if (typeof setPageLanguage === 'function' && setPageLanguage !== setSiteLanguage) {
                    setPageLanguage(lang);
                }
            });
        });

        if (!window.__ziSiteNavigationDismissBound) {
            window.__ziSiteNavigationDismissBound = true;
            document.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape') return;
                const currentNav = document.querySelector('.site-global-nav');
                const currentMenu = currentNav?.querySelector('.nav-menu');
                const currentHamburger = currentNav?.querySelector('.hamburger');
                if (!currentMenu?.classList.contains('active')) return;
                currentMenu.classList.remove('active');
                currentHamburger.classList.remove('active');
                currentHamburger.setAttribute('aria-expanded', 'false');
                currentHamburger.focus();
            });
            document.addEventListener('click', (event) => {
                const currentNav = document.querySelector('.site-global-nav');
                if (!currentNav || currentNav.contains(event.target)) return;
                const currentMenu = currentNav.querySelector('.nav-menu');
                const currentHamburger = currentNav.querySelector('.hamburger');
                currentMenu?.classList.remove('active');
                currentHamburger?.classList.remove('active');
                currentHamburger?.setAttribute('aria-expanded', 'false');
            });
        }
    }

    function init() {
        const nav = document.querySelector('nav.navbar');
        if (nav) renderNavigation(nav);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

// Private-link hints mirror the reviewed Caddy public allowlist; they do not grant access.
// Refresh PUBLIC_PATHS when the server's access policy changes. No probing/login requests.
(function installPrivateLinkHints() {
    const PUBLIC_PATHS = new Set(["/","/api/snow-white/download","/assets/beautiful-memory/._beautiful-memory-demo-160.mp3","/assets/beautiful-memory/beautiful-memory-demo-160.mp3","/assets/beautiful-memory/versions/._peaks.json","/assets/beautiful-memory/versions/._v1-song-idea.mp3","/assets/beautiful-memory/versions/._v2-demo.mp3","/assets/beautiful-memory/versions/._v3-harmony.mp3","/assets/beautiful-memory/versions/._v4-arrangement.mp3","/assets/beautiful-memory/versions/._v5-close-mic.mp3","/assets/beautiful-memory/versions/._v5-distant-mic.mp3","/assets/beautiful-memory/versions/peaks.json","/assets/beautiful-memory/versions/v1-song-idea.mp3","/assets/beautiful-memory/versions/v2-demo.mp3","/assets/beautiful-memory/versions/v3-harmony.mp3","/assets/beautiful-memory/versions/v4-arrangement.mp3","/assets/beautiful-memory/versions/v5-close-mic.mp3","/assets/beautiful-memory/versions/v5-distant-mic.mp3","/assets/beautiful-memory/visuals/._daw-logic-lesson2-1600.webp","/assets/beautiful-memory/visuals/._daw-logic-lesson2-800.webp","/assets/beautiful-memory/visuals/._daw-protools-tracking-1600.webp","/assets/beautiful-memory/visuals/._daw-protools-tracking-800.webp","/assets/beautiful-memory/visuals/._hero-cover-1600.jpg","/assets/beautiful-memory/visuals/._hero-cover-800.jpg","/assets/beautiful-memory/visuals/._hero-cover-800.webp","/assets/beautiful-memory/visuals/._hero-cover.webp","/assets/beautiful-memory/visuals/._leadsheet-reharm-1200.webp","/assets/beautiful-memory/visuals/._scene-flag-1200.webp","/assets/beautiful-memory/visuals/._scene-flag-600.webp","/assets/beautiful-memory/visuals/._scene-homework-1200.webp","/assets/beautiful-memory/visuals/._scene-homework-600.webp","/assets/beautiful-memory/visuals/._scene-phone-1200.webp","/assets/beautiful-memory/visuals/._scene-phone-600.webp","/assets/beautiful-memory/visuals/._share-card.jpg","/assets/beautiful-memory/visuals/daw-logic-lesson2-1600.webp","/assets/beautiful-memory/visuals/daw-logic-lesson2-800.webp","/assets/beautiful-memory/visuals/daw-protools-tracking-1600.webp","/assets/beautiful-memory/visuals/daw-protools-tracking-800.webp","/assets/beautiful-memory/visuals/hero-cover-1600.jpg","/assets/beautiful-memory/visuals/hero-cover-800.jpg","/assets/beautiful-memory/visuals/hero-cover-800.webp","/assets/beautiful-memory/visuals/hero-cover.webp","/assets/beautiful-memory/visuals/leadsheet-reharm-1200.webp","/assets/beautiful-memory/visuals/scene-flag-1200.webp","/assets/beautiful-memory/visuals/scene-flag-600.webp","/assets/beautiful-memory/visuals/scene-homework-1200.webp","/assets/beautiful-memory/visuals/scene-homework-600.webp","/assets/beautiful-memory/visuals/scene-phone-1200.webp","/assets/beautiful-memory/visuals/scene-phone-600.webp","/assets/beautiful-memory/visuals/share-card.jpg","/assets/mirror/lyric-imagery/a1-reflection-jazz.webp","/assets/mirror/lyric-imagery/a2-daily-dream-jazz.webp","/assets/mirror/lyric-imagery/a3-breath-memory-jazz.webp","/assets/mirror/lyric-imagery/b-unprepared-flash-jazz.webp","/assets/mirror/mirror-ziyin.mp3","/assets/mirror/mirror-ziyin.wav","/assets/mirror/people-motion/kevin-yuen-producer.mp4","/assets/mirror/people-motion/keye-xin-sax.mp4","/assets/mirror/people-motion/sean-zhou-engineer.mp4","/assets/mirror/people-motion/tong-hu-bass.mp4","/assets/mirror/people-motion/yuheng-zhu-piano.mp4","/assets/mirror/people-motion/zhitang-zeng-drum.mp4","/assets/mirror/people-motion/zi-yin-vocal.mp4","/assets/mirror/people/kevin-yuen-producer.webp","/assets/mirror/people/keye-xin-sax.webp","/assets/mirror/people/sean-zhou-engineer.webp","/assets/mirror/people/tong-hu-bass.webp","/assets/mirror/people/yuheng-zhu-piano.webp","/assets/mirror/people/zhitang-zeng-drum.webp","/assets/mirror/people/zi-yin-vocal.webp","/assets/mirror/video/cast-bass-loop.mp4","/assets/mirror/video/cast-drum-loop.mp4","/assets/mirror/video/cast-engineer-loop.mp4","/assets/mirror/video/cast-piano-loop.mp4","/assets/mirror/video/cast-producer-loop.mp4","/assets/mirror/video/cast-sax-loop.mp4","/assets/mirror/video/piano-hands-loop.mp4","/assets/mirror/video/sax-loop.mp4","/assets/mirror/video/studio-room-loop.mp4","/assets/mirror/video/vocal-piano-loop.mp4","/assets/mirror/visuals/jazz-bar-mirrors-singer.webp","/assets/mirror/visuals/mirror-ai-cover.webp","/assets/mirror/visuals/mirror-share-card.jpg","/assets/mirror/visuals/session-team.webp","/assets/one-person/mv/one-person-mv-cover-1280.webp","/assets/one-person/mv/one-person-mv-cover-640.webp","/assets/one-person/mv/one-person-mv.mp4","/assets/one-person/one-person-ziyin-stream-192.mp3","/assets/one-person/one-person-ziyin.mp3","/assets/one-person/one-person-ziyin.wav","/assets/one-person/posters/bass.webp","/assets/one-person/posters/drums.webp","/assets/one-person/posters/guitar.webp","/assets/one-person/posters/horn.webp","/assets/one-person/posters/piano.webp","/assets/one-person/posters/producer.webp","/assets/one-person/posters/session.webp","/assets/one-person/video/bass-loop.mp4","/assets/one-person/video/drums-loop.mp4","/assets/one-person/video/guitar-loop.mp4","/assets/one-person/video/horn-loop.mp4","/assets/one-person/video/piano-loop.mp4","/assets/one-person/video/producer-loop.mp4","/assets/one-person/video/session-loop.mp4","/assets/one-person/visuals/one-person-cover.webp","/assets/one-person/visuals/one-person-share-card.jpg","/assets/snow-white/covers/contact-sheet.jpg","/assets/snow-white/covers/cover-01-night-window.jpg","/assets/snow-white/covers/cover-02-snow-castle.jpg","/assets/snow-white/covers/cover-03-empty-room.jpg","/assets/snow-white/covers/cover-04-she-was-here.jpg","/assets/snow-white/covers/cover-05-mirror.jpg","/assets/snow-white/covers/cover-06-boston-night.jpg","/assets/snow-white/covers/cover-07-scattered-photos.jpg","/assets/snow-white/covers/cover-08-sleeping.jpg","/assets/snow-white/covers/cover-09-spring.jpg","/assets/snow-white/covers/cover-10-final.jpg","/assets/snow-white/covers/optimized/contact-sheet-1100.webp","/assets/snow-white/covers/optimized/cover-01-night-window-640.webp","/assets/snow-white/covers/optimized/cover-02-snow-castle-640.webp","/assets/snow-white/covers/optimized/cover-02-snow-castle-720.webp","/assets/snow-white/covers/optimized/cover-03-empty-room-640.webp","/assets/snow-white/covers/optimized/cover-04-she-was-here-640.webp","/assets/snow-white/covers/optimized/cover-05-mirror-640.webp","/assets/snow-white/covers/optimized/cover-06-boston-night-640.webp","/assets/snow-white/covers/optimized/cover-07-scattered-photos-640.webp","/assets/snow-white/covers/optimized/cover-08-sleeping-640.webp","/assets/snow-white/covers/optimized/cover-09-spring-640.webp","/assets/snow-white/covers/optimized/cover-10-final-640.webp","/assets/snow-white/covers/optimized/cover-10-final-720.webp","/assets/snow-white/covers/optimized/cover-10-final-960.webp","/assets/snow-white/covers/optimized/mv-cover-1100.webp","/assets/snow-white/covers/optimized/mv-cover-640.webp","/assets/snow-white/covers/optimized/poster-wide-lyrics-1200.webp","/assets/snow-white/covers/optimized/poster-wide-lyrics-1600.webp","/assets/snow-white/covers/optimized/visual-02-empty-room-1100.webp","/assets/snow-white/covers/optimized/visual-03-snow-castle-1200.webp","/assets/snow-white/covers/optimized/visual-04-boston-rooftop-1100.webp","/assets/snow-white/covers/optimized/visual-05-mirror-1100.webp","/assets/snow-white/covers/optimized/visual-06-spring-room-1200.webp","/assets/snow-white/covers/optimized/visual-07-dream-closeup-900.webp","/assets/snow-white/covers/poster-wide-lyrics.jpg","/assets/snow-white/covers/square-01-night-title.jpg","/assets/snow-white/covers/square-02-snow-title.jpg","/assets/snow-white/covers/square-03-fairytale.jpg","/assets/snow-white/covers/square-04-pig-balloon.jpg","/assets/snow-white/covers/square-05-variant.jpg","/assets/snow-white/covers/square-06-variant.jpg","/assets/snow-white/covers/visual-01-night-window.jpg","/assets/snow-white/covers/visual-02-empty-room.jpg","/assets/snow-white/covers/visual-03-snow-castle.jpg","/assets/snow-white/covers/visual-04-boston-rooftop.jpg","/assets/snow-white/covers/visual-05-mirror.jpg","/assets/snow-white/covers/visual-06-spring-room.jpg","/assets/snow-white/covers/visual-07-dream-closeup.jpg","/assets/snow-white/snow-white-budget.xlsx","/assets/snow-white/snow-white-charts.pdf","/assets/snow-white/snow-white-credits.pdf","/assets/snow-white/snow-white-full-score.pdf","/assets/snow-white/snow-white-lead-sheet.pdf","/assets/snow-white/snow-white-lyrics.pdf","/assets/snow-white/snow-white-mastered.mp3","/assets/snow-white/snow-white-mastered.wav","/assets/snow-white/snow-white-piano-arrangement.pdf","/assets/snow-white/snow-white-production-notes.pdf","/assets/snow-white/snow-white-rough-mix.mp3","/assets/snow-white/snow-white-vocal-score.pdf","/assets/snow-white/thumbs/snow-white-credits.pdf.png","/assets/snow-white/thumbs/snow-white-full-score.pdf.png","/assets/snow-white/thumbs/snow-white-lyrics.pdf.png","/assets/snow-white/thumbs/snow-white-production-notes.pdf.png","/assets/vocal-class/comedy-king-practice-001-20260609.mp3","/beautiful-memory","/beautiful-memory.css","/beautiful-memory.html","/beautiful-memory.js","/beautiful-memory/","/berklee","/berklee.css","/berklee.html","/berklee.js","/berklee/","/contact","/contact.html","/contact/","/engineering","/engineering.html","/engineering/","/essays","/essays/","/essays/career-and-long-termism","/essays/career-and-long-termism.css","/essays/career-and-long-termism.html","/essays/career-and-long-termism.js","/essays/career-and-long-termism/","/essays/field-notes.css","/essays/field-notes.js","/essays/financial-freedom-and-work","/essays/financial-freedom-and-work.html","/essays/financial-freedom-and-work/","/essays/happiness","/essays/happiness.css","/essays/happiness.html","/essays/happiness.js","/essays/happiness/","/essays/index","/essays/index.css","/essays/index.html","/essays/index/","/essays/intj","/essays/intj.css","/essays/intj.html","/essays/intj.js","/essays/intj/","/essays/long-term-plans","/essays/long-term-plans.css","/essays/long-term-plans.html","/essays/long-term-plans.js","/essays/long-term-plans/","/essays/personal-ai-evolution","/essays/personal-ai-evolution.html","/essays/personal-ai-evolution/","/essays/trading-emotions-and-risk","/essays/trading-emotions-and-risk.html","/essays/trading-emotions-and-risk/","/essays/vocal-training-system","/essays/vocal-training-system.css","/essays/vocal-training-system.html","/essays/vocal-training-system/","/essays/why-berklee","/essays/why-berklee.css","/essays/why-berklee.html","/essays/why-berklee/","/essays/why-jazz","/essays/why-jazz.css","/essays/why-jazz.html","/essays/why-jazz.js","/essays/why-jazz/","/essays/why-mpe","/essays/why-mpe.css","/essays/why-mpe.html","/essays/why-mpe/","/favicon.ico","/highlights","/highlights.html","/highlights/","/i18n.js","/images/AuMusicBest.jpg","/images/AuMusicBest.webp","/images/credentials/oxford-mphil.jpg","/images/credentials/uq-bachelor-medal.jpg","/images/photos/academic-presentation.webp","/images/photos/music-practice.webp","/images/plans/berklee-board.jpg","/images/plans/berklee-stage.jpg","/images/plans/berklee-wide.jpg","/images/plans/plan-2015-future.png","/images/plans/plan-2015-schedule.png","/images/timeline/docking-founder-3.jpg","/images/timeline/docking-tech.jpg","/images/timeline/gliding-exp.jpg","/images/timeline/music-childhood.jpg","/images/timeline/oxford-band-1.jpg","/images/timeline/oxford-band-2.jpg","/images/works/black-keys.jpg","/images/works/bumblebee.jpg","/images/works/cat-salmon.jpg","/images/works/duode-ta-live.jpg","/images/works/foolish-heart.jpg","/images/works/havana.jpg","/images/works/hey-jude-bossa.jpg","/images/works/i-wish.jpg","/images/works/interstellar.jpg","/images/works/kiwi-tears-hero.webp","/images/works/minuet-in-mass-ave.jpg","/images/works/pirates.jpg","/images/works/shivers-reharm.jpg","/images/works/study-of-modes.jpg","/images/works/the-way-you-make-me-feel-live.jpg","/images/works/this-world.jpg","/images/works/uptown-funk.jpg","/images/works/virtual-insanity.jpg","/index","/index.html","/index/","/interests","/interests.html","/interests/","/mirror","/mirror.css","/mirror.html","/mirror.js","/mirror/","/one-person","/one-person.css","/one-person.html","/one-person.js","/one-person/","/papers","/papers/","/papers/2017-uq-honours-scale-efficiency.pdf","/papers/2020-oxford-mphil-crypto-momentum.pdf","/papers/app.js","/papers/chord-quiz","/papers/chord-quiz.html","/papers/chord-quiz.js","/papers/chord-quiz/","/papers/chord-trainer","/papers/chord-trainer-assets/app.js","/papers/chord-trainer-assets/styles.css","/papers/chord-trainer.html","/papers/chord-trainer/","/papers/degree-quiz","/papers/degree-quiz.html","/papers/degree-quiz.js","/papers/degree-quiz/","/papers/index","/papers/index.html","/papers/index/","/papers/interval-quiz","/papers/interval-quiz.html","/papers/interval-quiz.js","/papers/interval-quiz/","/papers/left-hand-voicing-trainer","/papers/left-hand-voicing-trainer-assets/app.js","/papers/left-hand-voicing-trainer-assets/styles.css","/papers/left-hand-voicing-trainer.html","/papers/left-hand-voicing-trainer/","/papers/styles.css","/papers/vipassana","/papers/vipassana.css","/papers/vipassana.html","/papers/vipassana.js","/papers/vipassana/","/projects","/projects-copy.js","/projects-hubs.css","/projects-index.js","/projects.html","/projects/","/projects/chord-quiz","/projects/chord-quiz.html","/projects/chord-quiz.js","/projects/chord-quiz/","/projects/chord-trainer","/projects/chord-trainer-assets/app.js","/projects/chord-trainer-assets/styles.css","/projects/chord-trainer.html","/projects/chord-trainer/","/projects/degree-quiz","/projects/degree-quiz.html","/projects/degree-quiz.js","/projects/degree-quiz/","/projects/interval-quiz","/projects/interval-quiz.html","/projects/interval-quiz.js","/projects/interval-quiz/","/projects/left-hand-voicing-trainer","/projects/left-hand-voicing-trainer-assets/app.js","/projects/left-hand-voicing-trainer-assets/styles.css","/projects/left-hand-voicing-trainer.html","/projects/left-hand-voicing-trainer/","/projects/song-leadsheet-database","/projects/song-leadsheet-database.html","/projects/song-leadsheet-database/","/projects/stem-splitter","/projects/stem-splitter.css","/projects/stem-splitter.html","/projects/stem-splitter.js","/projects/stem-splitter/","/projects/vipassana","/projects/vipassana.html","/projects/vipassana/","/resume","/resume.html","/resume/","/script.js","/site-nav.css","/site-nav.js","/snow-white","/snow-white.css","/snow-white.html","/snow-white.js","/snow-white/","/song-leadsheet-database","/song-leadsheet-database.html","/song-leadsheet-database/","/styles.css","/timeline","/timeline.html","/timeline/","/vocal-class-comedy-king","/vocal-class-comedy-king.css","/vocal-class-comedy-king.html","/vocal-class-comedy-king/","/works","/works.html","/works/","/works/assets/one-person/one-person-ziyin-stream-192.mp3","/works/assets/one-person/one-person-ziyin.mp3","/works/assets/one-person/one-person-ziyin.wav","/works/assets/one-person/posters/bass.webp","/works/assets/one-person/posters/drums.webp","/works/assets/one-person/posters/guitar.webp","/works/assets/one-person/posters/horn.webp","/works/assets/one-person/posters/piano.webp","/works/assets/one-person/posters/producer.webp","/works/assets/one-person/posters/session.webp","/works/assets/one-person/visuals/one-person-cover.webp","/works/beautiful-memory","/works/beautiful-memory.html","/works/beautiful-memory/","/works/mirror","/works/mirror.css","/works/mirror.html","/works/mirror/","/works/one-person","/works/one-person.css","/works/one-person.html","/works/one-person.js","/works/one-person/","/works/snow-white","/works/snow-white.css","/works/snow-white.html","/works/snow-white/","/works/styles.css","/works/vocal-class-comedy-king","/works/vocal-class-comedy-king.html","/works/vocal-class-comedy-king/","/zapp/icons/apps/music-tool.svg"]);
    const BADGE_CLASS = 'site-private-link-badge';
    let nextBadgeId = 0;

    function requiresLogin(link) {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return false;
        try {
            const url = new URL(href, document.baseURI);
            if (!['http:', 'https:'].includes(url.protocol)) return false;
            if (!['thisisyz.com', 'www.thisisyz.com'].includes(url.hostname)) return false;
            return !PUBLIC_PATHS.has(decodeURIComponent(url.pathname));
        } catch { return false; }
    }

    function updateLink(link) {
        const existing = link.querySelector(`:scope > .${BADGE_CLASS}`);
        const oldId = link.dataset.privateBadgeId;
        if (!requiresLogin(link)) {
            existing?.remove();
            delete link.dataset.privateLink;
            if (oldId) {
                const ids = (link.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== oldId);
                if (ids.length) link.setAttribute('aria-describedby', ids.join(' '));
                else link.removeAttribute('aria-describedby');
                delete link.dataset.privateBadgeId;
            }
            return;
        }
        link.dataset.privateLink = 'true';
        if (existing) return;
        const badge = document.createElement('span');
        badge.className = BADGE_CLASS;
        badge.id = oldId || `site-private-link-${++nextBadgeId}`;
        badge.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><rect x="3" y="7" width="10" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span>需登录</span>';
        link.dataset.privateBadgeId = badge.id;
        const ids = new Set((link.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        ids.add(badge.id);
        link.setAttribute('aria-describedby', [...ids].join(' '));
        link.append(badge);
    }

    function scan(root) {
        if (!(root instanceof Element)) return;
        if (root.matches('a')) updateLink(root);
        root.querySelectorAll('a[href]').forEach(updateLink);
    }

    function initHints() {
        const style = document.createElement('style');
        style.textContent = `.site-private-link-badge{display:inline-flex!important;align-items:center;gap:4px;flex:0 0 auto;width:max-content;max-width:100%;margin-inline-start:.45em;padding:2px 7px;border:1px solid #dfc490;border-radius:999px;background:#fff4dc;color:#784207;font:600 11px/1.5 system-ui,sans-serif;letter-spacing:0;white-space:nowrap;vertical-align:middle;text-decoration:none}.site-private-link-badge svg{display:block!important;flex:none;width:12px;height:12px}.purpose-card>.site-private-link-badge{align-self:flex-start;margin-inline-start:0}`;
        document.head.append(style);
        scan(document.body);
        const options = {subtree:true, childList:true, attributes:true, attributeFilter:['href']};
        const observer = new MutationObserver(records => {
            // Scan only changed subtrees/anchors, not the whole document on every mutation.
            const roots = new Set();
            for (const record of records) {
                if (record.target instanceof Element) {
                    const anchor = record.target.closest('a');
                    if (anchor) roots.add(anchor);
                }
                for (const node of record.addedNodes) if (node instanceof Element) roots.add(node);
            }
            observer.disconnect();
            roots.forEach(scan);
            observer.observe(document.body, options);
        });
        observer.observe(document.body, options);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHints, {once:true});
    else initHints();
})();
