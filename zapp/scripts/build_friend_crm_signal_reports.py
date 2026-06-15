#!/usr/bin/env python3
from __future__ import annotations

import argparse
import collections
import datetime as dt
import html
import json
import math
import shutil
import sqlite3
import sys
from pathlib import Path
from typing import Any


WECHAT_SCRIPT_DIR = Path("/Users/ziyin/Codex/Projects/Wechat/scripts")
if str(WECHAT_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(WECHAT_SCRIPT_DIR))

import analyze_wechat_contact_signal as signal  # noqa: E402


DEFAULT_DB = Path(
    "/Users/ziyin/Code/CodexWorkspace/projects/wechatDatabase/data/wechat_memory_20260524_message0_increment.sqlite"
)
DEFAULT_REPORT_DIR = Path("zapp/apps/contact-signal-reports")
DEFAULT_OUTPUT = Path("zapp/apps/friend-crm-signal-data.json")
VERSION = "20260524signal1"
DEFAULT_MIN_MESSAGES = 1


GROUP_NOTES = {
    "reliance": "你对他说的依赖/求助",
    "complexity": "复杂问题、项目、产品、交易、合同等",
    "closure": "对方说的闭环交付",
    "decision": "对方说的判断/推进",
    "explanation": "对方说的解释力",
    "responsibility": "责任、道歉、感谢",
    "respect": "尊重边界",
    "reciprocity": "互惠支持",
    "money_fairness": "钱、预算、公平、合同",
    "conflict": "冲突压力场景，不是扣分项",
    "warmth": "情绪温度",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--report-dir", type=Path, default=DEFAULT_REPORT_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--min-messages", type=int, default=DEFAULT_MIN_MESSAGES)
    parser.add_argument("--version-tag", default=VERSION)
    return parser.parse_args()


def esc(value: Any) -> str:
    return html.escape(str(value), quote=True)


def source_meta(conn: sqlite3.Connection) -> dict[str, str]:
    try:
        rows = conn.execute("SELECT key, value FROM meta").fetchall()
    except sqlite3.Error:
        return {}
    return {str(row["key"]): str(row["value"]) for row in rows}


def build_contact_rows(conn: sqlite3.Connection, min_messages: int) -> list[dict[str, Any]]:
    by_contact: dict[str, dict[str, Any]] = {}
    for row in signal.private_text_rows(conn):
        username = row["username"] or row["conversation_id"]
        raw_display_name = signal.safe_name(row["conv_display_name"] or row["contact_display_name"])
        if bool(row["is_room"]) or signal.is_non_person_contact(username, raw_display_name, raw_display_name):
            continue
        text = signal.clean_text(row["content"])
        if not text:
            continue
        stats = by_contact.get(username)
        if stats is None:
            stats = signal.empty_contact_stats(username, raw_display_name)
            by_contact[username] = stats
        signal.update_stats(stats, row, text, signal.detect_groups(text))

    rows = [
        signal.stats_to_public(stats) | {"yearly": signal.serialize_yearly(stats["yearly"])}
        for stats in by_contact.values()
        if stats["total"] >= min_messages
    ]
    if not rows:
        return []

    rank_inputs = {
        "volume": {row["username"]: math.log1p(row["total"]) for row in rows},
        "days": {row["username"]: row["active_days"] for row in rows},
        "years": {row["username"]: len(row["active_years"]) for row in rows},
        "capability": {row["username"]: row["capability_raw"] for row in rows},
        "values": {row["username"]: row["values_raw"] for row in rows},
        "change": {row["username"]: row["change_raw"] for row in rows},
        "respect": {row["username"]: row["incoming_groups"]["respect"] for row in rows},
        "reliance": {row["username"]: row["outgoing_groups"]["reliance"] for row in rows},
    }
    ranks = {key: signal.percentile_ranks(values) for key, values in rank_inputs.items()}
    for row in rows:
        username = row["username"]
        row["capability_score"] = round(
            30 * ranks["capability"][username]
            + 20 * ranks["volume"][username]
            + 18 * ranks["days"][username]
            + 14 * ranks["reliance"][username]
            + 10 * ranks["years"][username]
            + 8 * ranks["respect"][username],
            1,
        )
        row["values_visibility_score"] = round(
            36 * ranks["values"][username]
            + 20 * ranks["respect"][username]
            + 18 * ranks["volume"][username]
            + 14 * ranks["days"][username]
            + 12 * ranks["years"][username],
            1,
        )
        row["change_score"] = round(
            55 * ranks["change"][username]
            + 20 * ranks["volume"][username]
            + 15 * ranks["days"][username]
            + 10 * ranks["years"][username],
            1,
        )
        row["evidence_score"] = round(
            row["capability_score"] * 0.4 + row["values_visibility_score"] * 0.34 + row["change_score"] * 0.26,
            1,
        )
        row["evidence_level"] = signal.evidence_level(row["total"], row["active_days"], len(row["active_years"]))
        row["read_first"] = signal.read_first(row)

    sorted_rows = sorted(rows, key=lambda item: item["evidence_score"], reverse=True)
    for index, row in enumerate(sorted_rows, 1):
        row["index_rank"] = index
        row["verdict"] = signal.build_contact_verdict(row)
    return sorted_rows


