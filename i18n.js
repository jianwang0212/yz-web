// Internationalization (i18n) - 中英文切换
const translations = {
    zh: {
        // Navigation
        'nav.home': '首页',
        'nav.highlights': '主要亮点',
        'nav.experience': '经历',
        'nav.yearReview': '年度总结',
        'nav.interests': '兴趣爱好',
        'nav.works': '作品',
        'nav.contact': '联系',
        
        // Hero
        'hero.name': 'Zi Yin（银子）',
        'hero.tagline': '一本正经的胡说八道',
        'hero.subtitle': '计量经济学出身的量化研究员、创业者和音乐人',
        'hero.value': '在量化交易、创业和音乐创作之间寻找平衡，用数据驱动决策，用音乐表达情感。',
        
        // Info
        'info.origin': '籍贯：',
        'info.originValue': '湖南长沙',
        'info.location': '现居：',
        'info.locationValue': '波士顿 / 香港 / 伦敦 / 上海 / 长沙',
        'info.email': '邮箱：',
        
        // Highlights
        'highlights.title': '主要亮点',
        'highlights.academic.title': '学术',
        'highlights.academic.1': '昆士兰大学经济系研究助理和助教',
        'highlights.academic.2': '牛津大学疫情大数据研究项目研究员',
        'highlights.academic.3': '本科优秀毕业生，获得学术奖章',
        'highlights.professional.title': '职业',
        'highlights.professional.1': 'Citadel Securities 量化分析师/交易员',
        'highlights.professional.2': '入坞科技联合创始人',
        'highlights.professional.3': 'A47G 基金创始人',
        'highlights.professional.4': '曾管理500万美金加密货币量化投资，年化收益120%+',
        'highlights.music.title': '音乐',
        'highlights.music.1': '三岁起学习钢琴，通过最高等级考试',
        'highlights.music.2': '多年坚持原创音乐创作',
        'highlights.music.3': '现于伯克利音乐学院深造音乐制作与作曲',
        'highlights.other.title': '其他',
        'highlights.other.1': '热心参与国际志愿活动（曾赴罗马尼亚支教）',
        'highlights.other.2': '注重健身与健康（2021年体脂降至9%）',
        
        // Experience
        'experience.title': '人生时间线',
        'experience.timeline': '时间线',
        'experience.theme': '按主题',
        
        // Timeline
        'timeline.2009.title': '高中',
        'timeline.2009.desc': '就读于长沙长郡中学（本部理科班）',
        'timeline.2012.title': '大学',
        'timeline.2012.desc': '就读山东大学，与澳大利亚昆士兰大学2+2联合培养，获得计量经济学学士学位',
        'timeline.2016.title': '博士研究 & 创业',
        'timeline.2016.desc': '获昆士兰大学计量经济学全额奖学金攻读博士（研二辍学）。联合创办 Alfie Trading，担任 CTO 兼策略开发主管',
        'timeline.2018.title': '深造（学术硕士）',
        'timeline.2018.desc': '就读英国牛津大学，攻读经济学哲学硕士学位。参与牛津大学新冠病毒大数据研究项目。2018年以最优成绩从昆士兰大学毕业（学术奖章）',
        'timeline.2020.title': '对冲基金量化交易',
        'timeline.2020.desc': '就职于 Citadel Securities（城堡证券），担任量化股票分析师和期货交易员',
        'timeline.2023.title': '创业与音乐并行',
        'timeline.2023.desc': '联合创始成都入坞科技；创建 A47G 私募基金；赴伯克利音乐学院攻读音乐制作与工程、当代写作与制作以及爵士作曲方向硕士，GPA 4.0',
        
        // Theme
        'theme.academic.title': '学术',
        'theme.academic.1': '昆士兰大学经济系研究助理和助教',
        'theme.academic.2': '牛津大学疫情大数据研究项目研究员',
        'theme.academic.3': '本科优秀毕业生，获得学术奖章',
        'theme.academic.4': '牛津大学经济学哲学硕士学位',
        'theme.professional.title': '职业',
        'theme.professional.1': 'Citadel Securities 量化分析师/交易员',
        'theme.professional.2': 'Alfie Trading 联合创始人、CTO',
        'theme.professional.3': '入坞科技联合创始人',
        'theme.professional.4': 'A47G 私募基金创始人',
        'theme.music.title': '音乐',
        'theme.music.1': '三岁起学习钢琴，通过最高等级考试',
        'theme.music.2': '多年坚持原创音乐创作',
        'theme.music.3': '伯克利音乐学院音乐制作与工程硕士，GPA 4.0',
        
        // Financial
        'financial.title': '财务概览',
        'financial.subtitle': '近10年财务数据可视化（数据已脱敏处理）',
        'financial.summary': '摘要',
        'financial.trend': '趋势图',
        'financial.table': '数据表',
        'financial.summary.1.title': '投资表现',
        'financial.summary.1.desc': '加密货币量化投资年化收益率超过120%',
        'financial.summary.2.title': '基金规模',
        'financial.summary.2.desc': 'A47G 基金持续增长',
        'financial.summary.3.title': '风险控制',
        'financial.summary.3.desc': '严格的风险管理体系，回撤控制在合理范围',
        'financial.table.year': '年份',
        'financial.table.category': '类别',
        'financial.table.performance': '表现',
        
        // Interests
        'interests.title': '兴趣爱好',
        'interests.music.title': '音乐',
        'interests.music.piano': '钢琴：三岁起学习古典钢琴，12岁考取钢琴十级',
        'interests.music.guitar': '吉他：自高中起练习木吉他弹唱，曾组建/加入多个乐队',
        'interests.music.drums': '架子鼓：2018年开始自学架子鼓',
        'interests.music.other': '其他：略懂小提琴，热爱唱歌，擅长词曲创作',
        'interests.sports.title': '运动',
        'interests.sports.fitness': '健身：自2014年开始坚持力量训练（2021年体脂率9%）',
        'interests.sports.tennis': '网球：2016年起开始练习网球',
        'interests.sports.other': '其他：游泳、滑冰、滑雪、骑行',
        
        // Works
        'works.title': '作品与社交媒体',
        'works.music.title': '音乐作品',
        'works.zhihu.title': '知乎专栏',
        'works.zhihu.desc': '《为什么当一名交易员会累》',
        'works.netease.title': '网易云音乐',
        'works.netease.desc': '原创歌曲及电台节目',
        'works.youtube.title': 'YouTube',
        'works.youtube.desc': '个人频道/视频',
        'works.linkedin.title': 'LinkedIn',
        'works.linkedin.desc': '职业档案',
        'works.download.title': '作品下载',
        
        // Future
        'future.title': '未来展望',
        'future.career.title': '职业愿景',
        'future.career.desc': '在科技金融领域继续创新，推动创业项目取得阶段性成果',
        'future.music.title': '音乐目标',
        'future.music.desc': '发行个人音乐作品，尝试将科技和音乐融合',
        'future.personal.title': '个人发展',
        'future.personal.desc': '继续挑战自我，在多元领域保持平衡发展',
        
        // Contact
        'contact.title': '联系方式',
        'contact.message': '有任何交流或合作意向，欢迎发送邮件联系',
        'contact.signature': '期待您的来信，欢迎交流，共同探讨有趣的话题',
        
        // Footer
        'footer.text': '© 2024 Zi Yin. 保留所有权利。',
        'footer.quote': '本是后山人，偶做前堂客。醉舞经阁半卷书，坐井说天阔。大志戏功名，海斗量福祸。论到囊中羞涩时，怒指乾坤错。'
    },
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.highlights': 'Highlights',
        'nav.experience': 'Experience',
        'nav.yearReview': 'Year Review',
        'nav.interests': 'Interests',
        'nav.works': 'Works',
        'nav.contact': 'Contact',
        
        // Hero
        'hero.name': 'Zi Yin',
        'hero.tagline': 'Seriously talking nonsense',
        'hero.subtitle': 'Quantitative Researcher, Entrepreneur, and Musician with Econometrics background',
        'hero.value': 'Finding balance between quantitative trading, entrepreneurship, and music creation, using data to drive decisions and music to express emotions.',
        
        // Info
        'info.origin': 'Origin:',
        'info.originValue': 'Changsha, Hunan',
        'info.location': 'Current:',
        'info.locationValue': 'Boston / Hong Kong / London / Shanghai / Changsha',
        'info.email': 'Email:',
        
        // Highlights
        'highlights.title': 'Key Highlights',
        'highlights.academic.title': 'Academic',
        'highlights.academic.1': 'Research Assistant and Teaching Assistant at University of Queensland',
        'highlights.academic.2': 'Researcher at Oxford University COVID-19 Big Data Project',
        'highlights.academic.3': 'Outstanding Graduate with Academic Medal',
        'highlights.professional.title': 'Professional',
        'highlights.professional.1': 'Quantitative Analyst/Trader at Citadel Securities',
        'highlights.professional.2': 'Co-founder of RuWu Technology',
        'highlights.professional.3': 'Founder of A47G Fund',
        'highlights.professional.4': 'Managed $5M crypto quantitative investment with 120%+ annualized return',
        'highlights.music.title': 'Music',
        'highlights.music.1': 'Started piano at age 3, passed highest level exams',
        'highlights.music.2': 'Years of original music composition',
        'highlights.music.3': 'Currently studying Music Production and Composition at Berklee College of Music',
        'highlights.other.title': 'Other',
        'highlights.other.1': 'Active in international volunteering (taught in Romania)',
        'highlights.other.2': 'Fitness enthusiast (9% body fat in 2021)',
        
        // Experience
        'experience.title': 'Timeline',
        'experience.timeline': 'Timeline',
        'experience.theme': 'By Theme',
        
        // Timeline
        'timeline.2009.title': 'High School',
        'timeline.2009.desc': 'Attended Changjun High School (Science Class)',
        'timeline.2012.title': 'University',
        'timeline.2012.desc': 'Shandong University & University of Queensland 2+2 program, Bachelor in Econometrics',
        'timeline.2016.title': 'PhD & Entrepreneurship',
        'timeline.2016.desc': 'Full scholarship PhD at UQ (dropped out in year 2). Co-founded Alfie Trading as CTO and Strategy Lead',
        'timeline.2018.title': 'Master\'s Degree',
        'timeline.2018.desc': 'MPhil in Economics at University of Oxford. Participated in Oxford COVID-19 Big Data Project. Graduated from UQ with highest honors (Academic Medal)',
        'timeline.2020.title': 'Hedge Fund Trading',
        'timeline.2020.desc': 'Quantitative Equity Analyst and Futures Trader at Citadel Securities',
        'timeline.2023.title': 'Entrepreneurship & Music',
        'timeline.2023.desc': 'Co-founded RuWu Technology; Created A47G Private Fund; Studying Music Production, Contemporary Writing & Production, and Jazz Composition at Berklee, GPA 4.0',
        
        // Theme
        'theme.academic.title': 'Academic',
        'theme.academic.1': 'Research Assistant and Teaching Assistant at University of Queensland',
        'theme.academic.2': 'Researcher at Oxford University COVID-19 Big Data Project',
        'theme.academic.3': 'Outstanding Graduate with Academic Medal',
        'theme.academic.4': 'MPhil in Economics from University of Oxford',
        'theme.professional.title': 'Professional',
        'theme.professional.1': 'Quantitative Analyst/Trader at Citadel Securities',
        'theme.professional.2': 'Co-founder and CTO of Alfie Trading',
        'theme.professional.3': 'Co-founder of RuWu Technology',
        'theme.professional.4': 'Founder of A47G Private Fund',
        'theme.music.title': 'Music',
        'theme.music.1': 'Started piano at age 3, passed highest level exams',
        'theme.music.2': 'Years of original music composition',
        'theme.music.3': 'M.A. in Music Production and Engineering from Berklee, GPA 4.0',
        
        // Financial
        'financial.title': 'Financial Overview',
        'financial.subtitle': '10-Year Financial Data Visualization (Data Anonymized)',
        'financial.summary': 'Summary',
        'financial.trend': 'Trend Chart',
        'financial.table': 'Data Table',
        'financial.summary.1.title': 'Investment Performance',
        'financial.summary.1.desc': 'Crypto quantitative investment with 120%+ annualized return',
        'financial.summary.2.title': 'Fund Size',
        'financial.summary.2.desc': 'A47G Fund continues to grow',
        'financial.summary.3.title': 'Risk Control',
        'financial.summary.3.desc': 'Strict risk management system with controlled drawdowns',
        'financial.table.year': 'Year',
        'financial.table.category': 'Category',
        'financial.table.performance': 'Performance',
        
        // Interests
        'interests.title': 'Interests & Hobbies',
        'interests.music.title': 'Music',
        'interests.music.piano': 'Piano: Started classical piano at age 3, Grade 10 at age 12',
        'interests.music.guitar': 'Guitar: Acoustic guitar since high school, formed/joined multiple bands',
        'interests.music.drums': 'Drums: Self-taught since 2018',
        'interests.music.other': 'Other: Basic violin, passionate about singing, skilled in songwriting',
        'interests.sports.title': 'Sports',
        'interests.sports.fitness': 'Fitness: Strength training since 2014 (9% body fat in 2021)',
        'interests.sports.tennis': 'Tennis: Started in 2016',
        'interests.sports.other': 'Other: Swimming, ice skating, skiing, cycling',
        
        // Works
        'works.title': 'Works & Media',
        'works.music.title': 'Music Works',
        'works.zhihu.title': 'Zhihu Column',
        'works.zhihu.desc': 'Why Being a Trader is Exhausting',
        'works.netease.title': 'NetEase Cloud Music',
        'works.netease.desc': 'Original songs and radio programs',
        'works.youtube.title': 'YouTube',
        'works.youtube.desc': 'Personal channel/videos',
        'works.linkedin.title': 'LinkedIn',
        'works.linkedin.desc': 'Professional profile',
        'works.download.title': 'Download Works',
        
        // Future
        'future.title': 'Future Plans',
        'future.career.title': 'Career Vision',
        'future.career.desc': 'Continue innovation in fintech, achieve milestones in entrepreneurial projects',
        'future.music.title': 'Music Goals',
        'future.music.desc': 'Release personal music works, explore fusion of technology and music',
        'future.personal.title': 'Personal Development',
        'future.personal.desc': 'Continue challenging myself, maintain balanced development across multiple fields',
        
        // Contact
        'contact.title': 'Contact',
        'contact.message': 'For any inquiries or collaboration opportunities, please feel free to email',
        'contact.signature': 'Looking forward to your message. Welcome to connect and discuss interesting topics together',
        
        // Footer
        'footer.text': '© 2024 Zi Yin. All rights reserved.',
        'footer.quote': '本是后山人，偶做前堂客。醉舞经阁半卷书，坐井说天阔。大志戏功名，海斗量福祸。论到囊中羞涩时，怒指乾坤错。'
    }
};

let currentLang = localStorage.getItem('language') || 'zh';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`lang-${lang}`).classList.add('active');
}

// Initialize language
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
    
    // Language toggle buttons
    document.getElementById('lang-zh').addEventListener('click', () => setLanguage('zh'));
    document.getElementById('lang-en').addEventListener('click', () => setLanguage('en'));
});

