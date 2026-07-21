#!/usr/bin/env python3
"""Generate and master the KRZR 104 / The Razor voice package."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "radio" / "DJ_SCRIPT.md"
CLIPS = ROOT / "radio" / "clips"
ENV = ROOT / ".env.local"
REPORT = CLIPS / "80s-production-report.json"
MODEL = "eleven_v3"
OUTPUT_FORMAT = "mp3_44100_128"
MAX_ESTIMATED_CHARACTERS = 8_500


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    if ENV.exists():
        for raw in ENV.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip("'\"")
    required = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID_HURRICANE"]
    missing = [key for key in required if not values.get(key)]
    if missing:
        raise SystemExit(f"Missing required values in {ENV.name}: {', '.join(missing)}")
    return values


def parse_script() -> dict[str, str]:
    section = SCRIPT.read_text().split("### HURRICANE HAMMERS RECORDING CHECKLIST", 1)[1].split("\n---", 1)[0]
    entries = dict(re.findall(r'^- `([^`]+\.mp3)` — "([^"]*)"', section, re.MULTILINE))
    if len(entries) != 64:
        raise SystemExit(f"Expected 64 scripted 80s clips, found {len(entries)}")
    return entries


def seed_for(filename: str) -> int:
    return int.from_bytes(hashlib.sha256(filename.encode()).digest()[:4], "big")


def performance_prompt(filename: str, text: str) -> str:
    if "_id_" in filename:
        cue = "explosive gravelly 80s rock DJ"
    elif "_ad_" in filename:
        cue = "rapid monster-truck announcer"
    elif "_outro_" in filename:
        cue = "fast gravelly rock-DJ back-announce"
    elif any(token in filename for token in ("_rain_", "_city_", "_unlock_")):
        cue = "urgent loud gravelly 80s DJ"
    else:
        cue = "fast joyful gravelly 80s rock DJ"
    return f"[{cue}] {text}"


class ElevenLabs:
    def __init__(self, key: str):
        self.key = key

    def speech(self, voice_id: str, text: str, filename: str) -> tuple[bytes, int]:
        quoted = urllib.parse.quote(voice_id, safe="")
        request = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{quoted}?output_format={OUTPUT_FORMAT}",
            data=json.dumps({"text": text, "model_id": MODEL, "seed": seed_for(filename)}).encode(),
            headers={"xi-api-key": self.key, "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                headers = {k.lower(): v for k, v in response.headers.items()}
                return response.read(), int(headers.get("character-cost", "0"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise RuntimeError(f"ElevenLabs HTTP {exc.code}: {detail}") from exc


def master(source: Path, output: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
            "-af",
            "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-48dB:"
            "stop_periods=-1:stop_duration=0.07:stop_threshold=-48dB,loudnorm=I=-15:TP=-1.2:LRA=9",
            "-ar", "44100", "-ac", "1", "-b:a", "128k", str(output),
        ],
        check=True,
    )


def write_report(rows: list[dict], spent: int, error: str | None = None) -> None:
    REPORT.write_text(
        json.dumps(
            {
                "model": MODEL,
                "voice": "Rick 'Hurricane' Hammers",
                "latest_run_character_cost": spent,
                "error": error,
                "clips": rows,
            },
            indent=2,
        )
        + "\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg is required for silence trimming and mastering")
    env = load_env()
    entries = parse_script()
    estimate = sum(
        len(performance_prompt(filename, text))
        for filename, text in entries.items()
        if args.force or not (CLIPS / filename).exists()
    )
    print(f"Plan: {len(entries)} clips; estimated new dialogue characters: {estimate}")
    if estimate > MAX_ESTIMATED_CHARACTERS:
        raise SystemExit(f"Estimated usage exceeds safety cap of {MAX_ESTIMATED_CHARACTERS}")
    if args.dry_run:
        return 0

    CLIPS.mkdir(parents=True, exist_ok=True)
    api = ElevenLabs(env["ELEVENLABS_API_KEY"])
    voice_id = env["ELEVENLABS_VOICE_ID_HURRICANE"]
    rows: list[dict] = []
    spent = 0
    for index, (filename, text) in enumerate(entries.items(), 1):
        output = CLIPS / filename
        if output.exists() and not args.force:
            print(f"[{index:02d}/{len(entries)}] keep {filename}")
            rows.append({"file": filename, "status": "existing", "script": text})
            continue
        print(f"[{index:02d}/{len(entries)}] generate {filename}")
        prompt = performance_prompt(filename, text)
        try:
            audio, cost = api.speech(voice_id, prompt, filename)
            with tempfile.TemporaryDirectory(prefix="rtr-80s-") as temp_name:
                raw = Path(temp_name) / "raw.audio"
                raw.write_bytes(audio)
                master(raw, output)
        except Exception as exc:
            rows.append({"file": filename, "status": "failed", "script": prompt, "error": str(exc)})
            write_report(rows, spent, str(exc))
            raise
        spent += cost
        rows.append(
            {
                "file": filename,
                "status": "generated",
                "character_cost": cost,
                "script": prompt,
            }
        )
        write_report(rows, spent)
    print(f"Complete: {len(entries)} clips; reported new character cost: {spent}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