def report_url(contact_ref: str) -> str:
    return f"contact-signal-reports/{contact_ref}.html?v={VERSION}"


def public_contact(contact: dict[str, Any]) -> dict[str, Any]:
    keys = [
        "contact_ref",
        "display_name",
        "index_rank",
        "evidence_score",
        "capability_score",
        "values_visibility_score",
        "change_score",
        "evidence_level",
        "read_first",
        "total",
        "outgoing",
        "incoming",
        "outgoing_share",
        "incoming_share",
        "active_days",
        "active_months",
        "active_years",
        "first_day",
        "last_day",
        "late_rate",
        "avg_out_chars",
        "avg_in_chars",
        "groups",
        "incoming_groups",
        "outgoing_groups",
        "rates",
        "yearly",
        "verdict",
    ]
    row = {key: contact.get(key) for key in keys if key in contact}
    row["reportUrl"] = report_url(contact["contact_ref"])
    return row


def render_index_page(contacts: list[dict[str, Any]], meta: dict[str, Any]) -> str:
    rows = "\n".join(
        "<tr>"
        f"<td>{item['index_rank']}</td>"
        f"<td><a href='{esc(Path(item['reportUrl']).name)}'>{esc(item['display_name'])}</a><div class='small'>{esc(item['contact_ref'])}</div></td>"
        f"<td>{item['evidence_score']}</td>"
        f"<td>{item['capability_score']}</td>"
        f"<td>{item['values_visibility_score']}</td>"
        f"<td>{item['change_score']}</td>"
        f"<td>{esc(item['read_first'])}</td>"
        f"<td>{esc(item['evidence_level'])}</td>"
        f"<td>{item['total']}</td>"
        f"<td>{item['active_days']}</td>"
        f"<td>{esc(item['first_day'])} -> {esc(item['last_day'])}</td>"
        "</tr>"
        for item in contacts
    )
    return page_shell(
        "WeChat 联系人信号索引",
        f"""
        <section class="grid">
          <article class="card"><div class="k">联系人</div><div class="v">{len(contacts)}</div><p>私聊文本不少于 {meta['minMessages']} 条</p></article>
          <article class="card"><div class="k">最新文本</div><div class="v">{esc(meta.get('latestMessageAt') or '--')}</div><p>来自 5月24日增量库</p></article>
          <article class="card"><div class="k">公式</div><div class="v">40/34/26</div><p>实力、价值观可观察度、历史变化</p></article>
        </section>
        <section>
          <h2>索引</h2>
          <table>
            <thead><tr><th>#</th><th>联系人</th><th>总证据</th><th>实力</th><th>价值观</th><th>变化</th><th>先看</th><th>强度</th><th>文本</th><th>活跃日</th><th>范围</th></tr></thead>
            <tbody>{rows}</tbody>
          </table>
        </section>
        """,
    )


