#!/usr/bin/env python3

from __future__ import annotations

import argparse
import ast
import json
import os
import pathlib
import subprocess
import tempfile
import urllib.request
from datetime import datetime, timezone
from typing import Any


GT_ORIGIN = "http://47.242.15.127:9999"
GT_API_BASE = "http://47.242.15.127:5777"
DEFAULT_ACCOUNT = "yinzi"
DEFAULT_LEVELDB = pathlib.Path.home() / "Library/Application Support/Google/Chrome/Default/Local Storage/leveldb"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh GT data from Chrome local storage token + GT API.")
    parser.add_argument("--account", default=DEFAULT_ACCOUNT)
    parser.add_argument(
        "--leveldb-dir",
        default=str(DEFAULT_LEVELDB),
        help="Chrome local storage LevelDB directory",
    )
    parser.add_argument(
        "--leveldbutil",
        default=os.environ.get("LEVELDBUTIL", "/opt/homebrew/bin/leveldbutil"),
        help="Path to leveldbutil",
    )
    parser.add_argument(
        "--output",
        default="zapp/apps/gt-data.json",
        help="Where to write normalized GT JSON",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print normalized JSON to stdout instead of writing a file",
    )
    return parser.parse_args()


def decode_leveldb_value(encoded: str) -> str:
    value = ast.literal_eval(encoded)
    if isinstance(value, str):
        raw = value.encode("latin1")
    else:
        raw = value
    if raw[:1] == b"\x01":
        raw = raw[1:]
    return raw.decode("utf-8")


def load_gt_token(leveldbutil: str, leveldb_dir: pathlib.Path) -> str:
    files = [str(path) for path in sorted(leveldb_dir.iterdir()) if path.suffix in {".ldb", ".log"}]
    if not files:
        raise RuntimeError(f"No LevelDB files found under {leveldb_dir}")

    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp_path = pathlib.Path(temp.name)
    try:
        with temp_path.open("wb") as out:
            subprocess.run([leveldbutil, "dump", *files], stdout=out, stderr=subprocess.DEVNULL, check=True)
        encoded = None
        for line in temp_path.read_text(errors="replace").splitlines()[::-1]:
            if GT_ORIGIN in line and "id_token" in line and "del => " not in line:
                _, _, tail = line.partition("=>")
                encoded = tail.strip()
                break
        if not encoded:
            raise RuntimeError("No current GT id_token found in Chrome local storage")
        return decode_leveldb_value(encoded)
    finally:
        temp_path.unlink(missing_ok=True)


