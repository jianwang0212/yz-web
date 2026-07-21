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
