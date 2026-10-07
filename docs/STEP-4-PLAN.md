# Step 4 proposal: laboratory, creature assets and accessible presentation

Status: **approved on 6 October 2026; user-confirmed complete, pushed, deployed and presentation reviewed on 7 October 2026**. This document preserves the historical step 4 scope/proposal. Current authorization is step 5 only, under the subsequently approved [STEP-5-PLAN.md](STEP-5-PLAN.md). No new deployment is authorized.

## Scope and protected behavior

Deliver the coherent laboratory artwork, animated starter blob, modular creature art and renderer, responsive controller/display screens, accessibility settings and reliable presentation of the existing service states. Preserve private code/link entry, public Quick Play, readiness, replacement consent, display permissions, reconnect, previous-session recovery and all existing regression fixes.

No step 5 DNA dealing, injections, dose accounting, cooldown, mutation selection/replacement rules or switches; no step 6 rivals/combat implementation, battle playback or awards. Producing mutation artwork and exercising synthetic compositions are art/renderer work, not gameplay. Rival production, audio integration, tarot export and the cabinet remain their later milestones. No server rules, protocol, schema, Durable Object identities or Cloudflare routing changes are planned. Hosting remains Cloudflare Free with SQLite-backed Durable Objects and workers.dev only; scottjmiller.com and www remain untouched.

## Visual direction

Build a decayed Frankenstein-era laboratory: corroded riveted iron, tarnished brass, cracked ceramic insulators, stained tubing, cloudy containment glass, damp stone, accession tags and restrained occult engravings. The palette follows the approved plan: near-black, dirty ivory, oxidized copper, diseased green, bruised violet and small blood-red accents. Illuminated flesh and glass supply the focal light; controls remain readable against quieter surfaces.

The horror comes from old machinery sustaining something incomprehensible. Comedy comes from expressive anatomy: disturbingly earnest eyes, excessive smiles, kitten paws attached to an unsuitable torso and an organ appearing to contemplate its employment. Keep silhouettes and expressions readable rather than relying on realistic gore. Use occasional dry institutional copy, without covering vital instructions or obscuring failures with jokes.

The containment chamber is the main composition, not a background behind dashboard cards. A heavy frame, separate rear/foreground machinery, glass treatment and fluid layers surround a clear creature area. Decorative inscriptions contain no invented functional readings. Text, labels, gauges and controls are authored in code rather than baked into illustrations. Start with system serif display typography and readable system interface typography; any later bundled font needs explicit provenance and licensing.

## Chamber and starter blob

Produce a finished chamber art set and an original, transparent, expressive blob with separable body, eyes and mouth. Animate breathing, a restrained wobble, occasional blinks and small fluid/tubing movement through the renderer. Keep glass effects subtle enough to read the anatomy. Avoid intense flashes, camera shake and constant large movement.

The chamber remains prominent during entry, queueing and room participation, with pending controls and recovery messages above decorative layers. Once in a laboratory, roster and the actual server phase/deadline accompany it. Decorative movement must never imply a successful entry, injection, synchronized mutation or completed battle.

The current service sends `creature: null` and has no DNA producer. In this milestone the idle blob is an explicitly atmospheric starter preview, labelled as awaiting specimen initialization, and the interface continues to explain that DNA and combat are unavailable. Do not populate authoritative room state with fabricated creatures, doses or outcomes. When future public CreatureView data is available, the same renderer can draw that composition. Showcase mutations only in an isolated local development/test gallery, excluded from the shipped player flow.

## Modular creature art and renderer

Use the existing nine BodySlot values: body, eyes, mouth, left/right forelimbs, lower limbs, skin, head growth and appendages. Produce a coverage sheet for all 30 planned mutation visuals, then actual transparent modules/variants for those appearances. A shared part may support several appearances only when its visible variants communicate each intended transformation. No manifest entry becomes ready solely because a generic part exists.

Each asset records source dimensions, normalized attachment anchor, pivot, slot compatibility, front/back order, mirroring support, visible bounds and any mask/overlay behavior. Match perspective, lighting, flesh treatment and resolution across the library. Test elongated limbs, oversized heads, stacked growths and small comic appendages against both the chamber frame and phone silhouette. Keep high-resolution transparent masters for the future 1080 × 1800 card renderer; card production/export is not part of this step.

