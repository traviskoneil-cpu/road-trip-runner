#!/usr/bin/env python3
"""Generate and master the complete HITZ 99.5 / The Blender voice package."""

from __future__ import annotations

import argparse
import base64
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
AUDITIONS = CLIPS / "auditions" / "2000s-repartee-reel-01"
REPORT = CLIPS / "00s-production-report.json"
MODEL = "eleven_v3"
OUTPUT_FORMAT = "mp3_44100_128"
TOAD_GAIN_DB = 4.0
MAX_ESTIMATED_CHARACTERS = 9_000


APPENDS = {
    "00s_intro_paperplanepulse_1.mp3": "WHOA!",
    "00s_intro_textmebackorelse2000s_1.mp3": "TOAD APPROVES!",
    "00s_intro_textmebackorelse_1.mp3": "SO BRIGHT!",
    "00s_intro_frostedtipsforever_1.mp3": "TOOOAD!",
    "00s_intro_brokenlink_1.mp3": "I'M FINE!",
    "00s_intro_dontfollowme_1.mp3": "SIBLINGS!",
    "00s_intro_iwasamountain_1.mp3": "MOUNTAIN!",
    "00s_intro_everytimeiclosemyeyes_1.mp3": "BANGER!",
    "00s_intro_moon_1.mp3": "MOON!",
    "00s_intro_drive_1.mp3": "VROOM!",
    "00s_intro_throughyoureyes_1.mp3": "OOF!",
    "00s_intro_backseatsunrise_2.mp3": "WINDOWS DOWN!",
    "00s_intro_paperplanepulse_2.mp3": "MYSTERY MAN!",
    "00s_intro_paperplanepulse_3.mp3": "CLEARED FOR TAKEOFF!",
    "00s_intro_textmebackorelse2000s_2.mp3": "DELETE HIM!",
    "00s_intro_textmebackorelse2000s_3.mp3": "TEAM BRITNEY!",
    "00s_intro_textmebackorelse_2.mp3": "SPARKLE!",
    "00s_intro_textmebackorelse_3.mp3": "TEAM MANDY!",
    "00s_intro_snakecharmerringtoneremix_2.mp3": "THAT'S MY PHONE!",
    "00s_intro_lasttime_1.mp3": "LAST TIME!",
    "00s_intro_lasttime_2.mp3": "RUN IT BACK!",
    "00s_intro_lasttime_3.mp3": "ONE MORE!",
    "00s_intro_halogenlamps_2.mp3": "ROBOT LOVE!",
    "00s_intro_frostedtipsforever_2.mp3": "SO MUCH GEL!",
    "00s_intro_frostedtipsforever_3.mp3": "FROSTED!",
    "00s_intro_parkinglotcodes_2.mp3": "BLUE SECTION!",
    "00s_intro_parkinglotcodes_3.mp3": "BANNED!",
    "00s_intro_brokenlink_2.mp3": "REFRESH!",
    "00s_intro_dontfollowme_2.mp3": "STILL SIBLINGS!",
    "00s_intro_iwasamountain_2.mp3": "ALWAYS YOU!",
    "00s_intro_passwords_2.mp3": "SPRINKLER!",
    "00s_intro_everytimeiclosemyeyes_2.mp3": "STICKY!",
    "00s_intro_foreverever_2.mp3": "THE GLOVE!",
    "00s_intro_moon_2.mp3": "MOON CONFIRMED!",
    "00s_intro_drive_2.mp3": "ROAD TRIP!",
    "00s_intro_throughyoureyes_2.mp3": "WE NOTICED!",
}


