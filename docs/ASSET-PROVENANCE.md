# Asset provenance and production (steps 4–6)

> Current scope: [Battle v2 specification](BATTLE-V2-SPEC.md) and [Phase B plan](BATTLE-V2-PHASE-B-PLAN.md) govern the development-only animation/audio library. Saved-monster/card/cabinet work was cancelled on 14 October 2026; the unproduced card frame has been removed from the current asset manifest. Historical production/verification records below retain their dates. Earlier integration/battle appearance, region-selection, Same-Room and display-entry guidance below is historical and superseded for the future redesign. Production behavior and legacy permissions remain unchanged until Phase C. Historical verification below did not test Battle v2.


The chamber, starter body/eyes/mouth and 30 mutation modules were produced with the built-in OpenAI image-generation tool on 6 October 2026. They are generated project illustrations, not third-party stock or human-painted artwork. No external reference images were supplied; each request used a written production brief. The tool did not expose its underlying model identifier, so no model name is inferred.

Exact prompts, source files, hashes, creator/tool, dimensions, runtime bytes, placement anchors, pivots, layer order, mirroring and optimization instructions are recorded in [assets/provenance.json](../assets/provenance.json). Unchanged selected PNG masters are in [assets/source](../assets/source). The lightweight client render index is [src/assets/production.json](../src/assets/production.json); it excludes prompts, creator metadata and source paths. Same-origin runtime WebP derivatives are in [public/assets/laboratory](../public/assets/laboratory).

The provider's [Terms of Use](https://openai.com/policies/terms-of-use/) were reviewed at production time. They describe rights in generated output between the user and OpenAI, and state that outputs may be similar to other users' outputs. These files are not represented as exclusive artwork or assigned an invented Creative Commons license. Applicable account/service terms continue to govern their use; no third-party asset license is claimed.

## Attachment and render contract

Each transparent module has a calibrated normalized placement within the 600 × 720 creature area, a centered pivot, measured derivative dimensions and a stable render order. Body is the base layer; eyes/mouth and chest growths render above it; tails may sit behind. Forelimb modules support left/right mirroring. Positions and sizes are bounded inside the chamber. These are visual metadata, not mutation selection, replacement, dose, combat or attribution rules.

Every mutation has one produced visual module. Additional authored shape variants are not produced in this milestone. The local renderer draws only the public part list; the server catalogue is never imported. The gallery is a development fixture, not a source of authoritative specimens or hidden DNA previews in the player flow.

All 30 modules were inspected together for style, alpha edges, complete anatomy and recognizable appearances. Runtime attachment combinations can be reviewed at `/art-gallery` with `npm run dev`; this entry is removed from the production bundle. The manifest marks only actual produced files ready. Rival creatures were planned at this baseline and are now produced as recorded below; audio, card frame and bundled fonts remain planned. Step 5 specimen-clue production is recorded below.

## Rebuild optimized derivatives

Requires Python 3 and ImageMagick with WebP support. The original masters are retained unchanged.

```sh
python3 scripts/prepare-art.py --from-masters
npm run check
npm run build
```

The script trims transparent margins for creature modules, scales them to at most 640 × 640, strips metadata and writes quality-82 WebP. Chamber derivatives are 1024 × 1536 at quality 82 and 576 × 864 at quality 78. Exact bytes may differ across ImageMagick versions; this session used ImageMagick 6.9.12-98. It also refreshes provenance measurements and the client render index.

For newly selected built-in outputs, `python3 scripts/prepare-art.py /path/to/local-inventory.json` takes an uncommitted inventory with source paths, exact prompts and render metadata. Do not commit machine-specific generator-output paths. Asset production is offline; the game needs no image-generation service, API key or credential.

## Measured payload

At the completed-art baseline, core chamber/blob artwork is 330,460 bytes for desktop and 186,696 bytes for phones. The 34 main runtime artwork files total 2,226,130 bytes; the phone chamber is an additional derivative. Mutation files load only when selected by a composition or local gallery. Source masters total approximately 68 MB and are not deployed.

All production JavaScript chunks together measure 231,771 bytes gzipped at this baseline; the initial interface chunk is about 84 KB gzipped, with the renderer loaded separately. These are file measurements, not observed Cloudflare transfer or a phone frame-rate benchmark. Runtime source/version changes may alter the figures; rerun the build to obtain current measurements.

## Step 5 original specimen clues

