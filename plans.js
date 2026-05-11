(function () {
    const planData = {
        'micro-schedules': {
            lane: '过去计划',
            laneKey: 'past',
            years: '2013-2015',
            title: '微型计划表',
            summary: '最早的计划像一个高密度执行器：考试、TOEFL、AIESEC、学习安排和每天的时间格子，核心是用纪律换未来的选择权。',
            image: 'images/plans/plan-2015-schedule.png',
            alt: 'Old handwritten schedule plan',
            points: ['短周期目标非常明确，适合冲刺和校正。', '时间被切成很多格，执行力优先于叙事感。', '这是后来所有长期系统的底层肌肉。'],
            tags: ['schedule', 'exam', 'discipline']
        },
        'future-plan-2015': {
            lane: '过去计划',
            laneKey: 'past',
            years: '2015-2018',
            title: '2015-2018 Future plan',
            summary: '这一页把未来写成一条高速轨道：Deutsche Bank、UQ tutor、honors、CS / Finance、MIT、Oxford、PhD 和奖学金。',
            image: 'images/plans/plan-2015-future.png',
            alt: '2015 future plan screenshot',
            points: ['职业与学术目标被放在同一个路径里。', '奖学金、Top 10、Oxford / MIT 是当时的坐标。', '它的能量不是浪漫，而是强烈的上升欲和选择权意识。'],
            tags: ['Oxford', 'MIT', 'Finance', 'CS']
        },
        'five-year-2020': {
            lane: '过去计划',
            laneKey: 'past',
            years: '2020-2025',
            title: '五年矩阵',
            summary: '2020 的五年计划开始从单一路径扩展成矩阵：健康、关系、工作、音乐同时被纳入长期规划。',
            image: 'images/plans/plan-reflection.png',
            alt: '2016 to 2020 reflection screenshot',
            points: ['Oxford thesis、Citadel 准备、爵士钢琴和制作同时出现。', 'Health 和 relationship 不再是边角，而是系统变量。', '这一步是从成就型计划转向生活型计划的拐点。'],
            tags: ['health', 'relationship', 'work', 'music']
        },
        'habits-2023': {
            lane: '现在计划',
            laneKey: 'current',
            years: '2022-2024',
            title: '习惯改变计划',
            summary: '这段计划进入“身体和关系的基础设施”：吃饭不分心、晚上 9 点后不进食、打坐、Berklee、恋爱、成都公司和 AI 工具逐渐并行。',
            image: 'images/plans/berklee-wide.jpg',
            alt: 'Berklee graduation wide stage',
            points: ['Berklee 写歌、Royster Lee、JVKE 进入创作参考系。', '成都公司、智能广告、智能客服、Robot Zi 进入工程线。', '体力恢复、母亲五年计划、亲密关系开始成为核心内容。'],
            tags: ['habit', 'Berklee', 'relationship', 'company']
        },
        'plan-2025': {
            lane: '现在计划',
            laneKey: 'current',
            years: '2025',
            title: '音乐 + 赚钱 + 亲密关系',
            summary: '2025 的关键词是音乐、赚钱和亲密关系。计划里有 Berklee、作曲、混音、Finance 目标、健康习惯，也有母亲需求和家庭照护。',
            image: 'images/plans/berklee-stage.jpg',
            alt: 'Berklee stage display',
            points: ['音乐从练习变成日常生产系统。', '赚钱从结果变成工具，用来解决事、办事、再赚钱。', '关系和家人被写进长期计划，而不是计划之外的变量。'],
            tags: ['music', 'finance', 'family', 'routine']
        },
        'plan-2026': {
            lane: '现在计划',
            laneKey: 'current',
            years: '2026',
            title: '音乐 + AI + 亲密关系',
            summary: '2026 的计划从“赚钱”进一步转向“表达与系统”：音乐成为主线，AI 成为资料和发布基础设施，亲密关系与家人照护进入长期设计。',
            image: 'images/plans/berklee-board.jpg',
            alt: 'Berklee class of 2026 board',
            points: ['5 月计划落到期末周、专辑筹备、AI10 日谈和 AI 项目制作。', 'Canvas 全部复制、微信信息数据库、social auto post 变成基础设施。', '日常感悟、vlog 和专辑制作开始连接成公开表达系统。'],
            tags: ['music', 'AI', 'relationship', 'album']
        },
        'oxford-citadel': {
            lane: '真实路线',
            laneKey: 'route',
            years: '2018-2022',
            title: 'Oxford / Citadel',
            summary: '真实路线没有抛弃早期计划，而是把它变成硬核底盘：统计、金融、量化、伦敦、香港、流程化和风险判断。',
            image: 'images/photos/academic-presentation.webp',
            alt: 'Academic presentation',
            points: ['学术线训练模型和表达，职业线训练判断和压力承受。', '金融不是结局，而是之后做公司、资产和 AI 系统的底层语言。', '这是“理性发动机”的成型期。'],
            tags: ['Oxford', 'Citadel', 'quant', 'risk']
        },
        'berklee-company': {
            lane: '真实路线',
            laneKey: 'route',
            years: '2023-2024',
            title: 'Berklee / Company / AI',
            summary: 'Berklee、成都公司、Robot Zi、GT、旅行、恢复、关系同时展开，真实路线开始从“单一职业答案”转成“多系统经营”。',
            image: 'images/timeline/docking-tech.jpg',
            alt: 'Docking Tech company visual',
            points: ['音乐学校和公司不是互斥项，而是共同训练表达、组织和判断。', 'AI 从工具变成长期工作流的雏形。', '关系、健康和旅行把计划拉回具体生活。'],
            tags: ['Berklee', 'company', 'AI', 'recovery']
        },
        'route-2026': {
            lane: '真实路线',
            laneKey: 'route',
            years: '2025-2026',
            title: '创作系统成形',
            summary: '真实路线的形状越来越清楚：音乐作品、AI 数据库、自动化发布、日常表达、亲密关系和家庭照护，不再是分散项目，而是同一个人生系统。',
            image: 'images/plans/berklee-board.jpg',
            alt: 'Berklee class of 2026 board',
            points: ['专辑、vlog、日常感悟和 social auto post 连接成公开表达。', 'Canvas 和微信数据库让 AI 可以真正理解长期上下文。', '早年的金融 / CS 能力被转译成现在的创作与生活系统。'],
            tags: ['album', 'AI archive', 'publishing', 'life system']
        }
    };

    const consoleEl = document.querySelector('.plan-console');
    const nodes = Array.from(document.querySelectorAll('.plan-node'));
    const filters = Array.from(document.querySelectorAll('.plan-filter'));
    const image = document.getElementById('plan-detail-img');
    const lane = document.getElementById('plan-detail-lane');
    const years = document.getElementById('plan-detail-years');
    const title = document.getElementById('plan-detail-title');
    const summary = document.getElementById('plan-detail-summary');
    const points = document.getElementById('plan-detail-points');
    const tags = document.getElementById('plan-detail-tags');

    if (!consoleEl || !nodes.length || !image || !lane || !years || !title || !summary || !points || !tags) {
        return;
    }

    let selectedId = 'plan-2026';

    function renderPlan(id, lockSelection) {
        const item = planData[id];
        if (!item) return;

        image.src = item.image;
        image.alt = item.alt;
        lane.textContent = item.lane;
        years.textContent = item.years;
        title.textContent = item.title;
        summary.textContent = item.summary;
        points.innerHTML = item.points.map((point) => `<li>${point}</li>`).join('');
        tags.innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join('');
        consoleEl.dataset.activeLane = item.laneKey;

        if (lockSelection) {
            selectedId = id;
            nodes.forEach((node) => {
                const isActive = node.dataset.planId === id;
                node.classList.toggle('active', isActive);
                node.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }
    }

    nodes.forEach((node) => {
        node.setAttribute('aria-pressed', node.classList.contains('active') ? 'true' : 'false');

        node.addEventListener('mouseenter', () => {
            renderPlan(node.dataset.planId, false);
        });

        node.addEventListener('focus', () => {
            renderPlan(node.dataset.planId, false);
        });

        node.addEventListener('mouseleave', () => {
            renderPlan(selectedId, false);
        });

        node.addEventListener('click', () => {
            renderPlan(node.dataset.planId, true);
        });
    });

    filters.forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;

            filters.forEach((filterButton) => {
                const isActive = filterButton === button;
                filterButton.classList.toggle('active', isActive);
                filterButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            document.querySelectorAll('.plan-lane').forEach((laneEl) => {
                const showLane = filter === 'all' || laneEl.dataset.lane === filter;
                laneEl.classList.toggle('is-muted', !showLane);
            });

            const firstVisible = nodes.find((node) => {
                const item = planData[node.dataset.planId];
                return filter === 'all' || item.laneKey === filter;
            });

            if (firstVisible) {
                renderPlan(firstVisible.dataset.planId, true);
            }
        });
    });

    document.querySelector('.plans-page')?.addEventListener('pointermove', (event) => {
        const x = Math.round((event.clientX / window.innerWidth) * 100);
        const y = Math.round((event.clientY / window.innerHeight) * 100);
        document.documentElement.style.setProperty('--plans-pointer-x', `${x}%`);
        document.documentElement.style.setProperty('--plans-pointer-y', `${y}%`);
    });

    renderPlan(selectedId, true);
})();
