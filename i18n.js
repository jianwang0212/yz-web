// Internationalization (i18n) - 中英文切换
// Initialize current language from localStorage or default to Chinese
let currentLang = localStorage.getItem('language') || 'zh';

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
        'nav.more': '更多',
        'nav.timeline': '时间线',
        'nav.resume': '简历',
        'nav.finance': '财务仪表盘',
        'nav.projects': '项目',
        
        // Hero
        'hero.name': 'Zi Yin（银子）',
        'hero.tagline': '一本正经的胡说八道',
        'hero.title': '量化研究员 · 创业者 · 音乐人',
        'hero.subtitle': '市场训练直觉，数据塑造纪律，音乐完善判断。',
        'hero.identity.left': 'A47G 基金创始人',
        'hero.identity.right': '牛津大学量化研究员',
        'hero.experience.left': 'Citadel Securities',
        'hero.experience.right': '量化交易员',
        'hero.training.left': '伯克利音乐学院',
        'hero.training.right': 'GPA 4.0',
        'hero.metric1': '管理过 $5M+ 量化资产 ｜最高年化 120%+',
        'hero.metric2': 'Citadel Securities 前量化交易员',
        'hero.metric3': '伯克利音乐学院（Berklee College of Music） — GPA 4.0（音乐人中极少见）',
        'hero.cta': '合作 / 咨询 → Email',
        'hero.cta.mobile': '合作与研究联系 → Email',
        'hero.value.zh': '我做过许多看似不相关的事情。<br>但它们在我这里，指向同一个问题：<br>如何在复杂系统中做出高质量决策。',
        'hero.value.en': 'I work across seemingly unrelated fields.<br>In my case, they converge on one question:<br>how to make high-quality decisions in complex systems.',
        
        // Entry
        'entry.title': '探索不同维度的长期记录',
        'entry.timeline.title': '人生时间线',
        'entry.timeline.desc': '长期决策与阶段反思记录',
        'entry.timeline.link': '→ 查看时间线',
        'entry.highlights.title': '主要亮点',
        'entry.highlights.desc': '学术、职业、音乐与其他成就',
        'entry.highlights.link': '→ 查看亮点',
        'entry.works.title': '音乐与作品',
        'entry.works.desc': '创作、演出与训练记录',
        'entry.works.link': '→ 查看作品',
        'entry.review.title': '年度总结',
        'entry.review.desc': '目标、复盘与偏差校正',
        'entry.review.link': '→ 阅读年度总结',
        
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
        'highlights.academic.3': '昆士兰大学本科大学奖章获得者',
        'highlights.professional.title': '职业',
        'highlights.professional.1': 'Citadel Securities 量化交易员',
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
        'theme.professional.1': 'Citadel Securities 量化交易员',
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
        'footer.quote': '本是后山人，偶做前堂客。醉舞经阁半卷书，坐井说天阔。大志戏功名，海斗量福祸。论到囊中羞涩时，怒指乾坤错。',
        
        // Projects
        'projects.title': '项目 / Projects',
        'projects.vipassana_title': '内观（Vipassana）',
        'projects.vipassana_desc': '关于内观冥想实践的思考与记录',
        'projects.back': '← 返回项目',
        'projects.vipassana.content.intro': '内观（Vipassana）是一种古老的冥想实践，旨在通过观察身体感受来培养觉知和智慧。这篇文章记录了我对内观实践的思考与体验。',
        'projects.vipassana.content.section1.title': '什么是内观',
        'projects.vipassana.content.section1.text': '内观是巴利语 Vipassana 的音译，意为"洞察"或"如实观察"。这是一种通过系统观察身体感受来净化心灵的方法。',
        'projects.vipassana.content.section2.title': '实践体验',
        'projects.vipassana.content.section2.text': '在实践过程中，我逐渐学会了如何不带评判地观察身体感受，这帮助我更好地理解自己的身心关系。',
        'projects.vipassana.content.footer': '本文将持续更新，记录更多实践心得与思考。',
        
        // Vipassana Article - Main Content
        'vipassana.title': '我如何接触到 Vipassana（内观）｜10天静默体验与收获',
        'vipassana.meta': '2022-11-06 · 约 7 分钟阅读',
        'vipassana.lastUpdate': '最后更新：2024-10-09',
        'vipassana.intensity.label': '课程强度：',
        'vipassana.intensity.days': '10天',
        'vipassana.intensity.silent': '静默',
        'vipassana.intensity.hours': '每日≈10小时',
        'vipassana.intensity.nophone': '无手机',
        'vipassana.tldr.title': 'TL;DR',
        'vipassana.tldr.1': '我参加了一次 10 天静默内观（Vipassana）课程：无手机、无交流、每天长时间静坐。',
        'vipassana.tldr.2': '最大收获不是"神秘体验"，而是对 <strong>觉察（awareness）</strong> 与 <strong>平等心（equanimity）</strong> 的训练更可感了。',
        'vipassana.tldr.3': '我主观感到：专注更稳定、对身体与情绪的"早期信号"更敏感；睡眠与一些身体不适在课程中阶段性缓解。',
        'vipassana.tldr.4': '<strong>重要：</strong>这只是个人体验；不构成医疗建议；不同人反应差异很大。',
        'vipassana.section1.title': '1) 我为什么去',
        'vipassana.section1.p1': '我第一次听说 Vipassana（内观）是在 2021 年 11 月：一位朋友辞职后写复盘，提到静坐对他影响很大。我当时在香港报名，结果排期等了一年，终于在 2022-10-26 参加。',
        'vipassana.section1.p2': '我想验证的不是"灵性结果"，而是一个更现实的问题：在高强度约束下，我能否观察并管理自己的注意力与反应？',
        'vipassana.section2.title': '2) 我做了哪些挑战',
        'vipassana.section2.p1': '这次课程对我来说像"极限版的注意力训练营"：',
        'vipassana.section2.li1': '<strong>10 天静默：</strong>不说话、不交流',
        'vipassana.section2.li2': '<strong>无电子设备：</strong>手机/电脑/手表/网络都没有',
        'vipassana.section2.li3': '<strong>饮食约束：</strong>以素食为主（具体安排以课程为准）',
        'vipassana.section2.li4': '<strong>作息固定：</strong>早起、睡眠压缩（不同中心可能不同）',
        'vipassana.section2.li5': '<strong>长时间静坐：</strong>每天大量时间在坐禅与行禅之间切换',
        'vipassana.section2.li6': '<strong>生活极简：</strong>大部分时间只剩 睡觉/吃饭/练习/必要活动',
        'vipassana.section2.p2': '我没有期待"神奇效果"，更多是想把自己放进一个可控的实验环境里。',
        'vipassana.section3.title': '3) 参加完后，最大的收获是什么',
        'vipassana.section3.1.title': '3.1 心（mind）：更早觉察到"反应的起点"',
        'vipassana.section3.1.p1': '我最明显的变化是：情绪或冲动还没长成"剧情"，我更早就能察觉到它的身体信号。',
        'vipassana.section3.1.li1': '<strong>以前：</strong>刺激 → 自动反应 → 事后才意识到',
        'vipassana.section3.1.li2': '<strong>现在（更接近）：</strong>刺激 → 感受到身体/心理的起势 → 选择是否继续反应',
        'vipassana.section3.1.p2': '对我来说，这种"提前量"很关键：它让自控更像技术问题，而不是道德自责。',
        'vipassana.section3.2.title': '3.2 身（body）：部分状态在课程中阶段性改善',
        'vipassana.section3.2.p1': '我主观感到睡眠质量上升、起床更清醒；一些身体不适在课程中有缓解（包括疼痛与不适感的处理方式变化）。',
        'vipassana.section3.2.p2': '但我不把它当作稳定结论：离开课程环境后能否保持，需要长期观察与复盘。',
        'vipassana.section4.title': '4) 我理解的核心机制：觉察 + 平等心',
        'vipassana.section4.note.title': 'Note：术语解释',
        'vipassana.section4.note.awareness': '<strong>觉察（awareness）：</strong>更清楚地"看到正在发生什么"（呼吸、触感、情绪起势）。',
        'vipassana.section4.note.equanimity': '<strong>平等心（equanimity）：</strong>看到之后，不立刻追加"喜欢/讨厌/必须马上改变"的自动反应。',
        'vipassana.section4.p1': '这两者结合起来，带来一个实际效果：',
        'vipassana.section4.p2': '情绪还在，但我更少给它"添柴"。它升起、变化、减弱、消失的过程更可见；我更像在观察一个过程，而不是被它拖走。',
        'vipassana.section5.title': '5) 我如何在日常复用（3 个短例子）',
        'vipassana.section5.li1': '<strong>吃饭：</strong>发现"还想继续吃"的冲动升起时，先停一拍，观察它；冲动往往会自己变弱。',
        'vipassana.section5.li2': '<strong>愤怒：</strong>外在保持礼貌离开，同时在内心观察愤怒的身体感（热、紧、冲）；不急着用脑内辩论把它扩大。',
        'vipassana.section5.li3': '<strong>分心：</strong>注意力被吸走时，不用羞耻感加罚自己；把"走神 → 拉回"的动作当成训练次数。',
        'vipassana.section6.title': '6) 重要提醒（Warning）',
        'vipassana.section6.warning.title': 'Warning：免责声明',
        'vipassana.section6.warning.li1': '<strong>这是个人体验：</strong>不同人收获可能很小，甚至不适。',
        'vipassana.section6.warning.li2': '<strong>它不是医疗替代：</strong>如果你有明确的身心健康问题，请优先遵循专业医疗建议。',
        'vipassana.section6.warning.li3': '<strong>不要追逐体验：</strong>把"舒服/特殊感觉"当成目标，可能反而更焦躁。',
        'vipassana.appendix.title': '附录',
        'vipassana.appendix.desc': '以下内容为详细记录与参考资料，默认折叠。点击展开查看。',
        'vipassana.appendixA.title': '附录A：逐日笔记（2022-2024）',
        'vipassana.appendixA.desc': '说明：以下为个人练习记录，按时间顺序整理。部分内容为当时的主观体验，不代表普遍结论。',
        'vipassana.appendixA.2022.title': '2022年记录',
        'vipassana.appendixA.2022.first.title': '2022-11-06｜初次体验总结',
        'vipassana.appendixA.2022.first.start': '起点：',
        'vipassana.appendixA.2022.first.start.text': '2021-11 在香港准备辞职时，看见朋友从 Google 辞职后的反思文章提到 Vipassana 影响很大；尝试报名但要排队，一等一年。',
        'vipassana.appendixA.2022.first.attend': '正式参加：',
        'vipassana.appendixA.2022.first.attend.text': '2022-10-26 起参加 10 天、每天约 10 小时静坐的课程（香港中心）。',
        'vipassana.appendixA.2022.first.challenges': '挑战的约束',
        'vipassana.appendixA.2022.first.challenge1': '10 天不说话',
        'vipassana.appendixA.2022.first.challenge2': '10 天不用手机/电脑/手表/网络',
        'vipassana.appendixA.2022.first.challenge3': '10 天不吃肉（此前没尝试过、也不想逼自己）',
        'vipassana.appendixA.2022.first.challenge4': '10 天睡 5 小时（11pm–4am）',
        'vipassana.appendixA.2022.first.challenge5': '10 天每天静坐 10 小时（此前最长 30 分钟、且在椅子上）',
        'vipassana.appendixA.2022.first.challenge6': '10 天见不到任何女生（此前没尝试过、也不想逼自己）',
        'vipassana.appendixA.2022.first.challenge7': '10 天只做 4 件事：睡觉/吃饭/打坐/上厕所',
        'vipassana.appendixA.2022.first.expectation': '预期：',
        'vipassana.appendixA.2022.first.expectation.text': '不期待"神奇效果"。',
        'vipassana.appendixA.2022.first.gain': '最大收获',
        'vipassana.appendixA.2022.first.gain.text': '从第 3 天开始出现"心灵与身体的修复感"。',
        'vipassana.appendixA.2022.first.boundary': '边界说明',
        'vipassana.appendixA.2022.first.boundary1': '只是个人体验，不代表所有人',
        'vipassana.appendixA.2022.first.boundary2': '同行者有人感受轻微',
        'vipassana.appendixA.2022.first.boundary3': '不保证课程后修复能力可持续；我会继续对身体做实验观察',
        'vipassana.appendixA.2022.first.mind': '心灵（mind）层面',
        'vipassana.appendixA.2022.first.mind.sensitivity': '感受力增强：',
        'vipassana.appendixA.2022.first.mind.sensitivity.text': '感受出现更快、更早觉察到细微伤口/身心变化。听觉敏感：音乐音量从"90%不过瘾"到"55%足够"，能更清晰感受低频震动。',
        'vipassana.appendixA.2022.first.mind.focus': '专注力增强：',
        'vipassana.appendixA.2022.first.mind.focus.text': '能把注意力移动到身体任意部位并持续观察，焦虑/无聊减少。',
        'vipassana.appendixA.2022.first.mind.desire': '欲望与注意力：',
        'vipassana.appendixA.2022.first.mind.desire.text': '过去：外界刺激→注意力被劫持→闭眼也会在想象中持续→自责。现在：欲望仍会升起，但可"看着它燃烧"、不再添柴，观察其自行消退（这个问题还没彻底解决，需要继续练习）。',
        'vipassana.appendixA.2022.first.mind.understanding': '"悟道前后"故事的理解：',
        'vipassana.appendixA.2022.first.mind.understanding.text': '悟道前：吃饭想着挑水；挑水想着砍柴。悟道后：吃饭只吃饭；挑水只挑水；砍柴只砍柴。',
        'vipassana.appendixA.2022.first.mind.emotion': '情绪处理：',
        'vipassana.appendixA.2022.first.mind.emotion.text': '快乐：觉察"贪求更多"的升起，观察后自然消退，进食速度变慢更细致。愤怒：被辱骂后外在仍微笑离开，但内在观察愤怒"燃烧→消退"，减少"心猴式追问"。',
        'vipassana.appendixA.2022.first.mind.compassion': '同情/悲悯心：',
        'vipassana.appendixA.2022.first.mind.compassion.text': '对人：面对"吹水者"，先觉察鄙夷/自负，再观察其消退，转为怜悯与理解。对动物：遇到蟑螂，先恐惧/厌恶，观察 3 分钟后转为同情（"蟑螂君"段落）。',
        'vipassana.appendixA.2022.first.body': '身体（body）层面',
        'vipassana.appendixA.2022.first.body.warning': '重要说明',
        'vipassana.appendixA.2022.first.body.warning.text': '以下记录涉及个人身心健康状况。作者提到双相情感障碍与焦虑，并在服药；以下均为个人主观体验记录，不构成医学结论。如有类似状况，请咨询专业医疗人员。',
        'vipassana.appendixA.2022.first.body.sleep': '睡眠：',
        'vipassana.appendixA.2022.first.body.sleep.fall': '入睡：',
        'vipassana.appendixA.2022.first.body.sleep.fall.text': '过去需半片安眠药；课程后"10 分钟、一般床品、开灯/噪音也能睡着"',
        'vipassana.appendixA.2022.first.body.sleep.quality': '质量：',
        'vipassana.appendixA.2022.first.body.sleep.quality.text': '第 4–10 天明显提升；起床精力充沛',
        'vipassana.appendixA.2022.first.body.sleep.duration': '时长：',
        'vipassana.appendixA.2022.first.body.sleep.duration.text': '过去平均 9 小时且白天易困；课程期间夜间约 5 小时',
        'vipassana.appendixA.2022.first.body.sleep.wake': '起床状态：',
        'vipassana.appendixA.2022.first.body.sleep.wake.text': '过去严重起床气/疲惫；课程后不需冷水+咖啡提神',
        'vipassana.appendixA.2022.first.body.migraine': '偏头痛：',
        'vipassana.appendixA.2022.first.body.migraine.text': '第 7 天上午 10 点静坐时发作；观察后约半小时自行消退。',
        'vipassana.appendixA.2022.first.body.pain': '腰背颈痛：',
        'vipassana.appendixA.2022.first.body.pain.text': '颈椎问题既往史；第 4 天起感到从腰背肩脊逐步改善；静坐耐受从 10 分钟痛到可 1 小时不变姿势。',
        'vipassana.appendixA.2022.why.title': '2022-11-07｜为什么我会喜欢上打坐',
        'vipassana.appendixA.2022.why.motive': '动机：',
        'vipassana.appendixA.2022.why.motive.text': '好奇心 + 学习欲；从"外观（研究外部世界）"扩展到"内观（观察内部）"。',
        'vipassana.appendixA.2022.why.concept': '关键概念：',
        'vipassana.appendixA.2022.why.concept.text': '我提出"意"是新的"感觉器官"（类比：盲人获得视力）。',
        'vipassana.appendixA.2022.why.method': '方法论倾向：',
        'vipassana.appendixA.2022.why.method.text': '希望结合医学/解剖学解释内在体验：用理论做地图，再用体验 cross-check。举例：眼痒/结痂/黏液，从"内观推断"与"临床解释（过敏/结膜炎/干眼）"并置比较（仅为推断，非医疗诊断）。',
        'vipassana.appendixA.2022.why.metaphor': '比喻：',
        'vipassana.appendixA.2022.why.metaphor.text': '身体/皮肤/器官像"游乐园"；多数人因缺乏内观能力而"未买票"。内观像拼乐高：需要自己拼出才能玩；科学理论有时可当地图，但也可能不完善。',
        'vipassana.appendixA.2022.sleep.title': '2022-11-09｜为什么睡眠时间少但精力充沛',
        'vipassana.appendixA.2022.sleep.use': '睡眠用途：',
        'vipassana.appendixA.2022.sleep.use.text': '1) 意识休息 2) 身体休息',
        'vipassana.appendixA.2022.sleep.core': '核心观点：',
        'vipassana.appendixA.2022.sleep.core.text': '身体休息：躺着即可。意识休息：需要"让脑子专注于一件事"，减少 A↔B 跳跃的思绪消耗。类比：弹钢琴时 100% 专注，脑不累、手腕会累；学习可 5 小时不累；但思绪乱跳会累。归因：课程后更能专注在呼吸上，从而"意识得到休息"（个人推测）。',
        'vipassana.appendixA.2022.dedication.title': '2022-11-11｜"回向"段落',
        'vipassana.appendixA.2022.dedication.core': '核心句式：',
        'vipassana.appendixA.2022.dedication.core.text': '将修行功德回向六道众生、冤亲债主',
        'vipassana.appendixA.2022.dedication.metaphor': '比喻：',
        'vipassana.appendixA.2022.dedication.metaphor.text': '修行像"储蓄阳光"，回向像"举镜折射分享"；光已照过自身一次，仍可继续折射给需要者',
        'vipassana.appendixA.2022.dedication.purpose': '目的表述：',
        'vipassana.appendixA.2022.dedication.purpose.text': '解结、减少妒忌/怨恨（课程中听到的表述）。',
        'vipassana.appendixA.2024.title': '2024年记录',
        'vipassana.appendixA.2024.prep.title': '2024-09-01｜出行准备：桂东内观（行程与清单）',
        'vipassana.appendixA.2024.prep.plan': '计划：',
        'vipassana.appendixA.2024.prep.plan.text': '内观计划（2024-09-12 去桂东）',
        'vipassana.appendixA.2024.prep.trip': '行程：',
        'vipassana.appendixA.2024.prep.items': '携带物品：',
        'vipassana.appendixA.2024.prep.items.text': '枕头、水杯、浴巾、卫生纸/湿纸巾；5 条内裤、5 双袜子；长裤/宽松裤（穿短裤去）；感冒药、喉咙痛药（强调一定要带）；手机/手表充电器',
        'vipassana.appendixA.2024.info.title': '2024-09-13｜报名/资料/中心信息',
        'vipassana.appendixA.2024.info.text': '报名链接、中国资料下载、交通方式、中心要求/提供/不提供、联系电话、纪律提醒等详细信息见<a href="#appendix-b">附录B</a>。',
        'vipassana.appendixA.2024.chat.title': '2024-09-13｜师兄聊天要点',
        'vipassana.appendixA.2024.practice.title': '2024-09-13～2024-10-09｜后续练习日志',
        'vipassana.appendixB.title': '附录B：外部链接与资料（中心信息、交通、报名）',
        'vipassana.appendixB.warning.title': '敏感信息提示',
        'vipassana.appendixB.warning.text': '以下包含账号密码等敏感信息，请妥善保管，勿公开分享。',
        'vipassana.appendixB.registration.title': '报名与资料下载',
        'vipassana.appendixB.registration.link': '报名链接：',
        'vipassana.appendixB.registration.download': '中国资料下载：',
        'vipassana.appendixB.registration.account': '账号密码（点击展开）',
        'vipassana.appendixB.registration.account.label': '账户：',
        'vipassana.appendixB.registration.account.note': '注：此为公开资料下载账号，非个人账户。',
        'vipassana.appendixB.transport.title': '交通方式',
        'vipassana.appendixB.transport.text1': '郴州西高铁站出站后 → 乘坐"福城快车"到中心',
        'vipassana.appendixB.transport.text2': '在"郴汽集团"公众号：出行服务 → 福城快车，搜索从郴州到桂东的车次',
        'vipassana.appendixB.transport.tip': '提示：',
        'vipassana.appendixB.transport.tip.text': '九座商务车，座位有限，需提前买票；上车前司机会联系',
        'vipassana.appendixB.transport.destination': '导航目的地：',
        'vipassana.appendixB.transport.destination.text': '桂东内观中心；车到中心请司机停车',
        'vipassana.appendixB.location.title': '中心地点',
        'vipassana.appendixB.location.address': '湖南省郴州市桂东县大塘镇蛟龙村原蕉源村村部（无门牌号）',
        'vipassana.appendixB.location.zip': '邮编：',
        'vipassana.appendixB.items.title': '必带/不提供/提供',
        'vipassana.appendixB.items.must': '请务必携带：',
        'vipassana.appendixB.items.must1': '年龄满 65 岁需健康证明',
        'vipassana.appendixB.items.must2': '如开课前已有感冒、咳嗽、发烧、打喷嚏等症状：请主动取消课程，完全康复后再来',
        'vipassana.appendixB.items.not': '中心不提供：',
        'vipassana.appendixB.items.not1': '水杯、牙膏牙刷、毛巾、洗衣粉、肥皂、拖鞋、卫生纸、卫生巾',
        'vipassana.appendixB.items.not2': '个人衣物要求：宽松舒适、避免会产生摩擦声音的衣服',
        'vipassana.appendixB.items.not3': '路面上下坡：请带防滑舒适的鞋子（重要）',
        'vipassana.appendixB.items.provided': '中心提供：',
        'vipassana.appendixB.items.provided1': '餐具',
        'vipassana.appendixB.items.provided2': '子母被（厚/薄）、床单、被套、电热毯、垫被、枕头等床品',
        'vipassana.appendixB.items.provided3': '坐垫、盖腿毛巾被/毛毯',
        'vipassana.appendixB.items.provided4': '盆、桶一套',
        'vipassana.appendixB.contact.title': '联系电话',
        'vipassana.appendixB.contact.office': '办公室（值班时间）：',
        'vipassana.appendixB.contact.registration': '报名咨询电话：',
        'vipassana.appendixB.contact.center': '中心联系电话：',
        'vipassana.appendixB.contact.emergency': '紧急事件转告：',
        'vipassana.appendixB.contact.emergency.text': '家属致电中心 19958975163',
        'vipassana.appendixB.discipline.title': '纪律提醒',
        'vipassana.appendixB.discipline1': '禅修期间必须严格遵守规定、遵守老师指导、禁语、不与外界联系',
        'vipassana.appendixB.discipline2': '必须全程参与直至课程结束，不得中途退出',
        'vipassana.appendixB.discipline3': '课程期间不允许与外界接触及使用电话；紧急事件由家属致电中心代为转告',
        'vipassana.appendixC.title': '附录C：术语表（中英/巴利对照 + 一句解释）',
        'vipassana.appendixC.table.chinese': '中文',
        'vipassana.appendixC.table.english': 'English / Pāli',
        'vipassana.appendixC.table.explanation': '一句解释',
        'vipassana.appendixC.section1': 'C1. 核心术语',
        'vipassana.appendixC.section2': 'C2. 三学、三宝、四圣谛、八圣道',
        'vipassana.appendixC.section3': 'C3. 三特性、四无量心、五蕴、四大等',
        'vipassana.appendixC.warning.title': '重要说明',
        'vipassana.appendixC.warning.text': '以上术语表基于个人学习与实践记录整理，部分内容涉及医学/临床解释（如过敏、免疫球蛋白E、结膜炎、干眼等）仅为"并置解释/推断"，不构成医疗诊断。如有身心健康问题，请咨询专业医疗人员。'
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
        'nav.more': 'More',
        'nav.timeline': 'Timeline',
        'nav.resume': 'Resume',
        'nav.finance': 'Financial Dashboard',
        
        // Hero
        'hero.name': 'Zi Yin',
        'hero.tagline': 'Seriously talking nonsense',
        'hero.title': 'Quant Researcher · Founder · Musician',
        'hero.subtitle': 'Trained by markets, disciplined by data, educated by music.',
        'hero.identity.left': 'A47G Fund Founder',
        'hero.identity.right': 'Oxford Quantitative Researcher',
        'hero.experience.left': 'Citadel Securities',
        'hero.experience.right': 'Quant Trader',
        'hero.training.left': 'Berklee College of Music',
        'hero.training.right': 'GPA 4.0',
        'hero.metric1': 'Managed <strong>$5M+</strong> quantitative assets ｜Peak annualized return <strong>120%+</strong>',
        'hero.metric2': 'Former Quantitative Trader at <strong>Citadel Securities</strong>',
        'hero.metric3': '<strong>Berklee College of Music</strong> — GPA <strong>4.0</strong> (rare among musicians)',
        'hero.cta': 'Project Inquiry → Email',
        'hero.cta.mobile': 'Business / Research Inquiries → Email',
        'hero.value.zh': '我做过许多看似不相关的事情。<br>但它们在我这里，指向同一个问题：<br>如何在复杂系统中做出高质量决策。',
        'hero.value.en': 'I work across seemingly unrelated fields.<br>In my case, they converge on one question:<br>how to make high-quality decisions in complex systems.',
        
        // Entry
        'entry.title': 'Explore Long-term Records Across Dimensions',
        'entry.timeline.title': 'Life Timeline',
        'entry.timeline.desc': 'Long-term decisions and stage reflections',
        'entry.timeline.link': '→ View Timeline',
        'entry.highlights.title': 'Key Highlights',
        'entry.highlights.desc': 'Academic, professional, music, and other achievements',
        'entry.highlights.link': '→ View Highlights',
        'entry.works.title': 'Music & Works',
        'entry.works.desc': 'Creative works, performances, and training records',
        'entry.works.link': '→ View Works',
        'entry.review.title': 'Year Review',
        'entry.review.desc': 'Goals, retrospectives, and course corrections',
        'entry.review.link': '→ Read Year Review',
        
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
        'highlights.professional.1': 'Quantitative Trader at Citadel Securities',
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
        'theme.professional.1': 'Quantitative Trader at Citadel Securities',
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
        'footer.quote': '本是后山人，偶做前堂客。醉舞经阁半卷书，坐井说天阔。大志戏功名，海斗量福祸。论到囊中羞涩时，怒指乾坤错。',
        
        // Projects
        'projects.title': 'Projects',
        'projects.vipassana_title': 'Vipassana',
        'projects.vipassana_desc': 'Thoughts and records on Vipassana meditation practice',
        'projects.back': '← Back to Projects',
        
        // Vipassana Article - Main Content
        'vipassana.title': 'How I Encountered Vipassana｜10-Day Silent Experience and Insights',
        'vipassana.meta': 'Nov 6, 2022 · ~7 min read',
        'vipassana.lastUpdate': 'Last updated: Oct 9, 2024',
        'vipassana.intensity.label': 'Course Intensity:',
        'vipassana.intensity.days': '10 days',
        'vipassana.intensity.silent': 'Silent',
        'vipassana.intensity.hours': '~10 hours/day',
        'vipassana.intensity.nophone': 'No phone',
        'vipassana.tldr.title': 'TL;DR',
        'vipassana.tldr.1': 'I attended a 10-day silent Vipassana course: no phone, no communication, long hours of meditation daily.',
        'vipassana.tldr.2': 'The biggest gain was not a "mystical experience," but rather a more tangible training in <strong>awareness</strong> and <strong>equanimity</strong>.',
        'vipassana.tldr.3': 'Subjectively, I felt: more stable focus, more sensitive to "early signals" from body and emotions; sleep and some physical discomforts were temporarily alleviated during the course.',
        'vipassana.tldr.4': '<strong>Important:</strong> This is personal experience only; not medical advice; individual responses vary greatly.',
        'vipassana.section1.title': '1) Why I Went',
        'vipassana.section1.p1': 'I first heard about Vipassana in November 2021: a friend wrote a reflection after leaving Google, mentioning that meditation had a significant impact on him. I registered in Hong Kong, but had to wait a year before finally attending on October 26, 2022.',
        'vipassana.section1.p2': 'What I wanted to verify was not "spiritual results," but a more practical question: Under high-intensity constraints, could I observe and manage my own attention and reactions?',
        'vipassana.section2.title': '2) What Challenges I Took On',
        'vipassana.section2.p1': 'This course felt like an "extreme attention training camp" for me:',
        'vipassana.section2.li1': '<strong>10 days of silence:</strong> No talking, no communication',
        'vipassana.section2.li2': '<strong>No electronic devices:</strong> No phone/computer/watch/internet',
        'vipassana.section2.li3': '<strong>Dietary constraints:</strong> Primarily vegetarian (specific arrangements vary by center)',
        'vipassana.section2.li4': '<strong>Fixed schedule:</strong> Early rising, compressed sleep (varies by center)',
        'vipassana.section2.li5': '<strong>Long hours of sitting:</strong> Most of each day alternating between sitting and walking meditation',
        'vipassana.section2.li6': '<strong>Minimal lifestyle:</strong> Most time reduced to sleeping/eating/practice/essential activities',
        'vipassana.section2.p2': 'I didn\'t expect "magical effects"; more so, I wanted to place myself in a controlled experimental environment.',
        'vipassana.section3.title': '3) Biggest Gains After Completion',
        'vipassana.section3.1.title': '3.1 Mind: Earlier Awareness of "Reaction Starting Point"',
        'vipassana.section3.1.p1': 'My most obvious change: Before emotions or impulses could develop into "dramas," I could detect their bodily signals earlier.',
        'vipassana.section3.1.li1': '<strong>Before:</strong> Stimulus → Automatic reaction → Realized only afterward',
        'vipassana.section3.1.li2': '<strong>Now (closer to):</strong> Stimulus → Feel the body/mental momentum → Choose whether to continue reacting',
        'vipassana.section3.1.p2': 'For me, this "lead time" is crucial: it makes self-control more like a technical problem, rather than moral self-blame.',
        'vipassana.section3.2.title': '3.2 Body: Some Conditions Temporarily Improved During the Course',
        'vipassana.section3.2.p1': 'Subjectively, I felt improved sleep quality and clearer waking; some physical discomforts were alleviated during the course (including changes in how pain and discomfort were handled).',
        'vipassana.section3.2.p2': 'But I don\'t treat this as a stable conclusion: whether it can be maintained after leaving the course environment requires long-term observation and review.',
        'vipassana.section4.title': '4) Core Mechanism I Understand: Awareness + Equanimity',
        'vipassana.section4.note.title': 'Note: Terminology',
        'vipassana.section4.note.awareness': '<strong>Awareness:</strong> More clearly "seeing what is happening" (breathing, sensations, emotional momentum).',
        'vipassana.section4.note.equanimity': '<strong>Equanimity:</strong> After seeing, not immediately adding automatic reactions of "like/dislike/must change immediately."',
        'vipassana.section4.p1': 'The combination of these two brings a practical effect:',
        'vipassana.section4.p2': 'Emotions are still there, but I add less "fuel" to them. The process of their rising, changing, weakening, and disappearing becomes more visible; I\'m more like observing a process, rather than being dragged away by it.',
        'vipassana.section5.title': '5) How I Reuse It in Daily Life (3 Short Examples)',
        'vipassana.section5.li1': '<strong>Eating:</strong> When I notice the impulse to "keep eating" rising, pause first, observe it; the impulse often weakens on its own.',
        'vipassana.section5.li2': '<strong>Anger:</strong> Externally maintain politeness and leave, while internally observing the bodily sensations of anger (heat, tension, rush); don\'t rush to expand it with mental debates.',
        'vipassana.section5.li3': '<strong>Distraction:</strong> When attention is pulled away, don\'t punish yourself with shame; treat the "wandering → returning" action as training repetitions.',
        'vipassana.section6.title': '6) Important Reminder (Warning)',
        'vipassana.section6.warning.title': 'Warning: Disclaimer',
        'vipassana.section6.warning.li1': '<strong>This is personal experience:</strong> Different people may gain little, or even feel discomfort.',
        'vipassana.section6.warning.li2': '<strong>It is not a medical substitute:</strong> If you have clear physical or mental health issues, please prioritize professional medical advice.',
        'vipassana.section6.warning.li3': '<strong>Don\'t chase experiences:</strong> Making "comfort/special feelings" a goal may actually increase restlessness.',
        'vipassana.appendix.title': 'Appendices',
        'vipassana.appendix.desc': 'The following content contains detailed records and reference materials, collapsed by default. Click to expand.',
        'vipassana.appendixA.title': 'Appendix A: Daily Notes (2022-2024)',
        'vipassana.appendixA.desc': 'Note: The following are personal practice records, organized chronologically. Some content reflects subjective experiences at the time and does not represent universal conclusions.',
        'vipassana.appendixA.2022.title': '2022 Records',
        'vipassana.appendixA.2022.first.title': '2022-11-06｜First Experience Summary',
        'vipassana.appendixA.2022.first.start': 'Starting point:',
        'vipassana.appendixA.2022.first.start.text': 'In November 2021, while preparing to resign in Hong Kong, I saw a friend\'s reflection article after leaving Google mentioning that Vipassana had a significant impact; tried to register but had to wait in line, waited a year.',
        'vipassana.appendixA.2022.first.attend': 'Formal participation:',
        'vipassana.appendixA.2022.first.attend.text': 'From 2022-10-26, participated in a 10-day course with approximately 10 hours of sitting meditation daily (Hong Kong center).',
        'vipassana.appendixA.2022.first.challenges': 'Challenging constraints',
        'vipassana.appendixA.2022.first.challenge1': '10 days without speaking',
        'vipassana.appendixA.2022.first.challenge2': '10 days without phone/computer/watch/internet',
        'vipassana.appendixA.2022.first.challenge3': '10 days without meat (hadn\'t tried this before, didn\'t want to force myself)',
        'vipassana.appendixA.2022.first.challenge4': '10 days sleeping 5 hours (11pm–4am)',
        'vipassana.appendixA.2022.first.challenge5': '10 days sitting 10 hours daily (previously longest was 30 minutes, and on a chair)',
        'vipassana.appendixA.2022.first.challenge6': '10 days without seeing any women (hadn\'t tried this before, didn\'t want to force myself)',
        'vipassana.appendixA.2022.first.challenge7': '10 days doing only 4 things: sleep/eat/meditate/use restroom',
        'vipassana.appendixA.2022.first.expectation': 'Expectation:',
        'vipassana.appendixA.2022.first.expectation.text': 'Not expecting "magical effects."',
        'vipassana.appendixA.2022.first.gain': 'Biggest gain',
        'vipassana.appendixA.2022.first.gain.text': 'From day 3, a "sense of mental and physical repair" began to appear.',
        'vipassana.appendixA.2022.first.boundary': 'Boundary notes',
        'vipassana.appendixA.2022.first.boundary1': 'Only personal experience, does not represent everyone',
        'vipassana.appendixA.2022.first.boundary2': 'Some fellow participants felt minimal effects',
        'vipassana.appendixA.2022.first.boundary3': 'No guarantee that repair ability can be sustained after the course; I will continue to experiment and observe my body',
        'vipassana.appendixA.2022.first.mind': 'Mind level',
        'vipassana.appendixA.2022.first.mind.sensitivity': 'Increased sensitivity:',
        'vipassana.appendixA.2022.first.mind.sensitivity.text': 'Sensations appear faster, earlier awareness of subtle wounds/body-mind changes. Auditory sensitivity: music volume from "90% not enough" to "55% sufficient," can more clearly feel low-frequency vibrations.',
        'vipassana.appendixA.2022.first.mind.focus': 'Increased focus:',
        'vipassana.appendixA.2022.first.mind.focus.text': 'Can move attention to any part of the body and sustain observation, anxiety/boredom reduced.',
        'vipassana.appendixA.2022.first.mind.desire': 'Desire and attention:',
        'vipassana.appendixA.2022.first.mind.desire.text': 'Past: external stimulus → attention hijacked → even with eyes closed, continues in imagination → self-blame. Now: desires still arise, but can "watch them burn," no longer adding fuel, observing them subside on their own (this issue is not completely resolved, needs continued practice).',
        'vipassana.appendixA.2022.first.mind.understanding': 'Understanding of "before and after enlightenment" story:',
        'vipassana.appendixA.2022.first.mind.understanding.text': 'Before enlightenment: eating while thinking about fetching water; fetching water while thinking about chopping wood. After enlightenment: eating only eating; fetching water only fetching water; chopping wood only chopping wood.',
        'vipassana.appendixA.2022.first.mind.emotion': 'Emotion handling:',
        'vipassana.appendixA.2022.first.mind.emotion.text': 'Happiness: aware of "craving more" rising, observe then naturally subsides, eating speed slows and becomes more refined. Anger: after being insulted, externally still smile and leave, but internally observe anger "burning → subsiding," reducing "monkey-mind questioning."',
        'vipassana.appendixA.2022.first.mind.compassion': 'Compassion/empathy:',
        'vipassana.appendixA.2022.first.mind.compassion.text': 'Toward people: facing "blowhards," first aware of contempt/arrogance, then observe it subsiding, turning to pity and understanding. Toward animals: encountering cockroaches, first fear/disgust, observe for 3 minutes then turn to compassion ("cockroach-kun" paragraph).',
        'vipassana.appendixA.2022.first.body': 'Body level',
        'vipassana.appendixA.2022.first.body.warning': 'Important note',
        'vipassana.appendixA.2022.first.body.warning.text': 'The following records involve personal physical and mental health conditions. The author mentions bipolar disorder and anxiety, and is on medication; the following are all personal subjective experience records and do not constitute medical conclusions. If you have similar conditions, please consult professional medical personnel.',
        'vipassana.appendixA.2022.first.body.sleep': 'Sleep:',
        'vipassana.appendixA.2022.first.body.sleep.fall': 'Falling asleep:',
        'vipassana.appendixA.2022.first.body.sleep.fall.text': 'Previously needed half a sleeping pill; after course "10 minutes, normal bedding, can fall asleep with lights on/noise"',
        'vipassana.appendixA.2022.first.body.sleep.quality': 'Quality:',
        'vipassana.appendixA.2022.first.body.sleep.quality.text': 'Days 4–10 significantly improved; wake up energetic',
        'vipassana.appendixA.2022.first.body.sleep.duration': 'Duration:',
        'vipassana.appendixA.2022.first.body.sleep.duration.text': 'Previously averaged 9 hours and easily sleepy during day; during course, approximately 5 hours at night',
        'vipassana.appendixA.2022.first.body.sleep.wake': 'Waking state:',
        'vipassana.appendixA.2022.first.body.sleep.wake.text': 'Previously severe morning grumpiness/fatigue; after course, no need for cold water + coffee to wake up',
        'vipassana.appendixA.2022.first.body.migraine': 'Migraine:',
        'vipassana.appendixA.2022.first.body.migraine.text': 'Day 7, 10 AM during sitting meditation, attack occurred; after observation, subsided on its own in about half an hour.',
        'vipassana.appendixA.2022.first.body.pain': 'Back/neck pain:',
        'vipassana.appendixA.2022.first.body.pain.text': 'Previous history of cervical spine issues; from day 4, felt gradual improvement from back/shoulder/spine; sitting tolerance went from 10 minutes of pain to being able to maintain position for 1 hour.',
        'vipassana.appendixA.2022.why.title': '2022-11-07｜Why I Came to Like Meditation',
        'vipassana.appendixA.2022.why.motive': 'Motive:',
        'vipassana.appendixA.2022.why.motive.text': 'Curiosity + desire to learn; expanding from "external observation (studying external world)" to "internal observation (observing internal)."',
        'vipassana.appendixA.2022.why.concept': 'Key concept:',
        'vipassana.appendixA.2022.why.concept.text': 'I propose that "intention" is a new "sensory organ" (analogy: blind person gaining sight).',
        'vipassana.appendixA.2022.why.method': 'Methodological tendency:',
        'vipassana.appendixA.2022.why.method.text': 'Hope to combine medical/anatomical explanations with internal experiences: use theory as a map, then cross-check with experience. Example: eye itch/scabs/mucus, comparing "internal observation inference" with "clinical explanation (allergy/conjunctivitis/dry eye)" side by side (only inference, not medical diagnosis).',
        'vipassana.appendixA.2022.why.metaphor': 'Metaphor:',
        'vipassana.appendixA.2022.why.metaphor.text': 'Body/skin/organs like "amusement park"; most people "haven\'t bought tickets" due to lack of internal observation ability. Internal observation like building LEGO: need to build it yourself to play; scientific theory can sometimes serve as a map, but may also be incomplete.',
        'vipassana.appendixA.2022.sleep.title': '2022-11-09｜Why Less Sleep But More Energetic',
        'vipassana.appendixA.2022.sleep.use': 'Sleep uses:',
        'vipassana.appendixA.2022.sleep.use.text': '1) Consciousness rest 2) Body rest',
        'vipassana.appendixA.2022.sleep.core': 'Core view:',
        'vipassana.appendixA.2022.sleep.core.text': 'Body rest: just lying down. Consciousness rest: need to "let the mind focus on one thing," reducing A↔B jumping thought consumption. Analogy: when playing piano 100% focused, brain doesn\'t tire, wrists do; studying can go 5 hours without tiring; but jumping thoughts tire. Attribution: after course, more able to focus on breathing, thus "consciousness gets rest" (personal speculation).',
        'vipassana.appendixA.2022.dedication.title': '2022-11-11｜"Dedication" Paragraph',
        'vipassana.appendixA.2022.dedication.core': 'Core phrase:',
        'vipassana.appendixA.2022.dedication.core.text': 'Dedicate the merit of practice to all sentient beings in the six realms, karmic creditors',
        'vipassana.appendixA.2022.dedication.metaphor': 'Metaphor:',
        'vipassana.appendixA.2022.dedication.metaphor.text': 'Practice like "saving sunlight," dedication like "holding mirror to reflect and share"; light has already shone on oneself once, can still continue to reflect to those in need',
        'vipassana.appendixA.2022.dedication.purpose': 'Purpose statement:',
        'vipassana.appendixA.2022.dedication.purpose.text': 'Untie knots, reduce jealousy/resentment (expressions heard during course).',
        'vipassana.appendixA.2024.title': '2024 Records',
        'vipassana.appendixA.2024.prep.title': '2024-09-01｜Travel Preparation: Guidong Vipassana (Itinerary and Checklist)',
        'vipassana.appendixA.2024.prep.plan': 'Plan:',
        'vipassana.appendixA.2024.prep.plan.text': 'Vipassana plan (2024-09-12 to Guidong)',
        'vipassana.appendixA.2024.prep.trip': 'Itinerary:',
        'vipassana.appendixA.2024.prep.items': 'Items to bring:',
        'vipassana.appendixA.2024.prep.items.text': 'Pillow, water cup, bath towel, toilet paper/wet wipes; 5 pairs of underwear, 5 pairs of socks; long pants/loose pants (wear shorts there); cold medicine, sore throat medicine (must bring); phone/watch charger',
        'vipassana.appendixA.2024.info.title': '2024-09-13｜Registration/Materials/Center Information',
        'vipassana.appendixA.2024.info.text': 'For detailed information on registration links, China materials download, transportation methods, center requirements/provided/not provided, contact phone numbers, discipline reminders, etc., see <a href="#appendix-b">Appendix B</a>.',
        'vipassana.appendixA.2024.chat.title': '2024-09-13｜Senior Practitioner Chat Points',
        'vipassana.appendixA.2024.practice.title': '2024-09-13～2024-10-09｜Subsequent Practice Log',
        'vipassana.appendixB.title': 'Appendix B: External Links and Materials (Center Information, Transportation, Registration)',
        'vipassana.appendixB.warning.title': 'Sensitive Information Notice',
        'vipassana.appendixB.warning.text': 'The following contains sensitive information such as account passwords. Please keep it safe and do not share publicly.',
        'vipassana.appendixB.registration.title': 'Registration and Materials Download',
        'vipassana.appendixB.registration.link': 'Registration link:',
        'vipassana.appendixB.registration.download': 'China materials download:',
        'vipassana.appendixB.registration.account': 'Account password (click to expand)',
        'vipassana.appendixB.registration.account.label': 'Account:',
        'vipassana.appendixB.registration.account.note': 'Note: This is a public materials download account, not a personal account.',
        'vipassana.appendixB.transport.title': 'Transportation',
        'vipassana.appendixB.transport.text1': 'After exiting Chenzhou West High-Speed Rail Station → Take "Fucheng Express" to center',
        'vipassana.appendixB.transport.text2': 'In "Chenqi Group" WeChat public account: Travel Services → Fucheng Express, search for trips from Chenzhou to Guidong',
        'vipassana.appendixB.transport.tip': 'Tip:',
        'vipassana.appendixB.transport.tip.text': 'Nine-seat business van, limited seats, need to book tickets in advance; driver will contact before boarding',
        'vipassana.appendixB.transport.destination': 'Navigation destination:',
        'vipassana.appendixB.transport.destination.text': 'Guidong Vipassana Center; ask driver to stop when car reaches center',
        'vipassana.appendixB.location.title': 'Center Location',
        'vipassana.appendixB.location.address': 'Yuanjiaoyuan Village Office, Jiaolong Village, Datang Town, Guidong County, Chenzhou City, Hunan Province (no house number)',
        'vipassana.appendixB.location.zip': 'Postal code:',
        'vipassana.appendixB.items.title': 'Must Bring/Not Provided/Provided',
        'vipassana.appendixB.items.must': 'Please be sure to bring:',
        'vipassana.appendixB.items.must1': 'Health certificate required if age 65 or older',
        'vipassana.appendixB.items.must2': 'If you already have cold, cough, fever, sneezing symptoms before course starts: please actively cancel course, come again after full recovery',
        'vipassana.appendixB.items.not': 'Center does not provide:',
        'vipassana.appendixB.items.not1': 'Water cup, toothpaste/toothbrush, towel, laundry detergent, soap, slippers, toilet paper, sanitary pads',
        'vipassana.appendixB.items.not2': 'Personal clothing requirements: loose and comfortable, avoid clothes that produce friction sounds',
        'vipassana.appendixB.items.not3': 'Road has ups and downs: please bring anti-slip comfortable shoes (important)',
        'vipassana.appendixB.items.provided': 'Center provides:',
        'vipassana.appendixB.items.provided1': 'Tableware',
        'vipassana.appendixB.items.provided2': 'Dual-layer quilt (thick/thin), bed sheets, quilt covers, electric blanket, mattress pad, pillows and other bedding',
        'vipassana.appendixB.items.provided3': 'Sitting cushion, leg cover towel/blanket',
        'vipassana.appendixB.items.provided4': 'Basin and bucket set',
        'vipassana.appendixB.contact.title': 'Contact Phone Numbers',
        'vipassana.appendixB.contact.office': 'Office (duty hours):',
        'vipassana.appendixB.contact.registration': 'Registration inquiry phone:',
        'vipassana.appendixB.contact.center': 'Center contact phone:',
        'vipassana.appendixB.contact.emergency': 'Emergency notification:',
        'vipassana.appendixB.contact.emergency.text': 'Family members call center 19958975163',
        'vipassana.appendixB.discipline.title': 'Discipline Reminder',
        'vipassana.appendixB.discipline1': 'During retreat, must strictly follow regulations, follow teacher guidance, maintain silence, no contact with outside world',
        'vipassana.appendixB.discipline2': 'Must participate fully until course ends, cannot withdraw midway',
        'vipassana.appendixB.discipline3': 'During course, contact with outside world and use of phone not allowed; emergencies notified by family members calling center',
        'vipassana.appendixC.title': 'Appendix C: Glossary (Chinese/English/Pāli Comparison + One-Sentence Explanation)',
        'vipassana.appendixC.table.chinese': 'Chinese',
        'vipassana.appendixC.table.english': 'English / Pāli',
        'vipassana.appendixC.table.explanation': 'One-sentence explanation',
        'vipassana.appendixC.section1': 'C1. Core Terms',
        'vipassana.appendixC.section2': 'C2. Three Trainings, Three Jewels, Four Noble Truths, Eightfold Path',
        'vipassana.appendixC.section3': 'C3. Three Characteristics, Four Immeasurables, Five Aggregates, Four Great Elements, etc.',
        'vipassana.appendixC.warning.title': 'Important Note',
        'vipassana.appendixC.warning.text': 'The above glossary is compiled based on personal study and practice records. Some content involves medical/clinical explanations (such as allergies, immunoglobulin E, conjunctivitis, dry eye, etc.) which are only "juxtaposed explanations/inferences" and do not constitute medical diagnosis. If you have physical or mental health issues, please consult professional medical personnel.'
    }
};

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    
    // Update html lang attribute
    const htmlElement = document.getElementById('html-lang');
    if (htmlElement) {
        htmlElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    }
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else {
                // Check if translation contains HTML tags
                const translation = translations[lang][key];
                if (translation && translation.includes && translation.includes('<') && translation.includes('>')) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation || '';
                }
            }
        }
    });
    
    // Show/hide hero value text based on language
    const valueZh = document.querySelector('.value-zh');
    const valueEn = document.querySelector('.value-en');
    if (valueZh && valueEn) {
        if (lang === 'zh') {
            valueZh.style.display = 'block';
            valueEn.style.display = 'none';
        } else {
            valueZh.style.display = 'none';
            valueEn.style.display = 'block';
        }
    }
    
    // Update active language button (desktop and mobile)
    document.querySelectorAll('.lang-btn, .lang-btn-mobile').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeLangBtn = document.getElementById(`lang-${lang}`);
    const activeLangBtnMobile = document.getElementById(`lang-${lang}-mobile`);
    if (activeLangBtn) {
        activeLangBtn.classList.add('active');
    }
    if (activeLangBtnMobile) {
        activeLangBtnMobile.classList.add('active');
    }
}

