#!/usr/bin/env python3

import json
import os
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS_DIR = ROOT / "prompts"
FILES_DIR = ROOT / "files"
OUTPUT_JSON = ROOT / "manifest.json"
OUTPUT_JS = ROOT / "manifest.js"

TEXT_EXTENSIONS = {
    ".md",
    ".txt",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".json",
    ".yml",
    ".yaml",
    ".py",
    ".go",
    ".rs",
    ".sh",
    ".sql",
    ".css",
    ".html",
    ".toml",
    ".ini",
    ".conf",
    ".env",
}

MAX_INLINE_SIZE = 200_000


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"[^a-z0-9\u4e00-\u9fa5\-]", "", value)
    value = re.sub(r"-+", "-", value)
    value = value.strip("-")
    return value


def extract_markdown_meta(content: str):
    body = content.strip()
    tags = []

    if body.startswith("---"):
        end = body.find("---", 3)
        if end != -1:
            front = body[3:end].strip()
            body = body[end + 3 :].strip()
            for line in front.splitlines():
                line = line.strip()
                if line.lower().startswith("tags:"):
                    raw = line.split(":", 1)[1].strip()
                    raw = raw.replace("[", "").replace("]", "").replace('"', "")
                    tags = [t.strip() for t in raw.split(",") if t.strip()]
                    break

    lines = body.splitlines()
    title = ""
    for line in lines:
        if line.startswith("#"):
            title = re.sub(r"^#+\s*", "", line).strip()
            break

    desc = ""
    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            continue
        if trimmed.startswith("#"):
            continue
        if trimmed.startswith("- "):
            continue
        if trimmed.startswith("```"):
            continue
        desc = trimmed
        break

    return title, desc, tags


def walk_files(base: Path):
    for root, _, files in os.walk(base):
        for name in files:
            yield Path(root) / name


def build_prompts():
    if not PROMPTS_DIR.exists():
        return []
    items = []
    for file in walk_files(PROMPTS_DIR):
        if file.suffix.lower() != ".md":
            continue
        content = file.read_text(encoding="utf8")
        title, desc, tags = extract_markdown_meta(content)
        file_name = file.stem
        final_title = title or file_name
        final_desc = desc or "Prompt 文档"
        item = {
            "id": f"prompt-{slugify(final_title or file_name)}",
            "title": final_title,
            "desc": final_desc,
            "tags": tags,
            "path": file.relative_to(ROOT).as_posix(),
            "type": "prompt",
            "ext": ".md",
            "content": content,
        }
        items.append(item)
    return sorted(items, key=lambda x: x["title"])


def build_files():
    if not FILES_DIR.exists():
        return []
    items = []
    for file in walk_files(FILES_DIR):
        if file.name == ".DS_Store":
            continue
        rel = file.relative_to(ROOT).as_posix()
        ext = file.suffix.lower()
        stat = file.stat()
        is_text = ext in TEXT_EXTENSIONS
        content = None
        if is_text and stat.st_size <= MAX_INLINE_SIZE:
            content = file.read_text(encoding="utf8")
        item = {
            "id": f"file-{slugify(rel)}",
            "title": file.name,
            "desc": rel,
            "path": rel,
            "type": "file",
            "ext": ext,
            "size": stat.st_size,
            "isText": is_text,
            "content": content,
        }
        items.append(item)
    return sorted(items, key=lambda x: x["title"])


def build_manifest():
    return {
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "prompts": build_prompts(),
        "files": build_files(),
    }


def write_outputs(manifest):
    OUTPUT_JSON.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    OUTPUT_JS.write_text(
        "window.PROMPT_HUB_MANIFEST = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf8",
    )


def main():
    manifest = build_manifest()
    write_outputs(manifest)
    print(f"Manifest updated: {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
