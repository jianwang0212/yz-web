"""Compact, table-based inline-CSS email following the existing GT/LY style."""
from html import escape
from model import validate

COLORS = {'critical': '#d93025', 'warning': '#a96800', 'ok': '#0b8043', 'unknown': '#6b7280', 'not_monitored': '#6b7280'}
LABELS = {'critical': '过高', 'warning': '偏高', 'ok': '', 'unknown': '无有效采样', 'not_monitored': '未纳入'}
FONT = "-apple-system,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif"


def subject(report):
    summary = report['summary']
    if not summary['collected'] and summary['unknown'] == 5:
        return '服务器 日监控 · 数据获取失败'
    short = {'thisisyz': 'ThisisYZ', 'a47g': 'A47g', 'japan': 'GT',
             'futu-algo': 'Futu', 'contabo-crypto': 'Contabo'}
    alerts = []
    for row in report['rows']:
        name = short[row['id']]
        for label, values in [('内存', [row['memory']]), ('CPU均值', list(row['cpu'].values())),
                              ('根盘占用', [row['disk']])]:
            states = {value['status'] for value in values}
            if 'critical' in states:
                alerts.append((0, name + ' ' + label + '过高'))
            elif 'warning' in states:
                alerts.append((2, name + ' ' + label + '偏高'))
        if not row['collected']:
            alerts.append((1, name + ' 采集异常'))
        else:
            for label, value in [('内存', row['memory']), ('根盘', row['disk'])]:
                if value['status'] == 'unknown':
                    alerts.append((1, name + ' ' + label + '采样缺失'))
        cpu = list(row['cpu'].values())
        if any(value['status'] == 'unknown' for value in cpu):
            alerts.append((1, name + ' CPU历史数据异常'))
        elif any(value['partial'] for value in cpu):
            alerts.append((1, name + ' CPU数据不完整'))
    messages = list(dict.fromkeys(text for _, text in sorted(alerts, key=lambda item: item[0])))
    if not messages:
        return '服务器 日监控 · 资源指标正常'
    return '服务器 日监控 · ' + '；'.join(messages[:3]) + (' 等报警' if len(messages) > 3 else '')


def percent(value):
    return f"{value:.2f}".rstrip('0').rstrip('.') + '%'


def display(value, approximate=False):
    text = (('约' if approximate else '') + percent(value['value'])) if value['value'] is not None else '—'
    if value['status'] == 'not_monitored':
        return '未纳入'
    label = ('历史读数' if value['value'] is not None else '无有效采样') if value['status'] == 'unknown' else LABELS[value['status']]
    return text + (' · ' + label if label else '') + ('（部分采样）' if value['partial'] else '')


def issues(report):
    alerts, missing = [], []
    for row in report['rows']:
        for label, item, approx in [('内存', row['memory'], True), ('根盘', row['disk'], False),
                                    ('CPU近7天均值', row['cpu']['7d'], False), ('CPU近30天均值', row['cpu']['30d'], False)]:
            if item['status'] in ['critical', 'warning']:
                alerts.append((item['status'], f"{row['name']}：{label} {display(item, approx)}"))
        if not row['collected']:
            missing.append(row['name'] + '：当前采集不可用或过期，不代表宕机')
        if row['id'] != 'contabo-crypto' and any(v['status'] == 'unknown' or v['partial'] for v in row['cpu'].values()):
            missing.append(row['name'] + '：CPU历史数据缺失、过期或部分采样')
    return sorted(alerts, key=lambda x: x[0] != 'critical'), missing


def cell(value, approximate=False):
    return f'<span style="color:{COLORS[value["status"]]};font-weight:600">{escape(display(value, approximate))}</span>'