// Initialize language - try multiple initialization strategies
function initLanguageToggle() {
    // Try to get buttons by ID first
    let langZhBtn = document.getElementById('lang-zh');
    let langEnBtn = document.getElementById('lang-en');
    
    // Also get mobile buttons
    let langZhBtnMobile = document.getElementById('lang-zh-mobile');
    let langEnBtnMobile = document.getElementById('lang-en-mobile');
    
    // If not found by ID, try to find by text content as fallback
    if (!langZhBtn || !langEnBtn) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            const text = btn.textContent.trim();
            if (text === '中文' && !langZhBtn && !btn.id.includes('mobile')) {
                langZhBtn = btn;
                btn.id = 'lang-zh';
                btn.classList.add('lang-btn');
            } else if (text === 'English' && !langEnBtn && !btn.id.includes('mobile')) {
                langEnBtn = btn;
                btn.id = 'lang-en';
                btn.classList.add('lang-btn');
            }
        });
    }
    
    // Helper function to bind button
    function bindButton(btn, lang, isMobile = false) {
        if (!btn) return;
        
        // Remove any existing listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Language switch to ${lang === 'zh' ? 'Chinese' : 'English'}${isMobile ? ' (mobile)' : ''}`);
            setLanguage(lang);
        });
    }
    
    // Bind desktop buttons
    bindButton(langZhBtn, 'zh');
    bindButton(langEnBtn, 'en');
    
    // Bind mobile buttons
    bindButton(langZhBtnMobile, 'zh', true);
    bindButton(langEnBtnMobile, 'en', true);
    
    if (!langZhBtn && !langZhBtnMobile) {
        console.error('Language button lang-zh not found in DOM');
    }
    if (!langEnBtn && !langEnBtnMobile) {
        console.error('Language button lang-en not found in DOM');
    }
}

// Initialize language - try multiple strategies
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setLanguage(currentLang);
        initLanguageToggle();
    });
} else {
    // DOM is already loaded
    setLanguage(currentLang);
    initLanguageToggle();
}

