#!/usr/bin/env python3
"""Audit Wheel Jam tracks for rhythm-chart outliers."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SAMPLE_RATE = 22050
FRAME = 1024
HOP = 256


def decode_audio(path: Path) -> np.ndarray:
    command = [
        "ffmpeg", "-v", "error", "-i", str(path),
        "-f", "f32le", "-ac", "1", "-ar", str(SAMPLE_RATE), "pipe:1",
    ]
    result = subprocess.run(command, check=True, capture_output=True)
    return np.frombuffer(result.stdout, dtype="<f4").copy()


def moving_average(values: np.ndarray, width: int) -> np.ndarray:
    if len(values) < width:
        return np.full_like(values, float(np.mean(values)) if len(values) else 0)
    kernel = np.ones(width, dtype=np.float32) / width
    return np.convolve(values, kernel, mode="same")


def track_metrics(path: Path) -> dict[str, float | str]:
    audio = decode_audio(path)
    duration = len(audio) / SAMPLE_RATE
    if len(audio) < FRAME:
        raise ValueError(f"{path} is too short")

    frame_count = 1 + (len(audio) - FRAME) // HOP
    frames = np.lib.stride_tricks.as_strided(
        audio,
        shape=(frame_count, FRAME),
        strides=(audio.strides[0] * HOP, audio.strides[0]),
        writeable=False,
    )
    windowed = frames * np.hanning(FRAME).astype(np.float32)
    spectrum = np.log1p(np.abs(np.fft.rfft(windowed, axis=1))).astype(np.float32)
    flux = np.zeros(frame_count, dtype=np.float32)
    flux[1:] = np.maximum(0, spectrum[1:] - spectrum[:-1]).sum(axis=1)
    rms = np.sqrt(np.mean(frames * frames, axis=1))

    smooth_flux = moving_average(flux, 3)
    local_floor = moving_average(smooth_flux, 35)
    loud_reference = float(np.percentile(rms, 75))
    active = rms > loud_reference * 0.14
    threshold = local_floor * 1.32 + float(np.percentile(smooth_flux, 35)) * 0.18
    peak_mask = (
        active
        & (smooth_flux > threshold)
        & (smooth_flux >= np.roll(smooth_flux, 1))
        & (smooth_flux > np.roll(smooth_flux, -1))
    )
    peak_frames = np.flatnonzero(peak_mask)
    kept: list[int] = []
    min_gap = max(1, round(0.09 * SAMPLE_RATE / HOP))
    for frame in peak_frames:
        if not kept or frame - kept[-1] >= min_gap:
            kept.append(int(frame))
        elif smooth_flux[frame] > smooth_flux[kept[-1]] * 1.18:
            kept[-1] = int(frame)

    envelope = smooth_flux.copy()
    envelope[~active] = 0
    envelope -= float(np.mean(envelope))
    autocorrelation = np.correlate(envelope, envelope, mode="full")[len(envelope) - 1:]
    frames_per_second = SAMPLE_RATE / HOP
    min_lag = max(1, round(frames_per_second * 60 / 190))
    max_lag = min(len(autocorrelation) - 1, round(frames_per_second * 60 / 58))
    tempo_slice = autocorrelation[min_lag:max_lag + 1]
    lag = min_lag + int(np.argmax(tempo_slice)) if len(tempo_slice) else min_lag
    bpm = 60 * frames_per_second / lag
    rhythmicity = float(autocorrelation[lag] / max(1e-9, autocorrelation[0]))

    half_beat = max(1, lag / 2)
    phase_bins = max(4, round(half_beat))
    phase_histogram = np.zeros(phase_bins, dtype=np.float32)
    for frame in kept:
        phase_histogram[round(frame % half_beat) % phase_bins] += smooth_flux[frame]
    phase = int(np.argmax(phase_histogram))
    alignment_distances = [
        min((frame - phase) % half_beat, (phase - frame) % half_beat) / half_beat
        for frame in kept
    ]
    aligned_fraction = float(np.mean(np.array(alignment_distances) < 0.13)) if kept else 0

    active_frames = np.flatnonzero(active)
    first_active = int(active_frames[0]) if len(active_frames) else 0
    last_active = int(active_frames[-1]) if len(active_frames) else 0
    peak_rate = len(kept) / max(duration, 1) * 60
    return {
        "file": str(path.relative_to(ROOT)),
        "duration": round(duration, 2),
        "bpm": round(float(bpm), 1),
        "rhythmicity": round(rhythmicity, 3),
        "aligned": round(aligned_fraction, 3),
        "onsets_per_min": round(peak_rate, 1),
        "intro_silence": round(first_active * HOP / SAMPLE_RATE, 2),
        "tail_silence": round(max(0, duration - last_active * HOP / SAMPLE_RATE), 2),
    }


def main() -> None:
    catalog = json.loads((ROOT / "radio/stations.json").read_text())
    paths: list[Path] = []
    for era, station in catalog["stations"].items():
        for track in station.get("tracks", []):
            path = ROOT / "radio/music" / era / track["file"]
            if path.exists():
                paths.append(path)

    rows = [track_metrics(path) for path in paths]
    onset_rates = np.array([float(row["onsets_per_min"]) for row in rows])
    rhythmicity = np.array([float(row["rhythmicity"]) for row in rows])
    alignment = np.array([float(row["aligned"]) for row in rows])
    onset_mid = float(np.median(onset_rates))
    onset_scale = max(1, float(np.median(np.abs(onset_rates - onset_mid))))
    rhythm_mid = float(np.median(rhythmicity))
    rhythm_scale = max(0.01, float(np.median(np.abs(rhythmicity - rhythm_mid))))
    align_mid = float(np.median(alignment))
    align_scale = max(0.01, float(np.median(np.abs(alignment - align_mid))))

    for row in rows:
        density_outlier = abs(float(row["onsets_per_min"]) - onset_mid) / onset_scale
        weak_pulse = max(0, rhythm_mid - float(row["rhythmicity"])) / rhythm_scale
        weak_alignment = max(0, align_mid - float(row["aligned"])) / align_scale
        row["review_score"] = round(density_outlier * 0.45 + weak_pulse * 0.3 + weak_alignment * 0.25, 2)

    rows.sort(key=lambda row: float(row["review_score"]), reverse=True)
    print(json.dumps({
        "track_count": len(rows),
        "medians": {
            "onsets_per_min": round(onset_mid, 1),
            "rhythmicity": round(rhythm_mid, 3),
            "aligned": round(align_mid, 3),
        },
        "priority_review": rows[:16],
        "tracks": rows,
    }, indent=2))


if __name__ == "__main__":
    main()
