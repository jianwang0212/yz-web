#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAYER_NICKNAME = "三次参赛"
PLAYER_ID = "5acab1e5-0496-4258-b0ee-f2fca71dc34a"
GROUP_TYPE = 2
BASE_URL = "https://spdspc.qhrb.com.cn/api"
DATA_PATH = ROOT / "apps" / "qhrb-san-ci-can-sai-data.json"
LOG_PATH = ROOT / "apps" / "qhrb-net-worth-update-log.json"
APP_JS_PATH = ROOT / "apps" / "qhrb-net-worth.js"
HTML_PATH = ROOT / "apps" / "qhrb-net-worth.html"
APPS_PATH = ROOT / "apps.json"
SW_PATH = ROOT / "sw.js"
LOG_LIMIT = 288


def get_json(path: str, params: dict[str, object] | None = None) -> dict:
    query = ""
    if params:
        query = "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{BASE_URL}{path}{query}",
        headers={
            "User-Agent": "Mozilla/5.0 Zapp-QHRB-Updater/1.0",
            "Accept": "application/json,text/plain,*/*",
            "Referer": "https://spdspc.qhrb.com.cn/",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        payload = response.read().decode("utf-8")
    data = json.loads(payload)
    if data.get("statusCode") != 1:
        raise RuntimeError(f"{path} failed: {data.get('statusMessage') or data}")
    return data


def ymd(value: str) -> str:
    return str(value).split(" ")[0]


def update_text(path: Path, replacements: list[tuple[str, str]]) -> None:
    text = path.read_text()
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text)
    path.write_text(text)


def load_json(path: Path, fallback):
    if not path.exists():
        return fallback
    with path.open() as f:
        return json.load(f)


def snapshot(data: dict) -> dict:
    records = data.get("records") or []
    record = records[0] if records else {}
    player_id = record.get("playerId") or PLAYER_ID
    detail = data.get("detailsByPlayerId", {}).get(player_id, {})
    basic = detail.get("basicDataFrontVO", {})
    rows = detail.get("netWorthVOList") or []
    latest_row = rows[-1] if rows else {}
    return {
        "tradeDate": data.get("tradeDate"),
        "rank": record.get("sortNo"),
        "latestNetWorth": basic.get("netWorth"),
        "rankNetWorth": record.get("netWorth"),
        "totalNetWorth": record.get("totalNetWorth"),
        "equity": record.get("dateBalanceToday"),
        "netProfit": record.get("netProfit"),
        "riskDegree": record.get("riskDegree"),
        "withrawalRate": record.get("withrawalRate"),
        "comprehensiveScore": record.get("comprehensiveScore"),
        "rows": len(rows),
        "latestCurveDate": latest_row.get("tradeDate"),
        "latestCurveNetWorth": latest_row.get("netWorth"),
    }


def meaningful_data(data: dict) -> dict:
    return {
        "tradeDate": data.get("tradeDate"),
        "nickname": data.get("nickname"),
        "groupType": data.get("groupType"),
        "groupName": data.get("groupName"),
        "rank": data.get("rank"),
        "total": data.get("total"),
        "records": data.get("records"),
        "detailsByPlayerId": data.get("detailsByPlayerId"),
    }


def diff_summary(before: dict | None, after: dict) -> list[dict]:
    if not before:
        return [{"field": "data", "before": None, "after": snapshot(after)}]
    old = snapshot(before)
    new = snapshot(after)
    changes = []
    for key, new_value in new.items():
        old_value = old.get(key)
        if old_value != new_value:
            changes.append({"field": key, "before": old_value, "after": new_value})
    return changes


def write_log(entry: dict) -> None:
    log = load_json(LOG_PATH, {"entries": []})
    entries = [entry, *log.get("entries", [])][:LOG_LIMIT]
    LOG_PATH.write_text(json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n")


def main() -> None:
    old_data = load_json(DATA_PATH, None)
    latest_date = ymd(get_json("/spsread2026/adm/getLastDayFront")["dataPoints"])
    fetched_at = datetime.now().replace(microsecond=0).isoformat()
    version = latest_date.replace("-", "")

    list_params = {
        "internalAccount": "",
        "playerNickName": PLAYER_NICKNAME,
        "tradeDate": latest_date,
        "deadlineTime": latest_date,
        "groupType": GROUP_TYPE,
        "rankType": 0,
        "index": 1,
        "size": 50,
        "selType": 0,
    }
    rank_data = get_json("/spsread2026/groupBaseFront/getBaseScoreTotalListAdm", list_params)["dataPoints"]
    records = rank_data.get("list") or []
    if not records:
        raise RuntimeError(f"No QHRB records found for {PLAYER_NICKNAME} on {latest_date}")

    player_id = records[0]["playerId"]
    detail = get_json(
        "/spsread2026/curveFront/getBasicVo",
        {
            "playerId": player_id,
            "tradeDate": latest_date,
            "deadlineTime": latest_date,
        },
    )["dataPoints"]

    output = {
        "source": "https://spdspc.qhrb.com.cn/#/",
        "fetchedAt": fetched_at,
        "tradeDate": latest_date,
        "nickname": PLAYER_NICKNAME,
        "groupType": GROUP_TYPE,
        "groupName": "重量组",
        "rank": "total",
        "total": rank_data.get("total", len(records)),
        "records": records,
        "detailsByPlayerId": {player_id: detail},
    }
    changes = diff_summary(old_data, output)
    changed = bool(changes)

    log_entry = {
        "checkedAt": fetched_at,
        "status": "changed" if changed else "no_change",
        "sourceTradeDate": latest_date,
        "summary": snapshot(output),
        "changes": changes,
    }
    write_log(log_entry)

    if not changed and old_data and meaningful_data(old_data) == meaningful_data(output):
        print(json.dumps(log_entry, ensure_ascii=False, indent=2))
        return

    DATA_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")

    with APPS_PATH.open() as f:
        apps_json = json.load(f)
    apps_json["store"]["build"] = int(apps_json["store"].get("build", 0)) + 1
    apps_json["store"]["updated"] = latest_date
    for app in apps_json["apps"]:
        if app.get("id") == "qhrb-net-worth":
            app["build"] = int(app.get("build", 0)) + 1
            app["updated"] = latest_date
            app["url"] = f"apps/qhrb-net-worth.html?v={version}"
            break
    APPS_PATH.write_text(json.dumps(apps_json, ensure_ascii=False, indent=2) + "\n")

    update_text(
        APP_JS_PATH,
        [(r'qhrb-san-ci-can-sai-data\.json\?v=\d+', f"qhrb-san-ci-can-sai-data.json?v={version}")],
    )
    update_text(
        HTML_PATH,
        [(r'qhrb-net-worth\.css\?v=\d+', f"qhrb-net-worth.css?v={version}"),
         (r'qhrb-net-worth\.js\?v=\d+', f"qhrb-net-worth.js?v={version}")],
    )
    update_text(
        SW_PATH,
        [(r'const CACHE_VERSION = "zapp-store-v[^"]+";', f'const CACHE_VERSION = "zapp-store-v37-{version}-qhrb-monitor";')],
    )

    print(
        json.dumps(
            log_entry,
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
