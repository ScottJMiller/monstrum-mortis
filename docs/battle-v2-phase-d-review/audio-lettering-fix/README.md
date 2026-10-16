# Touch audio and terminal lettering correction — 16 October 2026

User evidence: iPhone and iPad stayed silent in Safari and Chrome; longer terminal wording sometimes exceeded the desktop arena. Physical-device acceptance remains open.

## Changes

- Automatic unlock uses trusted completed taps/clicks and keyboard gestures instead of touch `pointerdown`. Each real retry can call `resume()` on the same context even if an earlier resume is still pending. Fetch/decode/graph work is deduplicated separately; failed samples can be retried without decoding successful ones again.
- Where available, request `navigator.audioSession.type = 'playback'` inside the gesture. This uses Apple media playback rather than the ambient/ringer channel. Unsupported session or optional review-capture APIs cannot prevent audio. Saved mute/volume, half-second initial fade, hidden-page silence, voice limits, limiter, ducking and current-event-only cues remain.
- Final New Rocker wording measures actual loaded glyphs against its own arena width and height, including on resize/font load. Both approved timeout phrases and defeat words stay centered and unrotated. Timeout-only winner text remains at least 18px and wraps when needed. No wording, outcome, battle duration, server contract, art or sound source changed.

Diagnosis is supported by source inspection and modeled browser behavior, **not a Safari hardware trace**. WebKit documents [touch `pointerup`/`touchend`, rather than non-mouse `pointerdown`, as activation events](https://webkit.org/blog/13862/the-user-activation-api/), and [the iOS 17+ playback-session setting for ringer-muted Web Audio](https://bugs.webkit.org/show_bug.cgi?id=237322#c6). Older Apple versions without that API may still require disabling hardware silent mode. Device media volume and explicit saved mute still apply.

## Reproduction and evidence

`npm run test:audio-lettering` runs six focused state-machine tests and the real-renderer browser study. Requires installed Linux Chrome at `/usr/bin/google-chrome` (or `MM_CHROME_PATH`) and local server/browser permissions.

- Six tests: pending-resume retry; concurrent unlock/decode deduplication; interrupted context with saved mute/hidden-page suppression; unsupported optional APIs; closing during unlock; failed-asset retry.
- Three browser inputs: actual trusted touch taps in 390×844/768×1024 Chromium contexts, plus desktop mouse click. Strict activation instrumentation rejects premature resumes; native AudioContext decodes all 24 actual AAC samples. Captured PCM has nonzero amplitude. Device mute toggles and teardown are checked. This is neither subjective sound-balance listening nor physical Safari evidence.
- 32 typography cases: all four terminal phrases × eight wide/narrow/short/phone/tablet/result layouts, plus resizing an already-mounted final frame. Real element bounds, loaded fonts, centering and timeout-only winner text are asserted. Screenshots were visually inspected.
- [Browser measurements](browser-evidence.json). [Before](before-long-timeout.png) reproduces the old viewport font CSS on the real Stage, rather than claiming a historical deployed capture. [After narrow desktop](after-desktop-panel.png), [short desktop](after-desktop-short.png), [phone](after-phone.png), [tablet](after-tablet.png).

Run records and publication are in the current [implementation status](../../IMPLEMENTATION-STATUS.md). The existing full production-browser flow is a separate regression; backend semantics are unchanged.

## Physical retest

Refresh the deployed page, tap Enter laboratory (or another control after automatic splash expiry), and confirm Sound on and nonzero device media volume. Test Safari on iPhone/iPad, including silent mode on a current iOS/iPadOS version. Check injection/battle sound, mute/unmute, reload and return from app switching. If return is silent, tap a control/Enable sound to resume. Verify no old cue burst. Record OS/browser/model and failures. On desktop, check both timeout variants, winner line and resizing/zoom. These checks are not marked passed by local emulation.
