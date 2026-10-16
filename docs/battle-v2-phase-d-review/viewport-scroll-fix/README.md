# Native scrolling and viewport fitting — 16 October 2026

User failures: iPhone/iPad swipes starting over the chamber/arena did not scroll; desktop integration/battle could exceed the window vertically until it was resized. Physical-device acceptance remains open.

## Correction

The chamber is decorative, but Pixi 8.22 attaches DOM input handlers and sets `touch-action: none` on its default canvas. Chamber now detaches that input target and disables stage interaction while preserving the renderer/ticker/texture lifecycle. Pixi documents null as the detach target (and uses it in its own destroy implementation), although its current TypeScript declaration omits null; the narrowly documented type exception covers that vendor mismatch.

Chamber camera, arena SVG/background and integration artwork pass pointer input through to the surrounding page. Native panning/zoom remains allowed. Artwork retry buttons remain outside that pass-through camera; text controls, specimen buttons and sliders retain normal interaction. There is no custom drag-to-scroll handler, weak gesture workaround or change to admission/clock/audio.

Desktop release/battle now uses available viewport height, with actual health/caption/control rows accounted for by flex/grid. The background still fills the content width; the entire SVG world fits uniformly within the remaining arena. Integration uses the same bounded space. Health, captions, Leave and sound/settings remain visible. Small windows or expanded recovery content can overflow into ordinary document scrolling rather than being hidden. No resize event is required to repair a phase transition. Phone/tablet layouts retain their viewport presentation and gesture behavior.

[Pixi EventSystem API](https://pixijs.download/v8.10.0/docs/events.EventSystem.html) and [W3C touch-action behavior](https://www.w3.org/TR/pointerevents3/#the-touch-action-css-property) support the diagnosis; the exact installed Pixi implementation was inspected locally. These references do not establish physical Safari verification.

## Reproducible local checks

- `npm run test:viewport-scroll`: real Presentation/Chamber/Stage components with existing producer timelines in isolated public layout fixtures. No production endpoint or hidden client import. Native Chromium touch input tests up/down swipes over chamber, integration and battle in phone/tablet portrait/landscape, plus static graphics fallback. Test-only overflow after the presentation makes page panning measurable even when the normal battle already fits the viewport. The same canvas remains attached during swipes; no animation backlog is introduced.
- Desktop cases: 1920×1080, 2560×720, 1440×900, 1366×768, 1280×600 and 1920×480, each entering integration and battle at an unchanged viewport. Assertions cover real scene/health/caption/control bounds and the complete uniformly scaled SVG world. Settings/Leave and subsequent live resizing are exercised.
- Existing built production-browser suite: independent local SQLite rooms, actual admission/injection/switch/recovery/results, sound/mute, accessibility and controls. Evidence is under [production-flow](production-flow/browser-evidence.json), separate from previous runs.

[Measurements](browser-evidence.json), [wide desktop battle](desktop-2560x720-battle.png), [short desktop battle](desktop-1920x480-battle.png), [phone battle](phone-battle.png), [tablet battle](tablet-battle.png). Screenshots were inspected. Current run/publication records are in [implementation status](../../IMPLEMENTATION-STATUS.md).

Exploratory harness corrections scoped selectors away from the hidden development gallery and allowed a reverse swipe to continue beyond the visible image edge. The final clean run passed all four touch orientations and twelve desktop phase/layout cases.

This is Chromium touch/viewport evidence, not iPhone/iPad Safari hardware, performance or quota acceptance. Refresh the deployed page and retest swiping in both directions starting on the creature, desktop battle entry without touching the window size, and sound/Leave/settings. Record device/OS/browser and remaining failures. No server rules, bindings, domains or art/audio source assets changed.
