# Battle v2 Phase B review — historical 13 October 2026 evidence

> Archived historical record. Current execution and evidence are in [implementation status](../../IMPLEMENTATION-STATUS.md). Original dated checks retain their scope; this file does not authorize work.

Latest 14 October scope/presentation update: timeout-only smaller winner/draw subtitle below final New Rocker lettering, and no strike SVG for a contact with a matching block. Saved-monster/card/cabinet requirements are removed, rather than deferred. Production UI/UX is Phase C; development contact sheets are references, not final shipping screens. The user authorized consolidation and dated `docs/archive/` moves after step 6 and A/B/C are complete/accepted; this cleanup is pending. See [current plan](../APPROVED-PLAN-through-phase-b.md#15-battle-v2-production-ui-and-completion-cleanup).

Current presentation is governed by the [14 October refinement review](BATTLE-V2-REFINEMENT-2026-10-14.md): intact damage artwork with text feedback, sound-only specials, supplied electric SVG, silent recover/shards, onset-only cues, terminal effect cleanup and cleaned rival registration. Counts, masks, procedural cues, screenshots and measurements below describe the prior 13 October library and are historical, not current promises.

Artwork refinement: the user-supplied archived humanoid concept now has a [revised transparent five-pose sheet](../../../assets/battle-v2/source/phase-b/family-2-style-candidate-intestines-v2.png) with compact intestinal coils instead of ambiguous pendulous organs. See the [before/after comparison](battle-v2-phase-b-review/intestines-before-after.png) and [exact prompt/provenance](../../../assets/battle-v2/intestine-refinement.json). This concept remains outside the runtime library; no selected body or registration changed. Inspected all five poses and passed check/build after the edit. Runtime browser evidence below remains the prior Phase B evidence.

The user authorized Phase B with “Proceed with Phase B”, accepting the Phase A sample gate for asset production. This milestone expands the **development-only** animation/audio library. Production gameplay, experimental anatomy, server/persistence/protocol, infrastructure, domains and deployed presentation remain unchanged. Phase C and deployment require a new instruction.

## Play the preview

```sh
npm run dev
# Open the printed Vite origin followed by /battle-v2 (normally http://127.0.0.1:5173/battle-v2)
npm run test:battle-v2-phase-b
npm run review:battle-v2
```

The preview needs Vite only, with no Worker or credentials. Enable sound on the device, then play/seek a timeline. **Frozen selected family / Timeline rival** use the offline producers' actual frozen descriptors and public timelines. Forty-seven legal recordings cover all 36 player/rival pairings, abilities and an eight-player attempt surviving all three timed detachments. One additional direction sampler is explicitly **art-only choreography**; it demonstrates rare recovery and both sides of each compact effect/shard response. The eleven original Phase A recordings/studies retain their labels and indices. Manual body, rival, arena and damage overrides, as well as incompatible modifier combinations, are explicitly **art-only** and do not change health, outcomes or the producer recording.

For inspection, choose **Pose and modifier registration**, a player/rival, pose role and modifier. Damage studies isolate wounds, melting, lost forelimbs and jaw wounds. The no-vote blob now has five actual poses, not just an idle animation. Its integrated appearance does not invent a limb: accepted Wandering Limb loss uses a graft scar and crawling cue. Glyphs never mirror; effects retain the user's actor-orientation/receiving-body placement rules. The preview is a development control gallery; the compact production UI remains Phase C.

## Produced inventory and provenance

| Deliverable | Actual readiness |
| --- | --- |
| Player families 1–5 and blob | Six independent five-role sets, plus existing family-1 forward bite variant |
| Iron Widow, Gutter Seraph, Carrion Duke, Coil Saint, Maw Engine, The Unfinished | Six independent five-role sets |
| Battlegrounds | Existing laboratory plus finished ossuary laboratory and anatomical foundry |
| Instrument panel | Existing finished Phase A apparatus panel retained |
| Non-tint modifiers | Textured rooted barb, marbled veins, surface mouth and tumorous shoulder eye; pose-local registration for every player family/role |
| Damage components | Wound/scar/shards/detached-hand textures, pose-local forelimb/jaw regions, health wounds and permanent accepted-event damage projection |
| Effects | All twenty current semantic presentations; supplied core SVGs retained, original native SVG components for compact specials/support/reactions |
| Sound | Fourteen supplied compressed cues retained plus twelve original procedural cues; 26 real decoded files |
| Lettering | Bundled New Rocker, approved 21 variants, stable public-event cosmetic choice, one major-word cap |
| Production integration | Pending Phase C; no new Worker caller, schema migration, wire fields or production entrypoint |

Ten new five-pose PNG sheets, two arenas and one eight-part graft sheet were generated with the built-in imagegen tool following the local imagegen skill. Exact prompts, identity references, originals, date/tool/terms and hashes are in [phase-b-generation.json](../../../assets/battle-v2/phase-b-generation.json). Three earlier style candidates were rejected because the reference pulled families 2/4/5 toward family-1 anatomy; those originals/reasons are retained. The final cephalopod, wax and skeletal silhouettes were regenerated as distinct specified families. No additional user asset is required for this produced library.

Extraction initially used equal cells. Actual inspection found uneven gutters and neighboring fragments/feet clipping, so the pipeline now derives row/column boundaries from the five actual connected figure bounds before cropping. Every pose in a set shares one scale; collapsed/low poses are not inflated to idle height. [Derivative ledger](../../../assets/battle-v2/phase-b-derivatives.json) records source/runtime hashes, crops, scales, sizes and registration. [Authored registration](../../../assets/battle-v2/phase-b-registration.json) contains pose-local eye zones, torso, shoulder, feet pivot and damage regions. Both blob and kitten eye pairs are protected from tint. The shoulder graft uses its own root and iris, including pupil motion. Opaque surface grafts clip against the actual body silhouette; they do not float across holes between bones. Existing active-slot competition and fixed 50% tint palettes remain unchanged.

The first damage iteration cut into the wax belly and left rectangular tooth gaps. Actual screenshots exposed this despite passing pixel-change assertions. Limb cuts were moved to exposed portions with per-pose central-body, eye and jaw protection, so overlapping painted roots cannot cut holes in the face/belly; tooth loss now uses a rounded closed wound over the registered jaw region, rather than a rectangular hole. The body family never changes, and detachment flags remain even if health subsequently recovers. These are registered presentation masks/grafts, not additional mechanical losses or a newly dealt mutation.

[Audio provenance](../../../assets/battle-v2/phase-b-audio-provenance.json) retains twelve deterministic project-authored oscillator/noise/metal-pulse recipes, exact seeds/script hash, WAV masters, AAC derivatives and decoded peak/mean levels. No external sample license or AI audio tool is invented. Sources are preserved; the added cues occupy **55,479 bytes**. The existing four 1.15 gains, device mute/volume, eight-voice limiter/ambient ducking and timely-only cue policy remain intact. The current effect registry remains [effects.ts](../../../src/client/battle-v2/effects.ts); source-aware porcelain retaliation uses the new shards cue, and repeated ticks stay compact. Native vector components and current render-source hashes are recorded in [the generated inventory](../../../assets/battle-v2/phase-b-inventory.json).

## Actual screenshots and motion/audio

These are screenshots from the actual renderer, not generated scene mockups:

- [Representative contact sheet](battle-v2-phase-b-review/contact-sheet.png): all bodies, arenas and legal producer damage/effects.
- [All twelve bodies / five roles](battle-v2-phase-b-review/poses-contact-sheet.png).
- [Registered grafts](battle-v2-phase-b-review/graft-contact-sheet.png) and [Phase A/B comparison](battle-v2-phase-b-review/before-after-grafts.png).
- [Damage studies](battle-v2-phase-b-review/damage-contact-sheet.png), [forelimb loss across poses](battle-v2-phase-b-review/damage-poses-limb-lost.png) and [jaw wounds across poses](battle-v2-phase-b-review/damage-poses-teeth-lost.png).
- [Directional effects](battle-v2-phase-b-review/effect-contact-sheet.png): labeled art-only isolation studies, including recovery and shards.
- [Desktop](battle-v2-phase-b-review/desktop.png), [phone portrait](battle-v2-phase-b-review/phone-portrait.png), [phone landscape](battle-v2-phase-b-review/phone-landscape.png), [reduced motion](battle-v2-phase-b-review/phone-reduced.png).
- [Browser-recorded animation with sound](battle-v2-phase-b-review/phase-b-recording.mp4), [captured audio](battle-v2-phase-b-review/live-audio.webm) and [actual motion frames](battle-v2-phase-b-review/motion-frames.png).

The recording seeks directly to an actual producer battle around its 12/18-second detachments, showing attack/defense/recoil changes, directional effects, bounded lettering and persistent damage against the same clock. The original regression also captures accepted-injection coalescing and the existing five-second integration reveal. Screenshot/recording hashes are in [review-evidence.json](battle-v2-phase-b-review/review-evidence.json).

## Measured budgets and scope

All twelve sets meet the **600,000-byte target** (family 1 includes its sixth bite derivative); the largest is kitten at **486,184 bytes**. The three arena files are **203,024 / 198,636 / 208,550 bytes**, each below 400,000. Selected-pair images, selected arena/panel and the small shared graft/SVG library total **1,018,871–1,423,093 bytes**. Other bodies are not preloaded. The LRU retains at most **28 image promises**; this does not guarantee that Chrome immediately frees its own decoded/GPU cache. Artwork loading never gates the recording clock; failure preserves health/text and offers retry.

All 26 AAC cues total **286,205 bytes**. Actual Web Audio buffers used **11,259,368 bytes** in the original regression's emulated-phone context. Selected pose dimensions calculate to **8,571,544–13,543,236 bytes** for one RGBA copy; that is not measured total GPU/browser memory. The bounds remain eight foreground voices, three semantic effects, one prominent word and three captions. Current production build excludes Battle v2 code/media entirely; unchanged production JS/CSS chunk hashes confirm the existing game bundle remains the baseline.

Local Chrome capture timing and decoded-audio evidence are in the two browser reports below. These are desktop/headless measurements with emulated phone viewports under recording load, not a physical-phone, Safari/Firefox, network/latency or Cloudflare quota claim. This environment captures and analyses actual audio output but cannot perceptually listen; volume/timbre preferences remain a human review.

## Checks actually completed

- `npm run check`: configuration guard, both TypeScript projects and all fourteen test files passed. Expanded individual enumeration passed **210 tests**: existing selectors/DNA/combat/admission plus focused source/hash/fixture/effect/audio/damage checks.
- `npm run test:battle-v2`: passed the original **ten browser scenarios / 72 presentations**, current sound/word/direction/gain/failure/recovery checks, build and **93-file production exclusion**. Current report: [phase-a-regression.json](battle-v2-phase-b-review/phase-a-regression.json); the older Phase A documents/artifacts remain preserved.
- `node tests/battle-v2-phase-b.browser.mjs`: passed eight expanded scenarios, including 60 body-role, 120 graft and 60 damage-role presentations, actual graft alpha-component checks and rendering/audio capture; [browser-evidence.json](battle-v2-phase-b-review/browser-evidence.json). This covers all twelve bodies, 120 overlay presentations, 60 limb/jaw damage pose presentations, actual raster damage changes, 36 frozen-family/rival pairs, 12/18-second producer boundaries, directional special studies, 26 decoded cues, phone/reduced layouts, WCAG scans and new-set load/retry.
- `npm run test:step6`: passed the full existing aggregate with check/build/Worker **dry run**, **13 room runtime**, **7 matchmaking runtime**, session-recovery and fresh-admission checks, **9 DNA runtime**, **9 presentation browser**, **8 DNA browser**, all 30 art modules/three combinations, **6 combat runtime**, **6 combat browser**, **48 authoritative / 12 definitive composition comparisons**, and **4,536 seeded simulations**. [Current simulation evidence](battle-v2-phase-b-review/simulation.json) is separate from historical step 6 records. NOSENTRY alarm-cancellation diagnostics occurred without failing the suite; exit status was zero. No deployment.
- Rebuilt Phase B art/audio/producer fixtures and measured the actual inventory; prepared review sheets/recording from actual screenshots. `git diff --check` passed.

The [validation report](battle-v2-phase-b-review/validation.json) records actual exit statuses and scope.

No server/Worker behavior changed, so no protocol/rules/schema bump is justified. The dry run/runtime suite provides local regression evidence; it does not establish deployed account/multiplayer behavior or persist Battle v2 descriptors.

## Human review and next phases

Review the five pose roles on all bodies, especially the narrow skeleton's graft legibility, surface-mouth coverage, shoulder-eye prominence and limb/jaw seams. Listen to electrical/roar/shard cues against the supplied core sounds at several volumes and through phone speakers/headphones. On physical phones, inspect portrait/landscape, reduced motion, gesture unlock/mute/reload, slow/failed asset recovery, readable captions/health and actual sustained memory/frame pacing. Confirm artwork identity/color/perspective and sound balance before rollout. No physical-device, subjective listening, deployed v2 synchronization or free-tier load verification was performed here.

**Phase B is the asset-library review milestone.** Phase C remains unimplemented: settle/freeze then atomically persist chosen form/background once, explicit legacy protocol/schema compatibility and race/restart/privacy tests, integrate production release/playback/audio, compact themed UI, Americas-only new entry, remove new Same-Room/display entry while retaining legacy recovery/permissions. Phase D is human device/performance/pacing acceptance. Deployment requires a separate instruction. Cards/cabinet/naming and unrelated gameplay stay outside this task.