def render_contact_page(contact: dict[str, Any], meta: dict[str, Any]) -> str:
    year_rows = "\n".join(
        "<tr>"
        f"<td>{esc(year)}</td>"
        f"<td>{bucket['total']}</td>"
        f"<td>{bucket['outgoing']}</td>"
        f"<td>{bucket['incoming']}</td>"
        f"<td>{bucket['active_days']}</td>"
        f"<td>{bucket['outgoing_share']}%</td>"
        f"<td>{bucket['rates']['complexity']}%</td>"
        f"<td>{bucket['rates']['closure']}%</td>"
        f"<td>{bucket['rates']['respect']}%</td>"
        f"<td>{bucket['rates']['conflict']}%</td>"
        "</tr>"
        for year, bucket in contact["yearly"].items()
    )
    group_rows = "\n".join(
        "<tr>"
        f"<td>{esc(signal.GROUP_LABELS[group])}<div class='small'>{esc(GROUP_NOTES[group])}</div></td>"
        f"<td>{contact['groups'][group]}</td>"
        f"<td>{contact['incoming_groups'][group]}</td>"
        f"<td>{contact['outgoing_groups'][group]}</td>"
        f"<td>{contact['rates'][group]}%</td>"
        "</tr>"
        for group in signal.TERM_GROUPS
    )
    verdict = "".join(f"<li>{esc(line)}</li>" for line in contact.get("verdict", []))
    return page_shell(
        f"WeChat 联系人信号 - {contact['display_name']}",
        f"""
        <section class="note">
          <p>这个页面是证据密度报告，不是人格审判，也不是 LLM 读心。实力看别人是否依赖他、他是否闭环和解释复杂问题；价值观看压力、利益、边界场景；历史变化看这些模式几年里是否迁移。</p>
          <p><a href="../friend-crm.html">返回人脉 CRM</a> · <a href="index.html?v={VERSION}">打开信号索引</a></p>
        </section>
        <section class="grid">
          <article class="card"><div class="k">索引排名</div><div class="v">#{contact.get('index_rank') or '--'}</div><p>私聊联系人证据密度</p></article>
          <article class="card"><div class="k">总证据</div><div class="v">{contact.get('evidence_score')}</div><p>实力 0.40 + 价值观 0.34 + 变化 0.26</p></article>
          <article class="card"><div class="k">实力信号</div><div class="v">{contact.get('capability_score')}</div><p>被依赖、闭环、判断、解释、复杂问题</p></article>
          <article class="card"><div class="k">价值观信号</div><div class="v">{contact.get('values_visibility_score')}</div><p>价值观可观察度，不等于人品分</p></article>
          <article class="card"><div class="k">历史变化</div><div class="v">{contact.get('change_score')}</div><p>2021-2023 与 2025-2026 的主题漂移</p></article>
          <article class="card"><div class="k">证据强度</div><div class="v">{esc(contact.get('evidence_level'))}</div><p>{contact.get('total')} 条文本，{contact.get('active_days')} 个活跃日</p></article>
        </section>
        <section>
          <h2>一秒钟判断</h2>
          <ul>{verdict}</ul>
        </section>
        <section>
          <h2>年度变化</h2>
          <table>
            <thead><tr><th>年</th><th>总文本</th><th>你发</th><th>对方发</th><th>活跃日</th><th>你发占比</th><th>复杂问题</th><th>闭环</th><th>尊重边界</th><th>冲突压力</th></tr></thead>
            <tbody>{year_rows}</tbody>
          </table>
        </section>
        <section>
          <h2>证据结构</h2>
          <table>
            <thead><tr><th>信号</th><th>全部</th><th>对方说</th><th>你说</th><th>占比</th></tr></thead>
            <tbody>{group_rows}</tbody>
          </table>
        </section>
        <section class="note">
          <p>数据源：{esc(meta.get('sourceDbLabel'))}；最新文本：{esc(meta.get('latestMessageAt') or '--')}。本 Zapp 版报告不包含原始聊天片段。</p>
        </section>
        """,
    )