On 7 October 2026 the project authored 35 small SVG files in [public/assets/specimens](../public/assets/specimens): 30 distinct opaque clues (`c01`–`c30`) and five base shape-family files. Static serrations, pulses, branches, fuzz and spirals plus text descriptions distinguish the private specimens without exposing DNA names, families, effects or values. The same clue consistently identifies a type through play. Five base files intentionally reuse selected clue drawings; all 30 numbered clue drawings have distinct hashes.

[assets/specimen-provenance.json](../assets/specimen-provenance.json) records creator, exact source path, SHA-256 and bytes. [src/assets/specimen-clues.json](../src/assets/specimen-clues.json) contains only opaque keys, runtime URLs and non-spoiling descriptions. These are original code-authored project drawings, not generated raster art or third-party stock. No invented external license is assigned. No user-supplied asset, new dependency, image service, credential or paid tool was required. All 34 generated raster masters, prompts and attachment metadata remain unchanged.

Reproduce clues with `python3 scripts/prepare-specimens.py`, then run the normal checks/build. The 35 SVG files total **27,126 bytes** before transfer compression; only a player's current tray loads numbered clues. The server maps hidden DNA to these keys; that mapping never ships to the client. All five previously planned clue-family entries now refer to real files/provenance.

Step 5 draws the existing mutation appearance for each accepted type. Repetition enlarges that layer within a 1–1.3 bound; there are no additional authored shape variants. Logical mechanical ownership and produced drawing attachments remain separate. Candle Flesh over a body-owned Brittle Skeleton uses a translucent, ordered layer so both remain visible. The renderer keeps one scene, drops superseded asynchronous compositions and bounds its texture cache at 16; all 30 accepted appearances and the existing gallery are exercised by browser checks. See the implementation status for current bundle measurements and the distinction between headless rendering and physical-device performance.

At the final step 5 build, Node zlib default compression measured all production JavaScript chunks at **235,413 gzip bytes**, including an **86,040-byte** initial interface chunk; Vite reports about 86.87 KB for that chunk under its own compression. Original raster payloads above are unchanged. These remain file measurements, not physical-device transfer or performance acceptance.

## Step 6 rival sprites

Six transparent sprites were produced during development with the built-in `image_gen.imagegen` tool following the local imagegen skill. No image API, key, paid runtime dependency or new hosting service is used. No third-party reference image was supplied. Exact prompts, tool/origin/date, retained PNG master paths and source/runtime SHA-256 are in [assets/rival-provenance.json](../assets/rival-provenance.json); masters are in [assets/source/rivals](../assets/source/rivals). Generated project outputs remain subject to applicable OpenAI terms; no invented external stock license or ownership guarantee is asserted.

Runtime WebP sprites are in [public/assets/rivals](../public/assets/rivals) with the minimal [rival index](../src/assets/rivals.json). ImageMagick trims transparent margins, fits within 640×640, strips metadata and writes quality-82 WebP; combined runtime bytes are **382,750**. All six derivatives retain an alpha channel. Full-creature rivals use a bottom-center attachment for arena placement; they are not injected anatomy modules. Rebuild from retained masters with `python3 scripts/prepare-rivals.py`. This refreshes measured dimensions/hashes/bytes and the index without regenerating an image.

The new sprites were inspected together for coherent silhouettes, muted flesh/brass palette, lighting, full-body edges and distinction between archetypes, then in the actual combat renderer. Existing 34 creature/chamber records and the definitive mutation proportions/colors were preserved. Only selected rival art loads for a room. The Vite-only `/combat-gallery` uses deterministic authoritative timelines; see [STEP-6-REVIEW.md](STEP-6-REVIEW.md) for actual browser screenshots/contact sheet and remaining physical-device gaps.

## Battle v2 Phase A assets

The development sample has eleven distinct body sprites (five roles each for family 1/Iron Widow plus a dedicated family-1 bite variant), one arena, one panel, a growth derivative, eight supplied SVG derivatives and fourteen balanced AAC sound derivatives. The requested New Rocker Google font is bundled unchanged under its retained SIL OFL license. Files live in `assets/battle-v2`, outside the production public directory. Exact prompts, source/runtime hashes, pivots and pose registration, user-input records, sound analysis and current readiness are linked in [BATTLE-V2-REVIEW.md](BATTLE-V2-REVIEW.md). Supplied art/audio creation tools and original licensing were not specified; records say so instead of inventing origin. The prior procedural sounds, formulas and first review remain archived. Non-tint overlays are review samples, with textured anatomical grafts selected as the next direction. Production audio remains planned until Phase C; no experiment/rival master or definitive reference changed. Remaining body sets/effects/damage registration remain planned.

