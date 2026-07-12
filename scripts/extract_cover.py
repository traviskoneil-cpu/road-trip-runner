#!/usr/bin/env python3
"""Extract embedded album art (ID3v2 APIC) from a song into radio/covers/<era>/.

Pure Python — no ffmpeg, no PIL. Suno exports the cover inside the mp3; this
pulls it out so the song card shows art in the Runner mixtape and Dad Mode.

Usage:
    python3 scripts/extract_cover.py "radio/music/90s/Falling Down The Road.mp3"
    python3 scripts/extract_cover.py "radio/music/90s/Some Song.mp3" --era 90s

The era is inferred from the file's parent folder name when omitted. Output is
radio/covers/<era>/<same basename>.jpg (the extension the card expects).
"""
import sys, os, struct, argparse

def _synchsafe(b):  # ID3v2.4 sizes: 7 usable bits per byte
    return (b[0] << 21) | (b[1] << 14) | (b[2] << 7) | b[3]
def _plain(b):      # ID3v2.3 frame sizes: full 32-bit big-endian
    return struct.unpack(">I", b)[0]

def extract(mp3_path, out_path):
    with open(mp3_path, "rb") as f:
        data = f.read()
    if data[:3] != b"ID3":
        print("  no ID3v2 tag — nothing to extract"); return False
    ver_major = data[3]                       # 3 (v2.3) or 4 (v2.4)
    tag_size = _synchsafe(data[6:10])          # header size is always synchsafe
    pos, end = 10, 10 + tag_size
    while pos + 10 <= end:
        fid = data[pos:pos+4]
        if fid == b"\x00\x00\x00\x00":
            break
        raw = data[pos+4:pos+8]
        size = _synchsafe(raw) if ver_major >= 4 else _plain(raw)
        pos += 10
        body = data[pos:pos+size]
        pos += size
        if fid == b"APIC":
            enc = body[0]
            i = 1
            mime_end = body.index(b"\x00", i)
            mime = body[i:mime_end].decode("latin-1", "ignore")
            i = mime_end + 1
            i += 1                             # picture type byte
            if enc in (1, 2):                  # UTF-16 description: 2-byte null
                while body[i:i+2] != b"\x00\x00":
                    i += 2
                i += 2
            else:                              # latin-1 / utf-8: 1-byte null
                i = body.index(b"\x00", i) + 1
            img = body[i:]
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "wb") as o:
                o.write(img)
            print(f"  wrote {len(img)} bytes ({mime}) -> {out_path}")
            return True
    print("  no APIC frame found")
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mp3")
    ap.add_argument("--era", help="e.g. 90s (default: parent folder name)")
    args = ap.parse_args()
    era = args.era or os.path.basename(os.path.dirname(os.path.abspath(args.mp3)))
    base = os.path.splitext(os.path.basename(args.mp3))[0]
    out = os.path.join("radio", "covers", era, base + ".jpg")
    if not extract(args.mp3, out):
        sys.exit(1)

if __name__ == "__main__":
    main()
