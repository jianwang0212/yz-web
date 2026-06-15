(function () {
    const nav = document.querySelector('nav.navbar');
    if (!nav) return;

    const lang = localStorage.getItem('language') === 'en' ? 'en' : 'zh';
    const path = window.location.pathname.replace(/\/$/, '/index.html');

    const primaryItems = [
        { key: 'nav.home', label: '首页', href: '/index.html', match: ['/index.html', '/'] },
        { key: 'nav.yearReview', label: '年度总结', href: '/year-review.html', match: ['/year-review.html'] },
        { key: 'nav.works', label: '作品', href: '/works.html', match: ['/works.html', '/works/snow-white', '/works/mirror', '/works/vocal-class-comedy-king'] },
        { key: 'nav.contact', label: '联系', href: '/contact.html', match: ['/contact.html'] }
    ];

    const moreItems = [
        { key: 'nav.projects', label: '项目', href: '/projects.html', match: ['/projects.html', '/projects/socialpulse', '/projects/codex-monitor', '/projects/song-leadsheet-database'] },
        { key: 'nav.engineering', label: '工程 / GitHub', href: '/engineering.html', match: ['/engineering.html', '/engineering'] },
        { key: 'nav.timeline', label: '时间线', href: '/timeline.html', match: ['/timeline.html'] },
        { key: 'nav.resume', label: '简历', href: '/resume.html', match: ['/resume.html', '/berklee.html'] },
        { key: 'nav.finance', label: '财务仪表盘', href: '/financial-dashboard.html', match: ['/financial-dashboard.html'] },
        { key: 'nav.interests', label: '兴趣爱好', href: '/interests.html', match: ['/interests.html'] },
        { key: 'nav.highlights', label: '主要亮点', href: '/highlights.html', match: ['/highlights.html'] }
    ];

    function isActive(item) {
        return item.match.some((candidate) => path === candidate);
    }

    function navLink(item) {
        const active = isActive(item);
        const className = active ? ' class="nav-link active"' : '';
        const current = active ? ' aria-current="page"' : '';
        return `<a href="${item.href}"${className}${current} data-i18n="${item.key}">${item.label}</a>`;
    }

    const zhPressed = lang === 'zh' ? 'true' : 'false';
    const enPressed = lang === 'en' ? 'true' : 'false';
    const zhClass = lang === 'zh' ? 'lang-btn active' : 'lang-btn';
    const enClass = lang === 'en' ? 'lang-btn active' : 'lang-btn';
    const zhMobileClass = lang === 'zh' ? 'lang-btn-mobile active' : 'lang-btn-mobile';
    const enMobileClass = lang === 'en' ? 'lang-btn-mobile active' : 'lang-btn-mobile';

    nav.innerHTML = `
        <div class="container">
            <a class="nav-brand site-title" href="/" aria-label="返回 Zi Yin 首页">
                <span class="name-en">Zi Yin</span>
                <span class="name-sep">·</span>
                <span class="name-zh">银子</span>
            </a>
            <ul class="nav-menu" id="primary-navigation">
                ${primaryItems.map((item) => `<li>${navLink(item)}</li>`).join('')}
                <li class="nav-menu-lang-item">
                    <div class="nav-lang-toggle-mobile">
                        <button id="lang-zh-mobile" class="${zhMobileClass}" type="button" aria-label="切换到中文" aria-pressed="${zhPressed}">中文</button>
                        <button id="lang-en-mobile" class="${enMobileClass}" type="button" aria-label="Switch to English" aria-pressed="${enPressed}">English</button>
                    </div>
                </li>
                <li class="nav-menu-item">
                    <a href="#" class="nav-dropdown-toggle"><span data-i18n="nav.more">更多</span> <span style="font-size: 0.8em;">▼</span></a>
                    <div class="nav-dropdown">
                        ${moreItems.map(navLink).join('')}
                    </div>
                </li>
            </ul>
            <div class="nav-lang-toggle">
                <button id="lang-zh" class="${zhClass}" type="button" aria-label="切换到中文" aria-pressed="${zhPressed}">中文</button>
                <button id="lang-en" class="${enClass}" type="button" aria-label="Switch to English" aria-pressed="${enPressed}">English</button>
            </div>
            <div class="hamburger" role="button" tabindex="0" aria-label="打开导航菜单" aria-controls="primary-navigation">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
})();
