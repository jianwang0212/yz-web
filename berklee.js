(function () {
const berkleeTranslations = {
    zh: {
        'meta.title': 'Berklee 课程概览 - 银子 / Zi Yin',
        'meta.description': '银子 / Zi Yin 的 Berklee 课程概览：音乐制作、录音工程、爵士作曲、编曲、钢琴与音乐基础训练。',
        'nav.home': '首页',
        'nav.works': '作品',
        'nav.resume': '简历',
        'nav.highlights': '主要亮点',
        'hero.kicker': '伯克利音乐学院 · 课程地图',
        'hero.copy': '一个面向公众的 Berklee 学习地图：用 49 门课程概括我在音乐制作、录音工程、爵士作曲、编曲、钢琴与音乐基础上的训练结构。',
        'hero.courseButton': '课程地图',
        'hero.resumeButton': '简历',
        'overview.kicker': '概览',
        'overview.title': '三条主轴，理论与舞台训练做支撑。',
        'overview.copy': '课程重心很清楚：音乐制作 / 录音、写作 / 编曲、钢琴 / 键盘是主轴；和声 / 听训提供理论与听觉支撑，合奏与通识课程补足舞台、城市、人文与创造力训练。',
        'stats.courses': '课程',
        'stats.terms': '学期',
        'stats.core': '主轴课程',
        'focus.kicker': '训练结构',
        'focus.title': '从制作系统，到作曲语言，再到键盘身体性。',
        'focus.production.title': '录音制作',
        'focus.production.copy': '音频技术、MIDI 系统、录音技术、批判性聆听、人声制作、多轨录音与混音。',
        'focus.writing.title': '作曲编曲',
        'focus.writing.copy': '编曲、对位、groove writing、人声写作、DAW 写作、高级合奏写作与爵士作曲。',
        'focus.piano.title': '钢琴主修',
        'focus.piano.copy': '钢琴私人课，以及 comping、gospel keys、重配和声、Monk 语言、左手 bass、upper structures 与 Latin 风格。',
        'course.kicker': '课程地图',
        'course.title': '49 门课按学科方向整理。',
        'course.controlsAria': '课程筛选',
        'course.searchLabel': '搜索',
        'course.searchPlaceholder': '课程代码或课程名',
        'filter.all': '全部',
        'count.shown': shown => `显示 ${shown} / ${berkleeCourses.length} 门课`,
        'cluster.count': count => `${count} 门课`,
        'footer.home': '首页'
    },
    en: {
        'meta.title': 'Berklee Course Map - Zi Yin',
        'meta.description': 'Zi Yin\'s Berklee course map across music production, recording, jazz composition, arranging, piano, and musicianship.',
        'nav.home': 'Home',
        'nav.works': 'Works',
        'nav.resume': 'Resume',
        'nav.highlights': 'Highlights',
        'hero.kicker': 'Berklee College of Music · Course Map',
        'hero.copy': 'A public map of my Berklee education: 49 courses across music production, recording, jazz composition, arranging, piano, and musicianship.',
        'hero.courseButton': 'Course map',
        'hero.resumeButton': 'Resume',
        'overview.kicker': 'Overview',
        'overview.title': 'Three main axes, supported by theory and performance placement.',
        'overview.copy': 'The center of gravity is clear: production / recording, writing / arranging, and piano / keyboard form the core; harmony and ear training provide the theory engine, while ensemble and liberal arts courses broaden the frame.',
        'stats.courses': 'Courses',
        'stats.terms': 'Terms',
        'stats.core': 'Core-track courses',
        'focus.kicker': 'Training shape',
        'focus.title': 'From production systems to writing language to keyboard fluency.',
        'focus.production.title': 'Studio production',
        'focus.production.copy': 'Audio technology, MIDI systems, recording technique, critical listening, vocal production, multitrack recording, and mixing.',
        'focus.writing.title': 'Writing & arranging',
        'focus.writing.copy': 'Arranging, counterpoint, groove writing, vocal writing, DAW writing, advanced ensemble writing, and jazz composition.',
        'focus.piano.title': 'Piano principal',
        'focus.piano.copy': 'Private piano instruction plus comping, gospel keys, reharmonization, Monk language, left-hand bass, upper structures, and Latin styles.',
        'course.kicker': 'Course map',
        'course.title': '49 courses grouped by discipline.',
        'course.controlsAria': 'Course filters',
        'course.searchLabel': 'Search',
        'course.searchPlaceholder': 'Course code or title',
        'filter.all': 'All',
        'count.shown': shown => `${shown} / ${berkleeCourses.length} courses shown`,
        'cluster.count': count => `${count} courses`,
        'footer.home': 'Homepage'
    }
};

const courseCategories = [
    {
        id: 'production',
        label: 'Music Production / Recording / Music Technology',
        labelZh: '音乐制作 / 录音 / 音乐科技',
        summary: 'Audio technology, MIDI systems, production analysis, critical listening, multitrack recording, vocal production, mixing, and musician-facing machine learning.',
        summaryZh: '覆盖音频技术、MIDI 系统、制作分析、批判性聆听、多轨录音、人声制作、混音，以及面向音乐人的机器学习。'
    },
    {
        id: 'writing',
        label: 'Writing / Composition / Arranging',
        labelZh: '写作 / 作曲 / 编曲',
        summary: 'Arranging, counterpoint, groove writing, sequencing, DAW writing, vocal writing, advanced ensemble writing, and jazz composition.',
        summaryZh: '从编曲、对位、groove writing、sequencing、DAW 写作、人声写作，到高级合奏写作与爵士作曲。'
    },
    {
        id: 'musicianship',
        label: 'Harmony / Ear Training / Musicianship',
        labelZh: '和声 / 听训 / 音乐基础',
        summary: 'Harmony, reharmonization, tonal and harmonic ear training, atonal solfege, and the listening discipline behind writing and production decisions.',
        summaryZh: '包括和声、重配和声、调性与和声听训、无调性视唱，以及支撑写作与制作判断的听觉训练。'
    },
    {
        id: 'piano',
        label: 'Piano / Keyboard Performance',
        labelZh: '钢琴 / 键盘演奏',
        summary: 'Piano principal studies plus comping, gospel organ, gospel reharmonization, Thelonious Monk language, left-hand bass, upper structures, and Latin comping.',
        summaryZh: '钢琴主修课程，加上 comping、gospel organ、gospel reharmonization、Thelonious Monk 语言、左手 bass、upper structures 与 Latin comping。'
    },
    {
        id: 'ensemble',
        label: 'Ensemble / Rating / Performance Placement',
        labelZh: '合奏 / 评级 / 演奏分级',
        summary: 'Performance placement and small-band jazz rating courses that locate classroom training inside live ensemble standards.',
        summaryZh: '演奏分级与小乐队爵士评级，把课堂训练放回合奏和现场演奏标准里。'
    },
    {
        id: 'liberal',
        label: 'Liberal Arts / Creativity / Wellness',
        labelZh: '通识 / 创造力 / 身心训练',
        summary: 'Boston context, literature, effortless mastery, and embodied creativity courses that broaden the artistic and human frame.',
        summaryZh: '城市、人文、文学、effortless mastery 与身体创造力训练，补足音乐学习之外的艺术和人的维度。'
    }
];

const berkleeCourses = [
    ['production', 'MP-211', 'Audio Technology 1', 'Spring 2025'],
    ['production', 'MP-212', 'Audio Technology 2', 'Summer 2025'],
    ['production', 'MP-214', 'Critical Listening Lab', 'Spring 2025'],
    ['production', 'MP-215', 'Production Analysis Lab', 'Spring 2025'],
    ['production', 'MP-225', 'Audio & MIDI Systems for Music Production', 'Spring 2025'],
    ['production', 'MP-226', 'Advanced Audio and MIDI Production', 'Summer 2025'],
    ['production', 'MP-241', 'Mix Techniques', 'Summer 2025'],
    ['production', 'MP-318', 'Fundamentals of Music Production', 'Fall 2025'],
    ['production', 'MP-320', 'Studio Production for Records', 'Spring 2026'],
    ['production', 'MP-340', 'Multitrack Recording Techniques', 'Fall 2025'],
    ['production', 'MP-341', 'Mix Techniques 2', 'Fall 2025'],
    ['production', 'MP-343', 'Vocal Tech for Records', 'Spring 2026'],
    ['production', 'MP-385', 'Advanced Recording Techniques', 'Spring 2026'],
    ['production', 'MTEC-345', 'Machine Learning for Musicians', 'Fall 2025'],
    ['writing', 'AR-111', 'Arranging 1', 'Spring 2024'],
    ['writing', 'AR-124', 'Arranging 2', 'Summer 2024'],
    ['writing', 'AR-201', 'Chord Scale Voicings for Arranging', 'Spring 2025'],
    ['writing', 'CP-210', 'Art of Counterpoint 1', 'Summer 2024'],
    ['writing', 'CW-171', 'Groove Writing', 'Summer 2024'],
    ['writing', 'CW-191', 'Sequencing & Production Techniques', 'Summer 2024'],
    ['writing', 'CW-211', 'Advanced Ensemble Writing', 'Spring 2026'],
    ['writing', 'CW-216', 'Vocal Writing', 'Spring 2025'],
    ['writing', 'CW-261', 'DAW Writing & Production', 'Spring 2025'],
    ['writing', 'CM-371', 'Jazz Composition 1', 'Summer 2025'],
    ['musicianship', 'ET-123', 'Ear Training 2', 'Spring 2024'],
    ['musicianship', 'ET-211', 'Ear Training 3', 'Summer 2024'],
    ['musicianship', 'ET-212', 'Ear Training 4', 'Spring 2025'],
    ['musicianship', 'ET-331', 'Harmonic Ear Training 1', 'Fall 2025'],
    ['musicianship', 'ET-332', 'Harmonic Ear Training 2', 'Spring 2026'],
    ['musicianship', 'ET-421', 'Atonal Solfege 1', 'Spring 2026'],
    ['musicianship', 'HR-212', 'Harmony 4', 'Summer 2024'],
    ['musicianship', 'HR-213', 'Harmony 3', 'Spring 2024'],
    ['musicianship', 'HR-325', 'Reharmonization Techniques', 'Fall 2025'],
    ['piano', 'PIANO', 'Private Instruction Piano - Francesca Tanksley', 'Spring 2024'],
    ['piano', 'PIANO', 'Private Instruction Piano - John Arcaro', 'Summer 2024'],
    ['piano', 'PIANO', 'Private Instruction Piano - Kevin Harris', 'Spring 2025'],
    ['piano', 'ILPN-122', 'Keyboard Lab - Comping 2', 'Spring 2024'],
    ['piano', 'ILPN-201', 'Intro Gospel Organ Techniques', 'Spring 2026'],
    ['piano', 'ILPN-210', 'Gospel Keys Reharmonization Techniques', 'Spring 2026'],
    ['piano', 'ILPN-223', 'Thelonious Monk Explorations', 'Spring 2026'],
    ['piano', 'ILPN-225', 'Left Hand Bass Techniques', 'Spring 2024'],
    ['piano', 'ILPN-235', 'Upper Structure Triad Applications', 'Spring 2025'],
    ['piano', 'ILPN-243', 'Advanced Stylistic Comping - Latin', 'Fall 2025'],
    ['ensemble', 'ENMX-121', 'Mixed Styles Rating 2', 'Spring 2024'],
    ['ensemble', 'ENJZ-200', 'Small Band Jazz Rating 3', 'Summer 2024'],
    ['liberal', 'LENS-103', 'Engaging With Boston', 'Spring 2024'],
    ['liberal', 'LENG-223', 'Unreal Literature', 'Spring 2024'],
    ['liberal', 'PSEM-200', 'Effortless Mastery 1', 'Fall 2025'],
    ['liberal', 'PSH-263', 'Qigong Mastery of Creativity', 'Spring 2026']
].map(([category, code, title, term]) => ({ category, code, title, term }));

const termLabelsZh = {
    'Spring 2024': '2024 春季',
    'Summer 2024': '2024 夏季',
    'Spring 2025': '2025 春季',
    'Summer 2025': '2025 夏季',
    'Fall 2025': '2025 秋季',
    'Spring 2026': '2026 春季'
};

const supportedLanguages = new Set(['zh', 'en']);
const storedLanguage = localStorage.getItem('language');
let currentLang = supportedLanguages.has(storedLanguage) ? storedLanguage : 'zh';
let activeCategory = 'all';

const categoryById = new Map(courseCategories.map(category => [category.id, category]));
const filterMount = document.getElementById('berklee-filter-buttons');
const coursesMount = document.getElementById('berklee-courses');
const searchInput = document.getElementById('berklee-course-search');
const countMount = document.getElementById('berklee-course-count');

function translation(key, ...args) {
    const value = berkleeTranslations[currentLang][key] || berkleeTranslations.zh[key] || key;
    return typeof value === 'function' ? value(...args) : value;
}

function categoryLabel(category) {
    return currentLang === 'zh' ? category.labelZh : category.label;
}

function categorySummary(category) {
    return currentLang === 'zh' ? category.summaryZh : category.summary;
}

function formatTerm(term) {
    return currentLang === 'zh' ? (termLabelsZh[term] || term) : term;
}

function countCoursesFor(categoryId) {
    return berkleeCourses.filter(course => course.category === categoryId).length;
}

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function updateLanguageButtons() {
    document.querySelectorAll('.lang-btn, .lang-btn-mobile').forEach(button => {
        const isActive = button.id === `lang-${currentLang}` || button.id === `lang-${currentLang}-mobile`;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function applyStaticTranslations() {
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    document.title = translation('meta.title');

    const description = document.querySelector('meta[name="description"]');
    if (description) {
        description.content = translation('meta.description');
    }

    document.querySelectorAll('[data-berklee-i18n]').forEach(element => {
        element.textContent = translation(element.dataset.berkleeI18n);
    });

    document.querySelectorAll('[data-berklee-placeholder]').forEach(element => {
        element.setAttribute('placeholder', translation(element.dataset.berkleePlaceholder));
    });

    document.querySelectorAll('[data-berklee-aria-label]').forEach(element => {
        element.setAttribute('aria-label', translation(element.dataset.berkleeAriaLabel));
    });
}

function renderFilters() {
    if (!filterMount) return;

    filterMount.textContent = '';

    const filters = [
        { id: 'all', label: translation('filter.all'), count: berkleeCourses.length },
        ...courseCategories.map(category => ({
            id: category.id,
            label: categoryLabel(category),
            count: countCoursesFor(category.id)
        }))
    ];

    filters.forEach(filter => {
        const button = createElement('button', '', `${filter.label} ${filter.count}`);
        button.type = 'button';
        button.dataset.filter = filter.id;
        button.classList.toggle('is-active', filter.id === activeCategory);
        button.setAttribute('aria-pressed', filter.id === activeCategory ? 'true' : 'false');
        button.addEventListener('click', () => {
            activeCategory = filter.id;
            filterMount.querySelectorAll('button').forEach(item => {
                const isActive = item.dataset.filter === activeCategory;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            applyFilters();
        });
        filterMount.appendChild(button);
    });
}

function renderCourseCard(course) {
    const category = categoryById.get(course.category);
    const card = createElement('article', 'course-card');
    card.dataset.category = course.category;
    card.dataset.search = [
        course.code,
        course.title,
        course.term,
        termLabelsZh[course.term],
        category.label,
        category.labelZh,
        category.summary,
        category.summaryZh
    ].join(' ').toLowerCase();

    card.appendChild(createElement('code', '', course.code));
    card.appendChild(createElement('h4', '', course.title));
    card.appendChild(createElement('p', '', categoryLabel(category)));
    card.appendChild(createElement('span', 'course-term', formatTerm(course.term)));

    return card;
}

function renderCourses() {
    if (!coursesMount) return;

    coursesMount.textContent = '';

    courseCategories.forEach(category => {
        const section = createElement('section', 'course-cluster');
        section.dataset.category = category.id;

        const header = createElement('div', 'course-cluster-header');
        const copy = createElement('div');
        copy.appendChild(createElement('h3', '', categoryLabel(category)));
        copy.appendChild(createElement('p', '', categorySummary(category)));
        header.appendChild(copy);
        header.appendChild(createElement('div', 'course-cluster-count', translation('cluster.count', countCoursesFor(category.id))));

        const grid = createElement('div', 'course-grid');
        berkleeCourses
            .filter(course => course.category === category.id)
            .forEach(course => grid.appendChild(renderCourseCard(course)));

        section.appendChild(header);
        section.appendChild(grid);
        coursesMount.appendChild(section);
    });
}

function applyFilters() {
    if (!coursesMount || !countMount) return;

    const query = (searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;

    coursesMount.querySelectorAll('.course-cluster').forEach(section => {
        let sectionVisible = false;
        const categoryMatches = activeCategory === 'all' || section.dataset.category === activeCategory;

        section.querySelectorAll('.course-card').forEach(card => {
            const searchMatches = !query || card.dataset.search.includes(query);
            const visible = categoryMatches && searchMatches;
            card.classList.toggle('is-hidden', !visible);
            if (visible) {
                sectionVisible = true;
                visibleCount += 1;
            }
        });

        section.classList.toggle('is-hidden', !sectionVisible);
    });

    countMount.textContent = translation('count.shown', visibleCount);
}

function setLanguage(lang) {
    if (!supportedLanguages.has(lang)) return;

    currentLang = lang;
    localStorage.setItem('language', lang);
    applyStaticTranslations();
    renderFilters();
    renderCourses();
    applyFilters();
    updateLanguageButtons();
}

function bindLanguageControls() {
    document.querySelectorAll('#lang-zh, #lang-zh-mobile').forEach(button => {
        button.addEventListener('click', () => setLanguage('zh'));
    });

    document.querySelectorAll('#lang-en, #lang-en-mobile').forEach(button => {
        button.addEventListener('click', () => setLanguage('en'));
    });

    window.addEventListener('site-language-change', (event) => {
        setLanguage(event.detail?.lang || localStorage.getItem('language') || 'zh');
    });
}

function initBerkleeCoursePage() {
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    bindLanguageControls();
    setLanguage(currentLang);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBerkleeCoursePage);
} else {
    initBerkleeCoursePage();
}
})();
