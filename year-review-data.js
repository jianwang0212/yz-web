// 2025年度总结数据
const yearReviewData = {
    months: [
        {
            month: '1月',
            events: ['结婚 & 度蜜月']
        },
        {
            month: '2月',
            events: ['适应伯克利开学和 LY 基金和 Docking 的工作强度']
        },
        {
            month: '3月',
            events: [
                '音乐 - light it up',
                'Kevin Harris 的 PI',
                'UST, Sound Gym, Dorico, Pro Tools',
                'API Plus 录音房'
            ]
        },
        {
            month: '4月',
            events: [
                'LY 基金 - 美股大崩盘',
                'Mixing skill',
                '选秋季和夏季的课',
                '完美度过期中',
                '月牙湾大乐队抽象爵士作曲',
                'Rating 4',
                '开始创作自己的爵士语言笔记本'
            ]
        },
        {
            month: '5月',
            events: [
                '赚 60w',
                '散步习惯',
                '钢琴编曲(安静; 说谎)',
                'Bass 流行扒谱',
                '爵士标准曲背谱',
                '期末考完, GPA 继续 4.0'
            ]
        },
        {
            month: '6月',
            events: [
                '财务结构的升级',
                '降低主观交易的比重',
                '夏季开始上课',
                '2 场演出',
                '打坐习惯',
                'Bitget 的 Voxel 事件',
                'Synth 的学习(Vital), 捏音色',
                'API 的台子 mixing',
                '白雪公主原创的词曲钢琴编曲搞定',
                '爵士作曲 10 首'
            ]
        },
        {
            month: '7月',
            events: [
                'Davis project, 大型录音搞定',
                '期末考完, GPA 继续 4.0'
            ]
        },
        {
            month: '8月',
            events: [
                '老婆来美, 阿卡迪亚, 罗德岛',
                'MBTI 的学习和运用',
                'Jason 的 Mix Courses'
            ]
        },
        {
            month: '9月',
            events: [
                '未来三年的基金和 Docking 的定位方向战略制定',
                'Alex 打网球习惯养成一周两次',
                '见 Lam & 梦琪',
                '开始跟 Ray 做录混',
                '王者月',
                'Bybit ADL 事件',
                '秋季开学, reharm 和 latin 爵士',
                '入坞公司乔迁更高规格的新址, 营业额历史新高'
            ]
        },
        {
            month: '10月',
            events: [
                'MIT 的 master 的项目研究',
                'Bybit 的 seraph 的 ADL 事件',
                '每周混音, 每周录音, 每周作曲',
                'Producer ET 计划',
                'Ray 上课',
                '研究 OpenAI & n8n',
                '研究李飞飞'
            ]
        },
        {
            month: '11月',
            events: [
                '网球恢复到一年前水平',
                'Bybit 赔偿到位',
                'Ray 上课',
                'ZZT 鼓课计划',
                'Coding - Atlas + Cursor + Colab',
                '小小虫 SoundLike',
                '多得他 LiveTo2',
                'Davis project',
                '请人吃饭计划实施 KPI'
            ]
        },
        {
            month: '12月',
            events: [
                '研究段永平',
                '小波老师',
                '期末考试',
                '刘银基金网页设计',
                '鼓课、声乐课、贝斯课、流行键盘课、即兴课',
                'ICP 计划重启',
                '个人主页做完',
                '年度总结'
            ]
        }
    ]
};

// 渲染月度时间线
function renderMonthlyTimeline() {
    const container = document.getElementById('monthly-timeline');
    if (!container) return;
    
    yearReviewData.months.forEach((monthData, index) => {
        const monthCard = document.createElement('div');
        monthCard.className = 'month-card';
        monthCard.setAttribute('data-month', index + 1);
        
        const eventsList = monthData.events.map(event => 
            `<li>${event}</li>`
        ).join('');
        
        monthCard.innerHTML = `
            <div class="month-header">
                <span class="month-number">${index + 1}</span>
                <h4 class="month-name">${monthData.month}</h4>
            </div>
            <ul class="month-events">
                ${eventsList}
            </ul>
        `;
        
        container.appendChild(monthCard);
    });
}

// 初始化年度总结页面
document.addEventListener('DOMContentLoaded', () => {
    renderMonthlyTimeline();
    
    // 添加滚动进度指示
    const reviewContent = document.getElementById('review-content');
    const progressBar = document.querySelector('.progress-bar');
    
    if (reviewContent && progressBar) {
        const updateProgress = () => {
            const scrollTop = window.pageYOffset;
            const section = document.getElementById('year-review');
            if (!section) return;
            
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const windowHeight = window.innerHeight;
            
            if (scrollTop >= sectionTop - windowHeight && scrollTop <= sectionTop + sectionHeight) {
                const progress = ((scrollTop - sectionTop + windowHeight) / sectionHeight) * 100;
                progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
            }
        };
        
        window.addEventListener('scroll', updateProgress);
        updateProgress();
    }
    
    // 添加卡片进入动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.review-card').forEach(card => {
        observer.observe(card);
    });
});