INTERRUPTIONS = {
    "00s_battle_textmeback_2.mp3": [
        ("jamie", "[breathless, delighted pop-radio hype] Stop the presses and FLIP open your phones — two artists, one song, zero patience! Britney Alexandra versus Mandy Sincere, back to back—"),
        ("toad", "[ecstatic boxing-announcer interruption] POP FIGHT!"),
    ],
    "00s_battle_textmeback_3.mp3": [
        ("jamie", "[huge, theatrical radio delivery] The Blender Battle is ON! Same title, two completely different levels of sparkle — Britney versus Mandy, and YOU are the judge—"),
        ("toad", "[chanting much too seriously] FIGHT! FIGHT! FIGHT!"),
    ],
    "00s_battle_textmebackround2_1.mp3": [
        ("jamie", "[fast, excited transition] Round one is in the BOOKS! Keep your scorecard out because contender number two is stepping up RIGHT now—"),
        ("toad", "[loud boxing-announcer blurt] ROUND TWO!"),
    ],
    "00s_battle_textmebackround2_2.mp3": [
        ("jamie", "[urgent but playful radio delivery] Do not touch that dial — version two is loading! Same demand, brand-new attitude, and the judges are already yelling—"),
        ("toad", "[panicked interruption] I LOST THE PENCIL!"),
    ],
    "00s_battle_textmebackwrap_1.mp3": [
        ("jamie", "[satisfied post-battle wrap-up] That's BOTH versions! Britney Alexandra and Mandy Sincere went back to back — you heard the evidence, now pick your winner—"),
        ("toad", "[proudly misunderstanding the assignment] I PICK BOTH!"),
        ("jamie", "[laughing] That is not how judging works, Toad!"),
    ],
    "00s_battle_textmebackwrap_2.mp3": [
        ("jamie", "[playful post-battle wrap-up] Battle COMPLETE! Two divas entered, two divas also left because that is how radio works — tell us who won—"),
        ("toad", "[victorious interruption] TOAD WINS!"),
        ("jamie", "[amused disbelief] You were not competing!"),
    ],
    "00s_intro_backseatsunrise_3.mp3": [
        ("jamie", "[bright, caffeinated traffic-report delivery] Traffic report: sun is UP, snacks are OPEN, and road conditions are—"),
        ("toad", "[instant, confidently useless interruption] ROAD!"),
        ("jamie", "[laughing, recovering quickly] Technically correct! The Sunroofs are taking over every speaker in the car with Backseat Sunrise!"),
    ],
    "00s_intro_halogenlamps_1.mp3": [
        ("jamie", "[bright, caffeinated pop-radio delivery] Ooh, this one gets MOODY—"),
        ("toad", "[a hushed but overconfident interruption] ROBOTS."),
        ("jamie", "[amused, immediately continuing] —Kilowatt Youth, Halogen Lamps. I'm PRETTY sure it's about two robots falling in love!"),
    ],
    "00s_intro_parkinglotcodes_1.mp3": [
        ("jamie", "[bright, fast pop-radio delivery] BLUE! BLUE! BLUE! You know the code—"),
        ("toad", "[loud, triumphant interruption] I KNOW THE CODE!"),
        ("jamie", "[barreling cheerfully onward] —mall pop-punk royalty Kacie Vandal, Parking Lot Codes!"),
    ],
    "00s_intro_passwords_1.mp3": [
        ("jamie", "[bright, playful radio delivery] Kick your shoes OFF! This is Marlowe Kai. He records everything in a HAMMOCK—"),
        ("toad", "[quick, dopey interruption] PASSWORD ONE TWO THREE FOUR!"),
        ("jamie", "[laughing but alarmed] Don't say it on the AIR, Toad! Passwords — so chill it's basically a nap!"),
    ],
    "00s_intro_passwords_3.mp3": [
        ("jamie", "[playful, bright radio delivery] Your password needs one number, one symbol, and one extremely relaxed surfer—"),
        ("toad", "[blurting out a terrible secret] TOAD ONE TWO THREE!"),
        ("jamie", "[genuinely alarmed but still upbeat] Change that IMMEDIATELY! Marlowe Kai with Passwords!"),
    ],
    "00s_intro_foreverever_1.mp3": [
        ("jamie", "[big, theatrical pop-radio delivery] Big lights, BIG feelings! The Velvet Casino, straight outta Vegas. The singer wears ONE sequined glove—"),
        ("toad", "[urgent, ridiculous interruption] ASK ABOUT THE GLOVE!"),
        ("jamie", "[delighted, finishing the introduction] —nobody asks about the glove! Forever and Ever!"),
    ],
    "00s_intro_snakecharmerringtoneremix_3.mp3": [
        ("jamie", "[fast, excited pop-radio delivery] DJ Nokia made an entire track out of beeps, buzzes, and one voicemail from his—"),
        ("toad", "[sudden worried interruption] IS THAT MY MOM?!"),
        ("jamie", "[without missing a beat] Different mom, Toad! Snake Charmer, Ringtone Remix!"),
    ],
    "00s_intro_drive_3.mp3": [
        ("jamie", "[big, rhythmic pop-radio delivery] Art school! Dance floor! Historical name they still cannot explain—"),
        ("toad", "[wildly confident interruption] THE MOON LANDING!"),
        ("jamie", "[amused disbelief, then punching the title] Not even CLOSE! Archduke is taking the wheel with Drive!"),
    ],
}


APPROVED_SOURCES = {
    "00s_intro_backseatsunrise_1.mp3": AUDITIONS / "01-tight-end-blurt-toad-forward.wav",
    "00s_intro_snakecharmerringtoneremix_1.mp3": AUDITIONS / "03-phone-mid-sentence-toad-forward.wav",
}


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    if ENV.exists():
        for raw in ENV.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip("'\"")
    required = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID_JAMIE", "ELEVENLABS_VOICE_ID_TOAD"]
    missing = [key for key in required if not values.get(key)]
    if missing:
        raise SystemExit(f"Missing required values in {ENV.name}: {', '.join(missing)}")
    return values