def page_shell(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>{esc(title)}</title>
  <style>
    :root {{ --bg:#f4f7fb; --panel:#fff; --line:#d7e0ea; --text:#172033; --muted:#667085; --accent:#2563eb; --shadow:0 14px 34px rgba(20,32,54,.08); }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; color:var(--text); background:var(--bg); font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }}
    main {{ width:min(1120px,100%); margin:0 auto; padding:18px 16px 40px; }}
    h1 {{ margin:0 0 14px; font-size:clamp(1.5rem,4vw,2.25rem); letter-spacing:0; overflow-wrap:anywhere; }}
    h2 {{ margin:0 0 12px; font-size:1.15rem; letter-spacing:0; }}
    a {{ color:var(--accent); font-weight:800; text-decoration:none; }}
    section {{ margin:0 0 14px; padding:16px; border:1px solid var(--line); border-radius:8px; background:var(--panel); box-shadow:var(--shadow); }}
    .note {{ color:#344054; }}
    .grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1px; padding:0; overflow:hidden; background:var(--line); }}
    .card {{ min-height:104px; padding:14px; background:var(--panel); }}
    .k {{ color:var(--muted); font-size:.78rem; font-weight:850; text-transform:uppercase; }}
    .v {{ margin-top:4px; font-size:1.55rem; font-weight:850; line-height:1.15; font-variant-numeric:tabular-nums; }}
    .card p {{ margin:5px 0 0; color:var(--muted); font-size:.82rem; }}
    .small {{ margin-top:2px; color:var(--muted); font-size:.78rem; }}
    table {{ width:100%; min-width:860px; border-collapse:collapse; }}
    th,td {{ padding:9px 10px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; overflow-wrap:anywhere; }}
    th {{ background:#eef3f8; color:#344054; font-weight:850; }}
    section:has(table) {{ overflow:auto; }}
    footer {{ color:var(--muted); font-size:.8rem; }}
    @media (max-width: 760px) {{
      main {{ padding:14px 12px 32px; }}
      h1 {{ font-size:1.45rem; line-height:1.2; }}
      section {{ padding:12px; margin-bottom:12px; }}
      .grid {{ grid-template-columns:repeat(2,minmax(0,1fr)); gap:1px; }}
      .card {{ min-height:0; padding:12px; }}
      .card:nth-child(2) {{ grid-column:1 / -1; grid-row:2; }}
      .card:nth-child(3) {{ grid-column:2; grid-row:1; }}
      .v {{ font-size:1.32rem; white-space:nowrap; }}
      .card:nth-child(2) .v {{ font-size:1.15rem; }}
      table, thead, tbody, tr, th, td {{ display:block; }}
      table {{ min-width:0; border-collapse:separate; border-spacing:0; }}
      thead {{ display:none; }}
      tbody {{ display:grid; gap:10px; }}
      tr {{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; padding:12px; border:1px solid var(--line); border-radius:8px; background:var(--panel); }}
      td {{ min-width:0; padding:0; border:0; color:var(--text); overflow-wrap:anywhere; }}
      td::before {{ display:block; margin-bottom:1px; color:var(--muted); font-size:.68rem; font-weight:850; line-height:1.1; }}
      td:first-child {{ grid-column:1; grid-row:1; color:var(--muted); font-weight:850; }}
      td:nth-child(1)::before {{ content:"排名"; }}
      td:nth-child(2) {{ grid-column:2 / -1; grid-row:1; }}
      td:nth-child(2)::before {{ content:"联系人"; }}
      td:nth-child(n+3) {{ padding-top:6px; border-top:1px solid #e9eef5; font-weight:800; font-variant-numeric:tabular-nums; white-space:nowrap; }}
      td:nth-child(3)::before {{ content:"总证据"; }}
      td:nth-child(4)::before {{ content:"实力"; }}
      td:nth-child(5)::before {{ content:"价值观"; }}
      td:nth-child(6)::before {{ content:"变化"; }}
      td:nth-child(7)::before {{ content:"先看"; }}
      td:nth-child(8)::before {{ content:"强度"; }}
      td:nth-child(9)::before {{ content:"文本"; }}
      td:nth-child(10)::before {{ content:"活跃日"; }}
      td:nth-child(11) {{ grid-column:1 / -1; white-space:normal; }}
      td:nth-child(11)::before {{ content:"范围"; }}
      section:has(table) {{ overflow:visible; }}
      .small {{ font-size:.72rem; overflow-wrap:anywhere; }}
    }}
    @media (max-width: 360px) {{
      .grid {{ grid-template-columns:minmax(0,1fr); }}
      .card:nth-child(2), .card:nth-child(3) {{ grid-column:auto; grid-row:auto; }}
      tr {{ grid-template-columns:repeat(2,minmax(0,1fr)); }}
      td:nth-child(2) {{ grid-column:1 / -1; grid-row:auto; }}
    }}
  </style>
</head>
<body>
  <main>
    <h1>{esc(title)}</h1>
    {body}
  </main>
</body>
</html>
"""


def main() -> None:
    args = parse_args()
    global VERSION
    VERSION = args.version_tag
    args.report_dir.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(args.report_dir)
    args.report_dir.mkdir(parents=True, exist_ok=True)

    conn = signal.connect_readonly(args.db)
    try:
        meta_rows = source_meta(conn)
        index_rows = build_contact_rows(conn, args.min_messages)
        generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
        meta = {
            "generatedAt": generated_at,
            "sourceDbLabel": args.db.name,
            "sourceDb": str(args.db),
            "minMessages": args.min_messages,
            "contactCount": len(index_rows),
            "latestMessageAt": meta_rows.get("incremental_imported_at") or meta_rows.get("imported_at"),
            "messageMaxAt": conn.execute("SELECT max(created_at) FROM messages").fetchone()[0],
            "note": "Evidence-density ranking over private one-to-one text chats; group chats and system accounts are excluded.",
            "formula": {
                "evidenceScore": "capabilityScore * 0.40 + valuesVisibilityScore * 0.34 + changeScore * 0.26",
                "capability": "closure, decision, explanation, complexity, and outgoing reliance",
                "valuesVisibility": "responsibility, respect, reciprocity, money/fairness, and conflict scenes",
                "change": "theme-rate drift between 2021-2023 and 2025-2026 plus volume shift",
            },
            "privacy": "Zapp HTML reports omit raw chat snippets.",
        }
        contacts: list[dict[str, Any]] = []
        for index, row in enumerate(index_rows, 1):
            public = public_contact(row)
            contacts.append(public)
            (args.report_dir / f"{row['contact_ref']}.html").write_text(
                render_contact_page(public, meta),
                encoding="utf-8",
            )
            if index % 50 == 0:
                print(f"generated {index}/{len(index_rows)} reports")
        (args.report_dir / "index.html").write_text(render_index_page(contacts, meta), encoding="utf-8")
        payload = {"meta": meta, "contacts": contacts}
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    finally:
        conn.close()

    print(f"Wrote {len(contacts)} signal reports -> {args.report_dir}")
    print(f"Signal data: {args.output}")


if __name__ == "__main__":
    main()
