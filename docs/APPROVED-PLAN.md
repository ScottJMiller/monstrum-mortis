# Monstrum Mortis — approved plan

**Accepted release — Phase D complete, 17 October 2026 UTC (16 October EDT).** Steps 1–6 and Battle v2 A–D are complete for the approved scope. [Status](IMPLEMENTATION-STATUS.md) and [completed acceptance](BATTLE-V2-PHASE-D-ACCEPTANCE.md) distinguish user-tested devices, reported final Node 24 checks, deployed evidence and remaining operational limits. The [approved simplification/PDF inventory](archive/release-closeout-2026-10-17/PHASE-D-SIMPLIFICATION-PROPOSAL.md) is retained as history. No next feature phase or new deployment is authorized by closeout.

Monstrum Mortis is a cooperative browser creature-building game. A new public laboratory starts with 2–8 scientists on their own devices. They mutate one shared blob, unleash it into automatic authored-rival combat, and complete three rounds for a team score and personal awards. Sinister decayed machinery, eldritch anatomy and comic mutations remain the visual direction.

## Entry and session

- A 15-second splash includes its final 3/2/1 and can be skipped immediately. Reconnection bypasses it. Sound defaults on but starts only after a real gesture; saved mute/volume wins.
- Browse named public forming labs or create one. The server supplies a default player alias and symbol. The player’s edited name is remembered on that browser/device, remains editable and survives leaving a lab or returning later; clearing browser storage removes it. Lab/creature names are persisted server-authored labels, never credentials.
- One connected scientist waits. At two, a 30-second formation begins. Strict majority of current connected members choosing Start now, or eight connected members, shortens the deadline to at most three seconds. New admission closes during that final countdown; the deadline never extends. Fewer than two before the first experiment reopens formation.
- There are no private codes/invitations, hosts, new spectator/display seats, regional selection, ready queue or later-round backfill. Friends choose the same public row/name.
- Every experiment starts with a fresh creature and the full 75-second clock. First formation includes the rival briefing rather than an extra automatic first-cohort gate. Later rounds start from the results gate.
- Explicit Leave prevents that authenticated guest rejoining the same lab, including with a new request ID. It may join another lab. Reload/network interruption reconnects the same seat without fresh doses. Resetting browser identity cannot be a human ban without accounts.
- One remaining scientist can finish all remaining rounds. Current N and accepted contributions stay fixed; later solo rounds scale by 2/max(2,N), with six doses and no bonus. No fresh solo game or solo replay. At zero connected participants after grace, close.
- Autopsy lasts 25 seconds; all active participants ready after a 10-second minimum advance sooner. Three-round results allow voluntary replay with at least two opt-ins; never a fourth round or involuntary new session.

## DNA, release and battle

Four private specimens, six injections per player per round, six-second personal injection cooldown and independent one-second Unleash delay remain. Select a specimen and Inject; accepted actions consume exactly one dose, replace the vial and mutate shared anatomy. The first/replacement vial is highlighted automatically; injections are always explicit. Cosmetic mutations use doses without hidden bonuses.

All 30 approved identities, targets, effects, stacking/diminishing returns/caps, liabilities, replacement semantics, attribution and battle calibration remain in the server catalogues. Replaced parts lose their associated mechanics but remain in history. Normal scaling stays 2/N, fixed at experiment start; solo continuation uses the floor described above. Specimen clues expose appearance, not hidden outcomes.

Unleash needs at least one accepted injection and its one-second wait. It permanently ends that player's injections and forfeits unused doses. Six doses never auto-switch. Unanimous eligible completion or 75-second expiry freezes one creature and starts exactly five seconds of integration. The authoritative combat producer, three authored rivals, outcomes, team scoring and personal awards remain unchanged.

[Battle v2 specification](BATTLE-V2-SPEC.md) continues to govern persisted presentation, uniform family selection, registered poses/modifiers/effects, lettering and audio. Experimental modular anatomy remains. The sole executable family mapping is src/shared/integrated-form.ts; the sole presentation effect registry is src/client/battle-v2/effects.ts.

## Presentation and infrastructure

The [PDF-based approved layout](archive/release-closeout-2026-10-17/PHASE-D-SIMPLIFICATION-PROPOSAL.md) applies on desktop as well as phones: prominent cropped chamber/readings left, scrolling private DNA rail and nearby actions right, compact accomplices below. No image reservoirs or routine diagnostic prose. Mutation captions are brief with optional history. Integration/battle fills the phone/tablet app viewport and desktop content width. Reports initially show top facts; details collapse and Next experiment remains visible.

Retain gothic frames and New Rocker/PT Serif/Cabin fonts, reduced motion, keyboard/screen-reader support, graphics fallback, sound controls and bounded loading. Preserve Cloudflare Workers Free, SQLite class/binding identities and workers.dev-only routing. Never alter scottjmiller.com/www.

Saved monsters, tarot cards, cabinet, accounts, free-text chat, human-lab PvP and runtime generation are outside scope/cancelled. The implementation baseline before this approved contract is [archived](archive/pre-simplification-2026-10-16/APPROVED-PLAN.md); older phases/checks remain historical, not current acceptance.