def parse_script() -> dict[str, str]:
    section = SCRIPT.read_text().split("## THE '00s", 1)[1].split("## Recording checklist", 1)[0]
    entries = dict(re.findall(r'^- `([^`]+\.mp3)` — "([^"]*)"', section, re.MULTILINE))
    if len(entries) != 104:
        raise SystemExit(f"Expected 104 scripted 00s clips, found {len(entries)}")
    return entries


def seed_for(filename: str) -> int:
    return int.from_bytes(hashlib.sha256(filename.encode()).digest()[:4], "big")


class ElevenLabs:
    def __init__(self, key: str):
        self.key = key

    def request(self, path: str, payload: dict) -> tuple[bytes, dict[str, str]]:
        request = urllib.request.Request(
            "https://api.elevenlabs.io" + path,
            data=json.dumps(payload).encode(),
            headers={"xi-api-key": self.key, "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                return response.read(), {k.lower(): v for k, v in response.headers.items()}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise RuntimeError(f"ElevenLabs HTTP {exc.code}: {detail}") from exc

    def speech(self, voice_id: str, text: str, filename: str) -> tuple[bytes, int]:
        quoted = urllib.parse.quote(voice_id, safe="")
        body, headers = self.request(
            f"/v1/text-to-speech/{quoted}?output_format={OUTPUT_FORMAT}",
            {"text": text, "model_id": MODEL, "seed": seed_for(filename)},
        )
        return body, int(headers.get("character-cost", "0"))

    def dialogue(self, inputs: list[dict[str, str]], filename: str) -> tuple[bytes, list[dict], int]:
        body, headers = self.request(
            f"/v1/text-to-dialogue/with-timestamps?output_format={OUTPUT_FORMAT}",
            {"inputs": inputs, "model_id": MODEL, "seed": seed_for(filename)},
        )
        decoded = json.loads(body)
        return (
            base64.b64decode(decoded["audio_base64"]),
            decoded.get("voice_segments", []),
            int(headers.get("character-cost", "0")),
        )

    def sound_effect(self, text: str, filename: str) -> tuple[bytes, int]:
        body, headers = self.request(
            f"/v1/sound-generation?output_format={OUTPUT_FORMAT}",
            {
                "text": text,
                "duration_seconds": 0.8,
                "prompt_influence": 0.65,
                "model_id": "eleven_text_to_sound_v2",
            },
        )
        return body, int(headers.get("character-cost", "0"))


def ffmpeg_master(source: Path, output: Path, toad_ranges: list[tuple[float, float]] | None = None) -> None:
    filters: list[str] = []
    if toad_ranges:
        gain = 10 ** (TOAD_GAIN_DB / 20)
        for start, end in toad_ranges:
            filters.append(f"volume={gain:.6f}:enable='between(t,{start:.4f},{end:.4f})'")
    filters.extend(
        [
            "silenceremove=start_periods=1:start_duration=0.03:start_threshold=-48dB:stop_periods=-1:stop_duration=0.08:stop_threshold=-48dB",
            "loudnorm=I=-16:TP=-1.5:LRA=11",
        ]
    )
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
            "-af", ",".join(filters), "-ar", "44100", "-ac", "1", "-b:a", "128k", str(output),
        ],
        check=True,
    )


def tagged_jamie(filename: str, text: str) -> str:
    if "_id_" in filename:
        cue = "bright, polished, caffeinated 2000s pop-radio station ID"
    elif "_ad_" in filename:
        cue = "fast, delighted, slightly over-the-top 2000s radio commercial"
    elif "_outro_" in filename:
        cue = "bright, punchy pop-radio back-announce with a smile"
    elif any(token in filename for token in ("_rain_", "_city_", "_unlock_")):
        cue = "excited, clear game-event announcement over music"
    else:
        cue = "bright, caffeinated, highly expressive 2000s pop-radio delivery"
    return f"[{cue}] {text}"


def dialogue_turns(filename: str, text: str, voices: dict[str, str]) -> list[dict[str, str]]:
    if filename in INTERRUPTIONS:
        turns = INTERRUPTIONS[filename]
    elif filename.startswith("00s_intro_"):
        turns = [
            ("jamie", tagged_jamie(filename, text)),
            ("toad", f"[loud, punchy, dopey end blurt] {APPENDS[filename]}"),
        ]
    elif filename == "00s_battle_textmeback_1.mp3":
        turns = [
            ("jamie", tagged_jamie(filename, text)),
            ("toad", "[loudly, like an imaginary boxing announcer] DING DING!"),
        ]
    else:
        raise KeyError(filename)
    return [{"voice_id": voices[speaker], "text": line} for speaker, line in turns]