def fetch_json(path: str, token: str) -> Any:
    request = urllib.request.Request(
        f"{GT_API_BASE}{path}",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def coerce_number(value: Any) -> Any:
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def normalize_row(row: dict[str, Any], prev_net_value: float | None) -> dict[str, Any]:
    asset_net_value = float(row.get("assetNetValue") or 0)
    pct_change = None
    if prev_net_value not in (None, 0):
        pct_change = (asset_net_value - prev_net_value) / prev_net_value * 100
    return {
        "date": row["lastRunDate"],
        "totalAsset": int(round(float(row.get("totalAsset") or 0))),
        "baseAsset": int(round(float(row.get("baseAsset") or 0))),
        "assetNetValue": asset_net_value,
        "todayProfit": coerce_number(float(row.get("todayProfit") or 0)),
        "remark": row.get("remark") or "",
        "btcTotalAsset": int(round(float(row.get("btcTotalAsset") or 0))),
        "btcAssetNetValue": float(row.get("btcAssetNetValue") or 0),
        "btcTodayProfit": coerce_number(float(row.get("btcTodayProfit") or 0)),
        "pctChange": pct_change,
    }


def normalize_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    prev_net_value: float | None = None
    for row in rows:
        item = normalize_row(row, prev_net_value)
        normalized.append(item)
        prev_net_value = item["assetNetValue"]
    return normalized


def pick_pct_extreme(rows: list[dict[str, Any]], fn) -> dict[str, Any]:
    valid = [row for row in rows if row["pctChange"] is not None]
    if not valid:
        return rows[0]
    return fn(valid, key=lambda row: row["pctChange"])


def build_stats(rows: list[dict[str, Any]]) -> dict[str, Any]:
    first = rows[0]
    latest = rows[-1]
    valid_pct = [row for row in rows if row["pctChange"] is not None]
    return {
        "count": len(rows),
        "startDate": first["date"],
        "endDate": latest["date"],
        "firstNetValue": first["assetNetValue"],
        "latestNetValue": latest["assetNetValue"],
        "periodPctChange": ((latest["assetNetValue"] - first["assetNetValue"]) / first["assetNetValue"] * 100)
        if first["assetNetValue"]
        else 0,
        "totalProfit": coerce_number(sum(float(row["todayProfit"]) for row in rows)),
        "positiveDays": sum(1 for row in valid_pct if row["pctChange"] > 0),
        "negativeDays": sum(1 for row in valid_pct if row["pctChange"] < 0),
        "bestPctDay": pick_pct_extreme(rows, max),
        "worstPctDay": pick_pct_extreme(rows, min),
    }


def build_payload(account: str, today: dict[str, Any], daily_rows: list[dict[str, Any]], weekly_rows: list[dict[str, Any]], monthly_rows: list[dict[str, Any]]) -> dict[str, Any]:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    current_total = int(round(float(today.get("totalAsset") or daily_rows[-1]["totalAsset"])))
    exchange_assets = []
    for row in today.get("data", []):
        value = int(round(float(row.get("exchangeAsset") or 0)))
        share = (value / current_total * 100) if current_total else 0
        exchange_assets.append(
            {
                "platform": row.get("platform") or "Unknown",
                "exchangeAsset": value,
                "share": share,
            }
        )

    last60_daily = daily_rows[-60:]
    remarks = [row for row in daily_rows if row["remark"]]

    return {
        "meta": {
            "app": "GT",
            "account": account,
            "source": f"{GT_ORIGIN}/#/myAsset",
            "downloadedAt": now,
            "structuredAt": now,
            "currency": "USDT-equivalent U",
            "notes": [
                "Platform-level data is available only as the current exchange snapshot.",
                "Daily, weekly, and monthly historical series are account-level totals/net values.",
            ],
        },
        "accounts": [account],
        "current": {
            "date": daily_rows[-1]["date"],
            "totalAsset": current_total,
            "exchangeAssets": exchange_assets,
        },
        "series": {
            "daily": daily_rows,
            "weekly": weekly_rows,
            "monthly": monthly_rows,
            "last60Daily": last60_daily,
        },
        "stats": {
            "daily": build_stats(daily_rows),
            "weekly": build_stats(weekly_rows),
            "monthly": build_stats(monthly_rows),
            "last60Daily": build_stats(last60_daily),
            "remarksCount": len(remarks),
            "exportedAt": now,
        },
        "remarks": remarks,
        "exportRows": daily_rows,
    }


def main() -> int:
    args = parse_args()
    token = load_gt_token(args.leveldbutil, pathlib.Path(args.leveldb_dir))
    today = fetch_json(f"/api/UserAsset/getTodayAsset?username={args.account}", token)
    daily_rows = normalize_rows(fetch_json(f"/api/UserAsset/getAssetLine?username={args.account}&interval=day", token))
    weekly_rows = normalize_rows(fetch_json(f"/api/UserAsset/getAssetLine?username={args.account}&interval=week", token))
    monthly_rows = normalize_rows(fetch_json(f"/api/UserAsset/getAssetLine?username={args.account}&interval=month", token))
    payload = build_payload(args.account, today, daily_rows, weekly_rows, monthly_rows)

    if args.stdout:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    output_path = pathlib.Path(args.output)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
