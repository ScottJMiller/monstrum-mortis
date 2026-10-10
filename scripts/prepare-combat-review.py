#!/usr/bin/env python3
"""Retain labeled actual browser screenshots after test:combat-browser; no game art edits."""
from pathlib import Path
import subprocess
import shutil
ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'dist/combat-checks'
target = ROOT / 'docs/step6-review'
target.mkdir(parents=True, exist_ok=True)
labels = ['Iron Widow', 'Gutter Seraph', 'Carrion Duke', 'Coil Saint', 'Maw Engine', 'The Unfinished']
frames = []
for number, label in enumerate(labels, 1):
    frame = source / f'rival-{number}.png'
    if not frame.exists():
        raise FileNotFoundError('Run npm run test:combat-browser first: ' + str(frame))
    thumbnail = target / f'rival-{number}.png'
    subprocess.run(['convert', str(frame), '-resize', '540x650>', '-background', '#17241a', '-gravity', 'center', '-extent', '540x650', str(thumbnail)], check=True)
    frames.extend(['-label', label, str(thumbnail)])
subprocess.run(['montage', '-font', 'DejaVu-Sans', '-pointsize', '20', '-fill', '#ece4c9', '-background', '#17241a', *frames, '-geometry', '540x650+12+12', '-tile', '3x2', str(target / 'rival-contact-sheet.png')], check=True)
for name in ['battle-desktop', 'battle-phone-portrait', 'battle-phone-landscape', 'battle-display-static', 'autopsy-desktop', 'session-results', 'detached-anatomy']:
    shutil.copyfile(source / f'{name}.png', target / f'{name}.png')
shutil.copyfile(source / 'simulation.json', target / 'simulation.json')
print('Retained six labeled real-renderer rivals, representative layouts/results, and simulation evidence in docs/step6-review.')