def estimate_characters(entries: dict[str, str], voices: dict[str, str], force: bool = False) -> int:
    total = 0
    for filename, text in entries.items():
        if (CLIPS / filename).exists() and not force:
            continue
        if filename in APPROVED_SOURCES or filename == "00s_toad_9.mp3":
            continue
        if filename.startswith("00s_intro_") or filename.startswith("00s_battle_"):
            total += sum(len(turn["text"]) for turn in dialogue_turns(filename, text, voices))
        elif filename.startswith("00s_toad_"):
            total += len(f"[loud, punchy, dopey radio sidekick blurt] {text}")
        else:
            total += len(tagged_jamie(filename, text))
    return total


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg is required for silence trimming and mastering")
    env = load_env()
    voices = {"jamie": env["ELEVENLABS_VOICE_ID_JAMIE"], "toad": env["ELEVENLABS_VOICE_ID_TOAD"]}
    entries = parse_script()
    estimate = estimate_characters(entries, voices, args.force)
    print(f"Plan: {len(entries)} clips; estimated new dialogue characters: {estimate}")
    if estimate > MAX_ESTIMATED_CHARACTERS:
        raise SystemExit(f"Estimated usage exceeds safety cap of {MAX_ESTIMATED_CHARACTERS}")
    if args.dry_run:
        return 0

    CLIPS.mkdir(parents=True, exist_ok=True)
    api = ElevenLabs(env["ELEVENLABS_API_KEY"])
    cumulative_before = 0
    if REPORT.exists():
        try:
            previous_report = json.loads(REPORT.read_text())
            cumulative_before = int(
                previous_report.get("cumulative_character_cost", previous_report.get("new_character_cost", 0))
            )
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
    report: list[dict] = []
    spent = 0
    for index, (filename, text) in enumerate(entries.items(), 1):
        output = CLIPS / filename
        if output.exists() and not args.force:
            print(f"[{index:02d}/{len(entries)}] keep {filename}")
            report.append({"file": filename, "status": "existing", "script": text})
            continue
        print(f"[{index:02d}/{len(entries)}] generate {filename}")
        with tempfile.TemporaryDirectory(prefix="rtr-00s-") as temp_name:
            temp = Path(temp_name)
            raw = temp / "raw.audio"
            toad_ranges: list[tuple[float, float]] = []
            mode = "jamie"
            cost = 0
            production_script: list[dict[str, str]] | str = text
            if filename in APPROVED_SOURCES:
                source = APPROVED_SOURCES[filename]
                if not source.exists():
                    raise FileNotFoundError(source)
                raw = source
                mode = "approved-dialogue"
            elif filename == "00s_toad_9.mp3":
                audio, cost = api.sound_effect("A single short, obnoxious early-2000s radio DJ airhorn blast, clean one-shot", filename)
                raw.write_bytes(audio)
                mode = "sound-effect"
            elif filename.startswith("00s_intro_") or filename.startswith("00s_battle_"):
                turns = dialogue_turns(filename, text, voices)
                audio, segments, cost = api.dialogue(turns, filename)
                raw.write_bytes(audio)
                toad_ranges = [
                    (float(seg["start_time_seconds"]), float(seg["end_time_seconds"]))
                    for seg in segments if seg.get("voice_id") == voices["toad"]
                ]
                mode = "dialogue"
                production_script = turns
            elif filename.startswith("00s_toad_"):
                prompt = f"[loud, punchy, dopey radio sidekick blurt] {text}"
                audio, cost = api.speech(voices["toad"], prompt, filename)
                raw.write_bytes(audio)
                mode = "toad"
                production_script = prompt
            else:
                prompt = tagged_jamie(filename, text)
                audio, cost = api.speech(voices["jamie"], prompt, filename)
                raw.write_bytes(audio)
                production_script = prompt
            ffmpeg_master(raw, output, toad_ranges)
            spent += cost
            report.append(
                {
                    "file": filename,
                    "status": "generated",
                    "mode": mode,
                    "character_cost": cost,
                    "script": production_script,
                    "toad_gain_db": TOAD_GAIN_DB if mode in ("dialogue", "approved-dialogue") else None,
                }
            )
    REPORT.write_text(
        json.dumps(
            {
                "model": MODEL,
                "latest_run_character_cost": spent,
                "cumulative_character_cost": cumulative_before + spent,
                "clips": report,
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Complete: {len(entries)} clips; reported new character cost: {spent}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
