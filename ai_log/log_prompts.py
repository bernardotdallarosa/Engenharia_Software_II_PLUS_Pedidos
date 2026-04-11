#!/usr/bin/env python3
import json
import sys
import os
import re
import subprocess
from datetime import datetime, timezone

def get_git_branch():
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=5
        )
        return result.stdout.strip() if result.returncode == 0 else "unknown"
    except Exception:
        return "unknown"

def get_git_user_name():
    try:
        result = subprocess.run(
            ["git", "config", "--get", "user.name"],
            capture_output=True, text=True, timeout=5
        )
        user_name = result.stdout.strip()
        return user_name if result.returncode == 0 and user_name else "unknown"
    except Exception:
        return "unknown"

def get_git_email():
    try:
        result = subprocess.run(
            ["git", "config", "--get", "user.email"],
            capture_output=True, text=True, timeout=5
        )
        email = result.stdout.strip()
        return email if result.returncode == 0 and email else None
    except Exception:
        return None

def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    prompt = re.sub(r"<[a-z_]+>.*?</[a-z_]+>\n?", "", input_data.get("prompt", ""), flags=re.DOTALL).strip()
    if not prompt:
        sys.exit(0)

    call_context = {
        key: value
        for key, value in input_data.items()
        if key not in {"prompt", "session_id"}
    }

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "git_branch": get_git_branch(),
        "git_user_name": get_git_user_name(),
        "call_context": call_context,
        "prompt": prompt
    }

    username = get_git_email() or re.sub(r"[^a-zA-Z0-9]", "_", entry["git_user_name"]).lower()
    log_path = os.path.join(os.path.dirname(__file__), f"prompt_log_{username}.json")

    entries = []
    if os.path.exists(log_path):
        try:
            with open(log_path, "r") as f:
                entries = json.load(f)
        except (json.JSONDecodeError, IOError):
            entries = []

    entries.append(entry)

    with open(log_path, "w") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()