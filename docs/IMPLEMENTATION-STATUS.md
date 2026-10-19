# Monstrum Mortis — implementation status

**Release accepted; Phase D complete — 17 October 2026 UTC (16 October EDT).** Steps 1–6 and Battle v2 Phases A–D are complete for the approved game scope. The user accepted physical-device/network/accessibility/performance testing, reported all final Node 24 commands passed and supplied Cloudflare quota/log evidence. Final housekeeping consolidated those records; the later authorized branding publication is recorded below without changing gameplay. [Completed acceptance and exact candidate identity](BATTLE-V2-PHASE-D-ACCEPTANCE.md).

## Current release

- Deployed at https://monstrum-mortis.scott-jeffrey-miller.workers.dev; latest Worker version **d84f5d81-2c2b-4b95-9282-68079106df4b** includes the authorized 19 October entry-branding follow-up. The Phase D acceptance baseline remains **f4813c32-185e-4a6a-b74a-1a508c76aadc**, implementation source **97f0cb34d861aef585fb6d84b0f90364f72c22df**, with its original evidence preserved.
- Room JSON **7**, protocol **6**, rules **0.6.0**; DNA **0.2.0**, combat **0.3.0**, presentation **battle-v2-b2**.
- Public named laboratories start with 2–8 players, majority Start now, full 75-second experiments, server-authoritative DNA/integration/battle, three rounds, team scoring/personal awards and voluntary replay. A remaining scientist may finish; explicit Leave is irrevocable for that guest/lab. Private codes/hosts/queue/backfill/displays are retired.
- Accepted compact UI, real specimen illustrations, registered modular/integrated creatures, bounded effects/audio, reduced motion/fallback, touch scrolling, fitted desktop battles and remembered editable player names are implemented. Saved monsters/cards/cabinet are cancelled.
- Cloudflare Free, three existing SQLite Durable Object identities/bindings and workers.dev-only routing remain intact. Self-hosted scottjmiller.com/www is unchanged.

## Verification at closure

| Evidence | Actual result / scope |
| --- | --- |
| Final Node 24 regression | User reported `test:phase-d-local`, `test:composition`, `simulate:combat`, `test:audio-lettering` and `test:viewport-scroll` all passed. This is distinct from older agent-run checks; no unprovided final counts are invented. |
| Human acceptance | User marked items 1–4 complete: iPhone/iPad Safari and Linux Chrome fixes; three-round multiplayer/timing/solo continuation; interruption/recovery; accessibility/performance. No agent physical-device run or numerical hardware benchmark is claimed. |
| Deployed identity | [Publication evidence](battle-v2-phase-d-review/player-name/deployed-evidence.json) and later live logs identify the accepted version. [Final offline inventory](battle-v2-phase-d-review/assets.json): 249 files / **9,755,974 bytes**, main JS **353,662 bytes**, CSS **45,754 bytes**. Whole library size is not initial download or retained GPU memory. |
| Cloudflare account reports | Supplied 30-day namespace reports and October 17 one-day account summary show low observed usage relative to Free allowances. Detailed windows/totals are in acceptance; no production capacity/load claim follows. |
| Deployed diagnostics | [One 120-record live capture](battle-v2-phase-d-review/log-review/README.md): zero exceptions/resource exhaustion, 101 ok / 17 canceled / two disconnected streams, no confirmed gameplay defect. Historical eight-count discrepancy and exact cancellation causes remain unresolved. |
| Housekeeping | `npm run check`, `npm run build`, separate in-process **232 unit tests**, production asset/hash guards, JSON/link checks and `git diff --check` passed on Node 24.21.0. Rebuilt output matches the retained final fingerprint. Closed guidance archived; existing browser artifacts/logging preserved. No deployment or application-source changes. |

## Evidence and history

[Acceptance record](BATTLE-V2-PHASE-D-ACCEPTANCE.md) is the current completion ledger. [Archived implementation diary](archive/release-closeout-2026-10-17/IMPLEMENTATION-STATUS.md) retains all dated checks, deployments, initial failures and corrections; [archive index](archive/README.md) links earlier steps/A/B/C and the pre-simplification contract. Historical statements about pending testing describe their original dates and are superseded for completion tracking by the accepted release.

Current review paths remain stable for reproducible tools: [simplification browser evidence](battle-v2-phase-d-review/simplification/browser-evidence.json), [contact sheet](battle-v2-phase-d-review/simplification/contact-sheet.png), [sound capture](battle-v2-phase-d-review/simplification/sound-unlock.webm), [audio/lettering](battle-v2-phase-d-review/audio-lettering-fix/README.md), [swipes/viewport](battle-v2-phase-d-review/viewport-scroll-fix/README.md) and [remembered name](battle-v2-phase-d-review/player-name/production-flow/browser-evidence.json). Live masters, provenance and definitive anatomical references stay in place.

## Remaining operational limits

No blocking defect was confirmed in the supplied release evidence. Continue ordinary monitoring; investigate reproducible failures with timestamp/version and sanitized logs. The historical aggregate error discrepancy remains a reporting limit. No sustained production load test, exhaustive device matrix or quantified capacity guarantee exists. Health still publishes `fullReleaseAvailable: false`; documentation acceptance does not alter that runtime flag. Future features, infrastructure changes and deployment require their own user instruction; no next feature milestone is implicitly authorized.

## Entry branding follow-up — 19 October 2026 (deployed)

The user authorized three small presentation edits: browser title **Monstrum Mortis**, a bold **For 2–8 players** line beneath **Find a laboratory**, and a transparent circular starter-blob face favicon. PNG/ICO variants and an Apple touch icon are linked from the document head. [Favicon prompt, source and provenance](../assets/favicon/provenance.json) are retained with a reproducible derivative script. No gameplay, Worker behavior, bindings, versions or routing changed. The user explicitly authorized publication after local review. The earlier Phase D acceptance remains the historical gameplay/device baseline.

Actual local checks: `npm run check`, `npm run build`, separate in-process **232 unit tests**, production asset hash/exclusion guards and `git diff --check` passed. Focused Chromium review of the built client passed at 1280px, 390px and 320px widths: exact title, visible player-count text without overlap/horizontal overflow, correct PNG/ICO/touch-icon responses and transparent PNG corners. The static preview used mocked guest/directory responses, so this is layout/asset evidence, not multiplayer or physical Safari verification. Actual small-icon and entry screenshots were inspected; the broader runtime/browser suites were not repeated for these presentation-only changes.

Deployment: `npm run deploy` passed configuration/types, **232 tests**, production build and publication as **d84f5d81-2c2b-4b95-9282-68079106df4b** to the same workers.dev URL, with all three SQLite class bindings and ASSETS unchanged. [Seven-request deployed verification](branding-review-2026-10-19/deployed-evidence.json) passed: exact HTML/title, served main bundle (including player-count text), CSS, PNG/ICO/Apple touch-icon hashes and unchanged health. This is bounded HTTP/bundle verification, not a repeated multiplayer or physical-device test. No self-hosted domain, plan or routing change was made.
