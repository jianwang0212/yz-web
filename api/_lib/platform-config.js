export const SOCIALPULSE_PLATFORMS = [
  'instagram',
  'zhihu',
  'reddit',
  'xiaohongshu',
  'x',
  'douyin'
];

export const SOCIALPULSE_HISTORY_PLATFORMS = [
  'instagram',
  'zhihu',
  'reddit',
  'xiaohongshu',
  'x'
];

export const SUPPORTED_SOCIALPULSE_PLATFORMS = new Set(SOCIALPULSE_PLATFORMS);

export function emptySocialPulseRecords() {
  return Object.fromEntries(SOCIALPULSE_PLATFORMS.map((platform) => [platform, []]));
}

export const SOCIALPULSE_PUBLIC_CONFIG = {
  instagram: {
    title: 'Instagram',
    identifierLabel: '公开用户名 / Public username',
    identifierValue: 'silverzigge',
    availability: 'blocked',
    summary: '当前以发布清单为准，适合作为发布检查面板。 / This is currently manifest-backed and works well for publish verification.',
    currentFinding: '已从发布清单恢复最近内容。 / Latest content was recovered from the manifest.',
    exampleUrl: 'https://www.instagram.com/silverzigge/'
  },
  reddit: {
    title: 'Reddit',
    identifierLabel: '用户名 / Username',
    identifierValue: 'Mammoth-Trash-972',
    availability: 'verified',
    summary: 'Reddit 的公开链接稳定，所以这里可以直接用作发布验证。 / Reddit public links are stable, so this works well for publish verification.',
    currentFinding: '已从发布清单恢复最近内容，并保留公开链接。 / Latest content was recovered from the manifest with public links preserved.',
    exampleUrl: 'https://www.reddit.com/user/Mammoth-Trash-972/submitted/'
  },
  xiaohongshu: {
    title: '小红书 / Xiaohongshu',
    identifierLabel: '公开笔记 URL / Public note URL',
    identifierValue: 'https://www.xiaohongshu.com/explore/69e7785b000000001f002d29?type=normal&xsec_source=app_share',
    availability: 'verified',
    summary: '小红书优先用你自己的发布记录，再保留公开笔记入口。 / Xiaohongshu uses your publish records first and keeps a public note entry as reference.',
    currentFinding: '已从发布清单恢复最近内容。 / Latest content was recovered from the manifest.',
    exampleUrl: 'https://www.xiaohongshu.com/explore/69e7785b000000001f002d29?type=normal&xsec_source=app_share'
  },
  x: {
    title: 'X',
    identifierLabel: '用户名 / Username',
    identifierValue: 'thisisyzspace',
    availability: 'blocked',
    summary: 'X 目前先用发布清单做监控，再保留公开主页入口。 / X is currently monitored from the publish manifest first, with the public profile kept as a reference entry.',
    currentFinding: '已从发布清单恢复最近内容。 / Latest content was recovered from the manifest.',
    exampleUrl: 'https://x.com/thisisyzspace'
  },
  douyin: {
    title: '抖音 / Douyin',
    identifierLabel: '创作者账号 / Creator account',
    identifierValue: 'Zigge_银子',
    availability: 'blocked',
    summary: '抖音目前以发布清单和创作者后台审核状态为准。 / Douyin is currently verified from the publish manifest and creator review state.',
    currentFinding: '已从发布清单恢复最近内容。 / Latest content was recovered from the manifest.',
    exampleUrl: 'https://creator.douyin.com/'
  }
};
