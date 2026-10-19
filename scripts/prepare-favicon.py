"""Rebuild small, transparent browser icons from the retained generated master."""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "assets/favicon/source/blob-face.png"
REFERENCE = "assets/battle-v2/runtime/phase-b/blob-idle.webp"
COMMANDS = [
    ["convert", SOURCE, "-resize", "64x64", "-strip", "public/favicon.png"],
    ["convert", SOURCE, "-resize", "180x180", "-strip", "public/apple-touch-icon.png"],
    ["convert", SOURCE, "-define", "icon:auto-resize=48,32,16", "public/favicon.ico"],
]


def record(path):
    data = (ROOT / path).read_bytes()
    return {"path": path, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


for command in COMMANDS:
    subprocess.run(command, cwd=ROOT, check=True)

provenance = {
    "asset": "Monstrum Mortis circular blob-face favicon",
    "generationDate": "2026-10-19",
    "tool": "Built-in image_gen.imagegen; underlying model identifier not exposed.",
    "exactPrompt": (ROOT / "assets/favicon/prompt.txt").read_text().strip(),
    "reference": {**record(REFERENCE), "role": "Project-owned starter-blob character reference."},
    "source": record(SOURCE),
    "derivatives": [record(command[-1]) for command in COMMANDS],
    "processing": {
        "tool": "ImageMagick; uniform downscaling and PNG/ICO encoding only, preserving alpha.",
        "commands": COMMANDS,
        "icoSizes": [48, 32, 16],
        "pngSize": 64,
        "appleTouchSize": 180,
        "script": record("scripts/prepare-favicon.py"),
    },
    "originAndRights": "Generated project artwork based on project-owned art, subject to applicable OpenAI service terms. No third-party stock license or exclusivity guarantee is asserted.",
    "deployment": "Only the three small derivatives in public/ ship. Original, prompt and provenance stay outside public/.",
}
(ROOT / "assets/favicon/provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
print("Prepared transparent 64px PNG, 180px Apple touch icon and 16/32/48px ICO.")
