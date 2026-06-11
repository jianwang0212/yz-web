#!/usr/bin/env python3

from __future__ import annotations

import argparse
import ast
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any


GT_ORIGIN = "http://47.242.15.127:9999"
GT_API_BASE = "http://47.242.15.127:5777"
DEFAULT_ACCOUNT = "yinzi"
DEFAULT_LEVELDB = pathlib.Path.home() / "Library/Application Support/Google/Chrome/Default/Local Storage/leveldb"
DEFAULT_ENV_FILE = pathlib.Path(__file__).resolve().parents[2] / ".env.gt.local"
ENV_BEARER_TOKEN = "GT_BEARER_TOKEN"
ENV_LOGIN_NAME = "GT_LOGIN_NAME"
ENV_PASSWORD = "GT_PASSWORD"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh GT data from GT login env, bearer token env, or Chrome local storage token.")
    parser.add_argument("--account", default=DEFAULT_ACCOUNT)
    parser.add_argument(
        "--auth-source",
        choices=("auto", "env-login", "env-token", "chrome"),
        default="auto",
        help=(
            "Token source. auto uses GT_BEARER_TOKEN, then GT_LOGIN_NAME/GT_PASSWORD, "
            "then Chrome local storage."
        ),
    )
    parser.add_argument(
        "--leveldb-dir",
        default=str(DEFAULT_LEVELDB),
        help="Chrome local storage LevelDB directory",
    )
    parser.add_argument(
        "--env-file",
        default=str(DEFAULT_ENV_FILE),
        help="Optional local env file for GT_LOGIN_NAME/GT_PASSWORD. Existing environment variables win.",
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


def load_env_file(path: pathlib.Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in raw_line:
            continue
        key, value = raw_line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


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


def login_gt_token(login_name: str, password: str) -> str:
    payload = json.dumps({"loginName": login_name, "password": password}).encode("utf-8")
    request = urllib.request.Request(
        f"{GT_API_BASE}/api/Login/login",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        try:
            result = json.loads(body) if body else {}
        except json.JSONDecodeError:
            result = {}
        message = result.get("message") or error.reason or f"HTTP {error.code}"
        raise RuntimeError(f"GT login failed for {login_name}: {message}") from error

    if not result.get("success"):
        message = result.get("message") or "login response did not report success"
        raise RuntimeError(f"GT login failed for {login_name}: {message}")
    token = result.get("data")
    if not isinstance(token, str) or not token:
        raise RuntimeError(f"GT login for {login_name} succeeded but response did not include a token")
    return token


def resolve_token(args: argparse.Namespace) -> str:
    if args.auth_source in {"auto", "env-token"}:
        token = os.environ.get(ENV_BEARER_TOKEN)
        if token:
            return token
        if args.auth_source == "env-token":
            raise RuntimeError(f"{ENV_BEARER_TOKEN} is not set")

    if args.auth_source in {"auto", "env-login"}:
        password = os.environ.get(ENV_PASSWORD)
        login_name = os.environ.get(ENV_LOGIN_NAME) or args.account
        if password:
            return login_gt_token(login_name, password)
        if args.auth_source == "env-login":
            raise RuntimeError(f"{ENV_PASSWORD} is not set")

    if args.auth_source in {"auto", "chrome"}:
        return load_gt_token(args.leveldbutil, pathlib.Path(args.leveldb_dir))

    raise RuntimeError(f"Unsupported auth source: {args.auth_source}")


def fetch_json(path: str, token: str) -> Any:
    request = urllib.request.Request(
        f"{GT_API_BASE}{path}",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        message = error.reason or f"HTTP {error.code}"
        if body:
            try:
                message = json.loads(body).get("message") or message
            except json.JSONDecodeError:
                pass
        endpoint = path.split("?", 1)[0]
        raise RuntimeError(f"GT API request failed for {endpoint}: HTTP {error.code} {message}") from error


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
    load_env_file(pathlib.Path(args.env_file))
    token = resolve_token(args)
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
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