def render(report):
    validate(report)
    s = report['summary']
    alerts, missing = issues(report)
    alert_html = ''.join(f'<div style="padding:5px 0;color:{COLORS[level]}">{escape(text)}</div>' for level, text in alerts)
    alert_html += ''.join(f'<div style="padding:5px 0;color:#6b7280">{escape(text)}</div>' for text in missing)
    if not alert_html:
        alert_html = '<div style="color:#0b8043">已采集指标均在当前阈值内。</div>'
    header = ''.join(f'<th style="padding:9px 8px;text-align:left;font-size:11px;color:#6b7280;border-bottom:2px solid #e3e6eb">{x}</th>' for x in ['服务器', 'CPU均值 7d / 30d', '内存最新', '根盘已用'])
    rows = ''
    for i, row in enumerate(report['rows']):
        at = row['memory']['at'] or ''
        at_label = at[5:16].replace('T', ' ') if len(at) >= 16 else '未取得采样'
        cpu_at = row['cpu']['7d']['at'] or '—'
        name = f'<b>{escape(row["name"])}</b><div style="font-size:10px;color:#6b7280">{"采集成功" if row["collected"] else "采集不可用"}</div>'
        cpu = cell(row['cpu']['7d']) if row['id'] == 'contabo-crypto' else cell(row['cpu']['7d']) + '<br>' + cell(row['cpu']['30d']) + f'<div style="font-size:9px;color:#6b7280">截至{escape(cpu_at[5:16].replace("T", " "))}</div>'
        values = [name, cpu, cell(row['memory'], True)+f'<div style="font-size:9px;color:#6b7280">{escape(at_label)}</div>', cell(row['disk'])]
        rows += f'<tr style="background:{"#ffffff" if i%2==0 else "#f8fafc"}">' + ''.join(f'<td style="padding:11px 8px;vertical-align:top;border-bottom:1px solid #e3e6eb;font-size:12px">{v}</td>' for v in values) + '</tr>'
    return f'''<!DOCTYPE html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f5f7;font-family:{FONT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:22px 10px"><tr><td align="center"><table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e3e6eb;border-radius:14px;overflow:hidden">
<tr><td style="background:#1a2330;padding:17px 22px;color:#ffffff"><b style="font-size:17px">服务器 · 每日监控</b><div style="font-size:11px;color:#9aa6b8">{escape(report['generatedAt'][:16].replace('T',' '))} 北京时间</div><div style="font-size:17px;margin-top:8px">采集 {s['collected']}/5 · <span style="color:#ff8a8a">红 {s['critical']}</span> · <span style="color:#e8be79">黄 {s['warning']}</span> · 数据缺失 {s['unknown']}</div></td></tr>
<tr><td style="padding:16px 22px"><b style="font-size:13px">需要关注</b><div style="font-size:12px;margin:7px 0 18px">{alert_html}</div><table id="server-metrics" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><thead><tr style="background:#f4f5f7">{header}</tr></thead><tbody>{rows}</tbody></table>
<div style="font-size:10px;color:#6b7280;margin-top:14px">CPU为阿里云近7/30天小时均值，非瞬时峰值；内存为最新只读采集估算。黄/红阈值：CPU60/80%，内存75/85%，根盘80/90%。采集成功不代表业务正常；历史读数不作当前正常判断。</div><div style="margin-top:15px;font-size:12px"><a style="color:#285ea8" href="https://thisisyz.com/projects/server-assets">打开私有监控页面 ↗</a></div></td></tr></table></td></tr></table></body></html>'''


def plain(report):
    validate(report)
    alerts, missing = issues(report)
    lines = [subject(report), report['generatedAt'] + ' 北京时间', '需要关注：']
    lines += [text for _, text in alerts] + missing or ['已采集指标均在当前阈值内']
    for row in report['rows']:
        lines.append(f"{row['name']} | CPU7d {display(row['cpu']['7d'])} /30d {display(row['cpu']['30d'])} | 内存 {display(row['memory'],True)} | 根盘 {display(row['disk'])}")
    return '\n'.join(lines) + '\nhttps://thisisyz.com/projects/server-assets'
