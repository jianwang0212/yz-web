// Page-local copy: do not change shared translations on other routes.
Object.assign(translations.zh, {
  "projects.hubs.health": "健康",
  "projects.hubs.healthDesc": "看最近变化，回顾长期记录。",
  "projects.hubs.openHealth": "打开健康中心 →",
  "projects.hubs.music": "音乐",
  "projects.hubs.musicDesc": "日常练习，制作与曲谱资料。",
  "projects.hubs.practice": "练习",
  "projects.hubs.production": "制作与资料",
  "projects.hubs.work": "工作与研究",
  "projects.hubs.workDesc": "正在使用的运营与开发工具。",
  "projects.hubs.works": "作品 →",
  "projects.hubs.internal": "内部工具",
  "projects.hubs.internalDesc": "运行排查时再打开，不属于日常项目",
  "projects.hubs.socialArchive": "SocialPulse 发布检查 · 历史",
  "projects.hubs.essays": "文章与长文 →",
  "projects.hubs.archive": "实验与归档",
  "projects.hubs.archiveDesc": "原型和已结束的阶段记录",
  "projects.hubs.history": "睡眠、运动与心率",
  "projects.hubs.weight": "体重记录",
  "projects.hubs.workout": "健身记录与动作分析",
  "projects.hubs.yoga": "瑜伽动作库",
  "projects.hubs.environment": "居家环境",
  "projects.hubs.records": "体检与健康档案",
  "projects.hubs.interval": "音程测验",
  "projects.hubs.degree": "调号级数",
  "projects.hubs.chord": "和弦训练",
  "projects.hubs.voicing": "左手 Voicing",
  "projects.hubs.stems": "Stem Splitter",
  "projects.hubs.leadsheets": "歌曲 Leadsheet 数据库",
  "projects.hubs.docking": "入坞科技",
  "projects.hubs.social": "SocialPulse 发布检查",
  "projects.hubs.codex": "Codex 运行监控",
  "projects.hubs.servers": "服务器资产与监控",
  "projects.hubs.mock": "金融研究工作台 · Mock 原型",
  "projects.hubs.monthly": "Codex 2026 年 6 月小结",
  "projects.hubs.apartment": "旧转租事项"
});
Object.assign(translations.en, {
  "projects.hubs.health": "Health",
  "projects.hubs.healthDesc": "Recent changes and long-term records.",
  "projects.hubs.openHealth": "Open Health →",
  "projects.hubs.music": "Music",
  "projects.hubs.musicDesc": "Daily practice, production and reference.",
  "projects.hubs.practice": "Practice",
  "projects.hubs.production": "Production & reference",
  "projects.hubs.work": "Work & Research",
  "projects.hubs.workDesc": "Operations and development tools in daily use.",
  "projects.hubs.works": "Works →",
  "projects.hubs.internal": "Internal tools",
  "projects.hubs.internalDesc": "Open for troubleshooting, not daily project navigation",
  "projects.hubs.socialArchive": "SocialPulse publishing checks · Archive",
  "projects.hubs.essays": "Essays & long reads →",
  "projects.hubs.archive": "Experiments & archive",
  "projects.hubs.archiveDesc": "Prototypes and completed chapters",
  "projects.hubs.history": "Sleep, movement & heart rate",
  "projects.hubs.weight": "Weight records",
  "projects.hubs.workout": "Workout records & form review",
  "projects.hubs.yoga": "Yoga pose library",
  "projects.hubs.environment": "Home environment",
  "projects.hubs.records": "Medical & health archive",
  "projects.hubs.interval": "Interval quiz",
  "projects.hubs.degree": "Key & scale degree quiz",
  "projects.hubs.chord": "Chord trainer",
  "projects.hubs.voicing": "Left-hand voicing",
  "projects.hubs.stems": "Stem Splitter",
  "projects.hubs.leadsheets": "Song leadsheet library",
  "projects.hubs.docking": "Dockingtech",
  "projects.hubs.social": "SocialPulse publishing checks",
  "projects.hubs.codex": "Codex activity monitor",
  "projects.hubs.servers": "Server assets & monitoring",
  "projects.hubs.mock": "Finance research · Mock prototype",
  "projects.hubs.monthly": "Codex recap · June 2026",
  "projects.hubs.apartment": "Past apartment sublet"
});

const archive = document.querySelector('#archive');
const archiveTrigger = document.querySelector('[data-open-project-archive]');

function openArchive() {
    if (archive) archive.open = true;
}

archiveTrigger?.addEventListener('click', openArchive);

function openLinkedDisclosure() {
    const id = window.location.hash.slice(1);
    if (id === 'archive' || id === 'internal-tools') {
        const disclosure = document.getElementById(id);
        if (disclosure) disclosure.open = true;
    }
}
openLinkedDisclosure();
window.addEventListener('hashchange', openLinkedDisclosure);
