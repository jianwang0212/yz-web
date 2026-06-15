const worldData = {
    past: {
        label: '过去的计划',
        date: '2014-2018',
        title: '把名校 offer 写成一个可执行工程',
        summary: '在澳洲时，计划已经不是“这学期考好”，而是用 UQ 的满绩点、学术奖章、论文、tutor 和教授信任，换取 MIT / Oxford 级别的申请筹码。',
        points: [
            '第一目标是 MIT Finance，接着是 Oxford Finance；如果能读 PhD 就继续读。',
            '为了拿到 offer，UQ 阶段必须制造强信号：GPA、medal、paper、professor trust。',
            '教育经历不是装饰，而是进入世界最好公司和资本系统的敲门砖。'
        ],
        tags: ['MIT / Oxford', 'UQ Medal', 'Finance', 'PhD option']
    },
    current: {
        label: '现在的计划',
        date: '2026-05-11',
        title: '2026 年年度计划：音乐、AI、亲密关系',
        summary: '这份计划记录于 2026-05-11。当前计划不再只追求职业上升，而是在设计表达系统：专辑、AI 数据库、social auto post、日常感悟、亲密关系和家庭照护被放进同一个长期结构里。',
        points: [
            '音乐成为主线：期末周、专辑筹备、制作复盘和公开作品继续推进。',
            'AI 成为基础设施：Canvas、微信信息数据库、AI10 日谈、自动发布系统。',
            '亲密关系和家人照护不再是计划之外的变量，而是 2026 年计划的一部分。'
        ],
        tags: ['2026 annual plan', 'album', 'AI archive', 'relationship']
    },
    route: {
        label: '真实路线',
        date: '2018-2026',
        title: '真实路线把多个系统合并成自由',
        summary: '真实发生的路线没有照字面复制早期计划，但兑现了主线：名校教育、量化金融、公司、AI、音乐和经济独立，最后变成一种可以自己安排人生的能力。',
        points: [
            'Oxford 和 Citadel 把早期金融/学术计划变成硬核底盘。',
            'Berklee、公司和 AI 把理性能力转译成创作、工具和公开表达。',
            '经济独立的意义，是更少被别人干扰，可以把时间投向真正想做的事。'
        ],
        tags: ['Oxford', 'Citadel', 'Berklee', 'Autonomy']
    }
};

const evidenceData = {
    future: {
        year: '2015',
        title: 'Future plan',
        summary: '这一页把未来写成一条高速轨道：Deutsche Bank、UQ tutor、honors、CS / Finance、MIT、Oxford、PhD 和奖学金。',
        image: '/images/plans/plan-2015-future.png',
        alt: '2015 future plan screenshot'
    },
    schedule: {
        year: '2015',
        title: 'Weekly execution',
        summary: '最早的计划不是空中楼阁。旁边跟着密密麻麻的学习、考试、阅读、作业和生活安排，把远期目标落到每一周。',
        image: '/images/plans/plan-2015-schedule.png',
        alt: '2015 schedule screenshot'
    },
    medal: {
        year: 'UQ',
        title: 'Academic signal',
        summary: '满绩点、学术奖章、论文和教授信任，是早期计划里用来换取名校申请机会的第一层硬信号。',
        image: '/images/credentials/uq-bachelor-medal.jpg',
        alt: 'UQ Bachelor Medal'
    },
    oxford: {
        year: 'Oxford',
        title: 'Result signal',
        summary: 'Oxford 不是孤立结果，而是早期计划链条里“名校教育作为敲门砖”的兑现，之后继续通向量化金融和经济独立。',
        image: '/images/credentials/oxford-mphil.jpg',
        alt: 'Oxford MPhil certificate'
    }
};

const page = document.querySelector('.plan-essay-page');
const worldButtons = Array.from(document.querySelectorAll('.world-poster'));
const evidenceButtons = Array.from(document.querySelectorAll('.evidence-card'));

const worldEls = {
    label: document.getElementById('world-inspector-label'),
    date: document.getElementById('world-inspector-date'),
    title: document.getElementById('world-inspector-title'),
    summary: document.getElementById('world-inspector-summary'),
    points: document.getElementById('world-inspector-points'),
    tags: document.getElementById('world-inspector-tags')
};

const evidenceEls = {
    year: document.getElementById('evidence-year'),
    title: document.getElementById('evidence-title'),
    summary: document.getElementById('evidence-summary')
};

const lightbox = document.querySelector('.evidence-lightbox');
const lightboxPanel = document.querySelector('.lightbox-panel');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxEls = {
    year: document.getElementById('lightbox-year'),
    title: document.getElementById('lightbox-title'),
    summary: document.getElementById('lightbox-summary')
};
const lightboxCloseButtons = Array.from(document.querySelectorAll('.lightbox-close, .lightbox-backdrop'));
let lastFocusedElement = null;

function renderWorld(worldId) {
    const item = worldData[worldId] || worldData.past;

    worldEls.label.textContent = item.label;
    worldEls.date.textContent = item.date;
    worldEls.title.textContent = item.title;
    worldEls.summary.textContent = item.summary;
    worldEls.points.innerHTML = item.points.map((point) => `<li>${point}</li>`).join('');
    worldEls.tags.innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join('');

    worldButtons.forEach((button) => {
        const active = button.dataset.world === worldId;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function renderEvidence(evidenceId) {
    const item = evidenceData[evidenceId] || evidenceData.future;

    evidenceEls.year.textContent = item.year;
    evidenceEls.title.textContent = item.title;
    evidenceEls.summary.textContent = item.summary;

    evidenceButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.evidence === evidenceId);
    });
}

function openEvidenceLightbox(evidenceId) {
    const item = evidenceData[evidenceId] || evidenceData.future;

    if (!lightbox || !lightboxImage || !lightboxPanel) return;

    lightboxImage.src = item.image;
    lightboxImage.alt = item.alt;
    lightboxEls.year.textContent = item.year;
    lightboxEls.title.textContent = item.title;
    lightboxEls.summary.textContent = item.summary;

    lastFocusedElement = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    lightboxPanel.focus();
}

function closeEvidenceLightbox() {
    if (!lightbox) return;

    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
}

worldButtons.forEach((button) => {
    const worldId = button.dataset.world;
    button.addEventListener('click', () => renderWorld(worldId));
    button.addEventListener('mouseenter', () => renderWorld(worldId));
});

evidenceButtons.forEach((button) => {
    const evidenceId = button.dataset.evidence;
    button.addEventListener('click', () => {
        renderEvidence(evidenceId);
        openEvidenceLightbox(evidenceId);
    });
    button.addEventListener('mouseenter', () => renderEvidence(evidenceId));
});

lightboxCloseButtons.forEach((button) => {
    button.addEventListener('click', closeEvidenceLightbox);
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox && !lightbox.hidden) {
        closeEvidenceLightbox();
    }
});

window.addEventListener('pointermove', (event) => {
    if (!page) return;

    const x = Math.round((event.clientX / window.innerWidth) * 100);
    const y = Math.round((event.clientY / window.innerHeight) * 100);
    page.style.setProperty('--pointer-x', `${x}%`);
    page.style.setProperty('--pointer-y', `${y}%`);
});

renderWorld('past');
renderEvidence('future');