Follow the approved proposed stack: React for semantic controls and a client-only PixiJS scene for layered raster rendering. Pin its selected version in the committed npm lockfile after approval. Use a fixed scene coordinate system scaled to the chamber viewport, with local anchors and deterministic layer ordering. PixiJS supports the application/ticker/resize lifecycle and asset bundles/background loading described in its [application guide](https://pixijs.com/8.x/guides/components/application) and [asset guide](https://pixijs.com/8.x/guides/components/assets). Choose a conservative WebGL configuration and provide a static composition from the same real asset layers if graphics initialization fails.

The scene accepts only client-safe public CreatureView parts and local render metadata. It does not import the server catalogue, deduce hidden mutations, decide replacement/stacking rules or alter stats. Public asset IDs select artwork only. Stable poses and a compositing adapter prepare for later export without implementing it. Synthetic composition tests cover attachment/order/scale behavior and combinations; they do not exercise injection mechanics.

Keep scene state separate from transport state. Resize, reduced-motion changes, asset retries and renderer recreation must not remount session ownership or sockets. On reconnect, render the newest authoritative snapshot without replaying a fictitious mutation history. Handle missing assets with a visible artwork failure/retry notice and retain entry, connection and recovery controls.

## Responsive presentation

| Device/role | Proposed composition | Controls and feedback |
| --- | --- | --- |
| Desktop controller | Chamber about two-thirds of the main view; compact control/roster column beside it | Entry, queue/ready or room actions in a consistent panel; phase and connection status close to the creature |
| Portrait phone | Dominant upper chamber with a compact panel below; landscape adapts without shrinking the creature into a thumbnail | Primary action within comfortable reach; safe-area spacing; forms, errors and recovery usable with the keyboard open |
| Tablet/narrow desktop | Fluid transition between stacked and side-by-side compositions | No clipped roster, obstructed actions or horizontal page scrolling |
| Display-only browser/TV | Enlarged chamber, larger phase/roster labels, minimal shared status | Clearly labelled viewing role; no player seat, private tray, readiness or host controls; retain legitimate display reconnect/exit actions |

Exercise 320-pixel portrait widths, common phone/tablet sizes, wide desktop and 16:9 display layouts, orientation changes and 200% browser zoom. Use a resizable scene viewport and a bounded silhouette rather than one fixed desktop image cropped on phones. Every player retains a complete view; the TV remains optional. Reserve sensible space for the future private tray, but do not ship working-looking DNA controls before their mechanics exist.

## Entry, queue, readiness, connection and recovery

- Entry: distinguish Quick Play, Create Private Laboratory, Join by Code/Link and shared display. Keep name-required validation clear, invitation hints visible and pending requests labelled. Preserve consumed-link cleanup, successful entry-key retirement and failed-request retry keys.
- Matchmaking: show the selected pool, search state, elapsed wait, actual ready-check countdown, cancellation and the existing alternatives. Never invent queue population or an estimated match time. Pool changes and inactive resumption remain explicit user actions.
- Readiness/admission: distinguish Ready required, confirmation sent/accepted, awaiting others and entering the laboratory. Keep a readiness deadline legible and show expired/cancelled outcomes clearly. Preserve late fresh-cohort admission during the real briefing window.
- Replacement: retain explicit Fill Existing Laboratory consent and its round, score and recovery/vacancy context. Do not silently convert a fresh queue request into a replacement request.
- Connection: distinguish connected, connecting/reconnecting, offline and rejected/replaced states using text plus a visual cue. Roster presence and phase timers reflect server state. Any local countdown displayed while offline is labelled as awaiting synchronization; it cannot imply a local phase transition.
- Recovery: keep Check previous session and explicit Leave previous laboratory/Cancel previous queue visible when relevant. Explain lost credentials, stale tickets, another active connection and retryable failures in plain language. Preserve guest identity, claim-nonce fencing and explicit connection replacement; do not auto-release a session or auto-queue after recovery.
- Separate artwork loading/failure from service connectivity. A failed image must not be presented as a failed room connection, and an art retry must not repeat a room admission request.

## Accessibility and motion settings

Target WCAG 2.2 AA for the controller interface, with keyboard-operable semantic forms/buttons, persistent visible focus, associated labels, concise errors and logical focus restoration when entry/recovery views change. Use at least 44 CSS-pixel touch targets as required by the approved plan. Target 4.5:1 contrast for ordinary text and 3:1 for large text and essential control boundaries; verify the real palette rather than assuming dark backgrounds suffice.

Keep essential status available as text and icon/shape, not color or animation alone. Give the rendered creature a concise accessible description; hide decorative machinery from assistive technology. Use polite live announcements for meaningful queue, readiness, phase and connection changes; avoid announcing countdown ticks continuously. Screen readers must be able to reach readiness and recovery controls even while the canvas is loading.

Honor prefers-reduced-motion on first use and provide a persisted override plus a pause for decorative animation. Reduced motion uses a stable blob pose, static fluid and immediate/subtle state changes. No intense flashing is introduced. Settings/storage failures cannot block service participation. Audio remains a later milestone, so no user needs sound to interpret this interface.

## Asset production, tools and provenance

Use the built-in image generation/editing tool through the [imagegen skill](/home/scottjmiller/.codex/skills/.system/imagegen/SKILL.md) for detailed laboratory illustration and transparent creature art. Create a canonical chamber/blob reference, then derive individual parts against that reference with consistent perspective, lighting and attachment constraints. Use one request per distinct asset/variant; inspect each result and iterate when it fails those constraints. No generation occurs until this plan is approved.

Author layout, gauges, simple icons, labels and animations in React/CSS/PixiJS. Use available local image tooling to inspect alpha, crop/scale consistently and create optimized runtime derivatives; verify the exporter is available before relying on it. Keep selected high-resolution masters and reproducible optimization instructions, not discarded generation attempts or machine-specific paths. Copy project assets into the repository; never reference an image that exists only in the generation tool's output directory.

Add an asset provenance ledger containing asset ID, final/source paths, original/generated/licensed classification, creator/tool, production date, exact generation prompt and references where applicable, edits, dimensions, anchors and applicable license/terms with source links. Verify usage terms at production time; do not invent an open-source license or claim generated images are exclusive. Avoid unlicensed third-party references. Update manifest readiness only after real files, provenance, attachment data and render checks exist. Leave deferred rivals, audio, fonts and card assets planned.

No user-supplied assets are required if this generated/original route is approved. Optional contributions are an existing logo, owned/licensed visual references, preferred lettering or hand-painted creature parts. Supplied third-party assets need their source/license and usable original files. No credential or API key needs to be pasted into chat; the built-in workflow adds no runtime AI service or paid Cloudflare dependency. If generation is unavailable, report that limitation and agree on an alternative art source rather than substituting placeholders and marking them finished.

## Loading and performance

Keep all runtime assets on the same origin. Publish optimized alpha-preserving image derivatives at appropriate phone/desktop resolutions with source masters retained for future export. Load the entry shell and connection controls first, then the core chamber/blob; load mutation bundles only when a composition or local gallery needs them. Show an explicit loading state and retry action on failure. An asset promise must never gate a readiness response or socket reconnection.

Initial targets are no more than 1 MB transferred for critical chamber/blob art and 250 KB compressed initial JavaScript, subject to measurement after the art and renderer exist. Report actual bytes and any target miss; these are proposed budgets, not current results. Bound decoded texture dimensions and pixel density, unload unused texture bundles, pause rendering in hidden/offscreen scenes, and avoid costly full-screen blur/particle effects. Aim for a smooth 30 fps on a representative phone and 60 fps on desktop where supported, with a static/reduced-effects route for slower devices. Measure rather than claim either target is achieved.

## Implementation order and completion evidence

After approval:

1. Establish the art specification, nine-slot anchor contract and 30-mutation coverage sheet; produce the finished chamber and starter blob first. Share a local preview so the direction can be assessed early.
2. Produce/calibrate the modular layer library, provenance ledger and runtime derivatives; exercise representative and extreme synthetic compositions in the local gallery.
3. Integrate the scene and responsive React presentation around the existing entry, queue, room and recovery lifecycle, retaining display isolation and gameplay-unavailable messaging.
4. Add motion/accessibility settings, art-loading recovery and graphics fallback; measure payload, texture memory and rendering on available devices.
5. Run `npm run check`, `npm run build`, `git diff --check`, and the existing `test:rooms`, `test:matchmaking`, `test:recovery` and `test:fresh-admission` local runtime suites. Add focused checks for new renderer/motion/loading behavior where meaningful, and preserve entry/retry/recovery regressions when reorganizing components. Runtime suites include the Worker dry run and do not publish it.
6. Exercise the actual interface with independent clients: private create/join/leave/rejoin/recreate, Quick Play ready/cancel/admit, delayed fresh connection, display entry, reload, disconnect/reconnect, stale tickets and lost-credential recovery. Check keyboard/focus, reduced motion, slow/failed asset loads, zoom and responsive sizes. Report which browsers/devices were available and which human checks remain; do not equate component doubles or synthetic screenshots with a physical-device playtest.
7. Update implementation status with actual checks, produced versus deferred assets, measured budgets and remaining limits. Hand back the local, reviewable step 4 result. Wait for a separate deployment instruction and separate authorization for steps 5 and later.

## Verification of this planning update

Before these documentation changes, the working tree was clean. With Node 24.21.0, `npm run check` passed configuration validation, both TypeScript projects and all five test files; `npm run build` passed. The existing build reported 75.59 kB gzipped JavaScript and 0.58 kB gzipped CSS. No assets, renderer, presentation code, dependencies or deployment were produced in this planning session. New visual quality, accessibility, loading performance and independent-client behavior therefore remain to be verified after plan approval and implementation.
