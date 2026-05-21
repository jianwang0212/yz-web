#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path


DEFAULT_INPUT = Path("/Users/ziyin/Codex/Projects/Wechat/style_clone/zi_self_messages_decrypted_full.json")
DEFAULT_OUTPUT = Path("/Users/ziyin/Codex/Projects/yz-web/zapp/apps/zi-style-reply-memory.json")
SKIP_PREFIXES = ("[图片]", "[表情]", "[语音]", "[视频]", "[链接", "[文件]", "[动画表情]")


CATEGORY_PATTERNS = {
    "work": re.compile(r"项目|文档|doc|codex|prompt|api|模型|数据|测试|发版|部署|app|server|private|github|doublecheck", re.I),
    "time": re.compile(r"今天|明天|晚上|下午|早上|周末|几点|晚点|等我|到时候|时间|Boston|纽约|LA|北京", re.I),
    "decision": re.compile(r"可以|不行|先|要不然|我觉得|我感觉|应该|不用|别|不要|需要|最好"),
    "care": re.compile(r"辛苦|谢谢|感谢|没事|慢慢来|不着急|休息|吃饭|睡|身体|开心|难受"),
    "social": re.compile(r"哈哈|喜欢|想你|见面|出来|吃饭|喝|朋友|关系|聊天|有意思"),
    "question": re.compile(r"[?？]|什么|为什么|怎么|咋|谁|哪里|哪儿|要不要|能不能|可不可以"),
}


def load_messages(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        messages = data.get("messages", [])
    elif isinstance(data, list):
        messages = data
    else:
        messages = []
    return [message for message in messages if isinstance(message, dict)]


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def usable(text: str) -> bool:
    if not 4 <= len(text) <= 180:
        return False
    if text.startswith(SKIP_PREFIXES):
        return False
    if re.search(r"https?://|www\.|<sysmsg|CDATA|local_id=", text, re.I):
        return False
    if re.fullmatch(r"[\W_]+", text):
        return False
    if re.fullmatch(r"(好|好的|可以|可以的|嗯|啊|哦|哈哈哈?|谢谢|ok|OK|yes|no)[。.!！?？~～]*", text):
        return False
    return True


def categories_for(text: str) -> list[str]:
    categories = [name for name, pattern in CATEGORY_PATTERNS.items() if pattern.search(text)]
    return categories or ["general"]


def tokenize(text: str) -> list[str]:
    lowered = text.lower()
    tokens = set(re.findall(r"[a-z0-9][a-z0-9_+-]{1,24}", lowered))
    chinese = re.findall(r"[\u4e00-\u9fff]", lowered)
    for char in chinese:
        tokens.add(char)
    for index in range(len(chinese) - 1):
        tokens.add("".join(chinese[index : index + 2]))
    return sorted(tokens)[:80]


def richness_score(text: str) -> float:
    score = min(len(text), 120) / 8
    if re.search(r"[?？]", text):
        score += 3
    if re.search(r"因为|所以|但是|不过|然后|先|再|不然|要不然|我觉得|我感觉", text):
        score += 5
    if re.search(r"[a-zA-Z]", text):
        score += 2
    if 12 <= len(text) <= 80:
        score += 4
    if len(text) < 8:
        score -= 6
    return score


def build_examples(messages: list[dict], limit: int) -> list[dict]:
    best_by_text: dict[str, dict] = {}
    for message in messages:
        if str(message.get("type") or "") not in {"文本", "text", "Text", ""}:
            continue
        text = clean_text(str(message.get("content") or ""))
        if not usable(text):
            continue
        existing = best_by_text.get(text)
        score = richness_score(text)
        if existing and existing["score"] >= score:
            continue
        best_by_text[text] = {
            "text": text,
            "time": str(message.get("time") or ""),
            "chat": str(message.get("chat") or ""),
            "categories": categories_for(text),
            "tokens": tokenize(text),
            "score": round(score, 2),
        }

    by_category: dict[str, list[dict]] = defaultdict(list)
    for example in best_by_text.values():
        for category in example["categories"]:
            by_category[category].append(example)

    selected: list[dict] = []
    seen = set()
    per_category = max(60, limit // max(len(by_category), 1))
    for category, examples in sorted(by_category.items()):
        examples.sort(key=lambda item: item["score"], reverse=True)
        for example in examples[:per_category]:
            if example["text"] in seen:
                continue
            seen.add(example["text"])
            selected.append(example)

    if len(selected) < limit:
        rest = sorted(best_by_text.values(), key=lambda item: item["score"], reverse=True)
        for example in rest:
            if len(selected) >= limit:
                break
            if example["text"] in seen:
                continue
            seen.add(example["text"])
            selected.append(example)

    selected.sort(key=lambda item: (-item["score"], item["text"]))
    return [
        {
            "text": item["text"],
            "categories": item["categories"],
            "tokens": item["tokens"],
        }
        for item in selected[:limit]
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build compact Zi style retrieval memory for Zapp.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--limit", type=int, default=1400)
    args = parser.parse_args()

    messages = load_messages(args.input)
    examples = build_examples(messages, args.limit)
    payload = {
        "source": str(args.input),
        "raw_count": len(messages),
        "example_count": len(examples),
        "version": 1,
        "examples": examples,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {args.output} with {len(examples)} examples from {len(messages)} raw messages")


if __name__ == "__main__":
    main()