## Battle v2 Phase B assets (13 October 2026)

The Phase A paragraph above is historical inventory. The current development library has **twelve five-role bodies plus one dedicated bite variant**, **three arenas**, the existing instrument panel, **eight textured graft/fragment parts**, **twenty event presentations** and **twenty-six sounds**. Production assets remain unchanged; this media is DEV-only and excluded from builds.

[phase-b-generation.json](../assets/battle-v2/phase-b-generation.json) records exact built-in imagegen prompts, identity references, thirteen selected untouched originals, three rejected style candidates and reasons, tool/date/terms and SHA-256. [phase-b-derivatives.json](../assets/battle-v2/phase-b-derivatives.json) records crop boundaries, uniform within-set scaling, runtime hashes/bytes and pose registration. The extraction uses actual connected figure bounds to locate gutters; a naive equal grid was rejected after clipping neighboring poses. [phase-b-registration.json](../assets/battle-v2/phase-b-registration.json) is the authored coordinate source. Surface grafts clip to pose-local torso/silhouette; the shoulder graft uses its own root/iris. Original generated sources and user-supplied Phase A media remain preserved. Historical overlay hashes refer to commit `257b225`; current render-source hashes are in [phase-b-inventory.json](../assets/battle-v2/phase-b-inventory.json).

Twelve new sound cues are honest project-authored deterministic procedural effects, with retained WAVs, exact recipes/seeds/script hash, optimized mono AAC files and decoded peak/mean analysis in [phase-b-audio-provenance.json](../assets/battle-v2/phase-b-audio-provenance.json). They add **55,479 bytes**; all twenty-six compressed cues total **286,205 bytes**. Existing supplied SVGs/audio, New Rocker/OFL records and the four approved gain adjustments remain unchanged. Reusable vector effects and damage masks are original project components; their exact source hashes are in the generated inventory. No runtime generator, new paid service, key or hosting requirement is introduced.

Run `npm run prepare:battle-v2` to reproduce derivatives/fixtures from retained sources using installed ImageMagick/FFmpeg/Python, without regenerating imagery. Run `npm run test:battle-v2-phase-b` then `npm run review:battle-v2` to reproduce current contact sheets/recording. See [Phase B review](BATTLE-V2-PHASE-B-REVIEW.md) for actual checks, measured selected-pair budgets and human art/audio/device acceptance gaps. Development readiness is not a claim of final physical-device acceptance or production rollout.

## Phase B supplied refinement (14 October 2026)

Current [refinement review](BATTLE-V2-REFINEMENT-2026-10-14.md) supersedes Phase B procedural added audio and drawn damage/effect treatments. Ten supplied WAV masters are unchanged in `assets/battle-v2/source/user-review/phase-b`; original supplier authorship/licensing is unspecified and no creation prompt/tool is invented. `assets/battle-v2/phase-b-audio-provenance.json` records submission/original/runtime hashes, levels, gain/fades/AAC processing and decoded output. Prior deterministic procedural masters, original script and ledger are retained under the phase-B source audio history; prior derivatives are superseded. Recover/shards are excluded from current cue loading.

The supplied electric SVG is preserved under `assets/battle-v2/source/user-review/electric.svg` with submitted path/date and safe derivative/hash registration in `assets/battle-v2/effect-provenance.json`. Creature masters remain untouched; rival derivatives isolate their actual whole-sheet figure components before cropping, and registered landmarks are rebased through source coordinates. `phase-b-derivatives.json` records cleanup/components/crops/scale/registration; `phase-b-inventory.json` measures current media. Damage/fragment parts and registration remain archival reference metadata, outside creature/effect rendering and preload. Current review evidence is separate from the historical 13 October directory.

## Approved family/blob redesign (14 October 2026)

The latest [family refinement review](BATTLE-V2-FAMILY-REFINEMENT.md) supersedes the old Family 1 talons and Family 3 weighted tail in the integrated development library. Experimental mutation assets remain unchanged. Two versioned transparent built-in imagegen masters live in `assets/battle-v2/source/family-refinement`; `family-refinement-generation.json` records exact edit prompts/references, tool/date/origin and hashes, with historical masters preserved. `family-refinement-registration.json` and `scripts/battle_v2_family_art.py` define actual per-pose grounded/torso/eye/shoulder registration and component-isolated uniform extraction. Core and Phase B derivative ledgers record helper/registration/source/runtime hashes. Human acceptance and production Phase C readiness are distinct from verified development rendering.
