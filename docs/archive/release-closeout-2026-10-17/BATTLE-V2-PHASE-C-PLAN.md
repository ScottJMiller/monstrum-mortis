# Battle v2 Phase C implementation plan

> Historical record archived at release closeout (17 October 2026 UTC). Instructions, open items and candidate descriptions below describe their dated scope. Current [rules](../../APPROVED-PLAN.md), [status](../../IMPLEMENTATION-STATUS.md) and [completed acceptance](../../BATTLE-V2-PHASE-D-ACCEPTANCE.md) supersede them.

**Historical accepted baseline:** This document records Phase C/pre-simplification implementation and dated checks. Conflicting UI/admission/credential/timer guidance is superseded by the approved [16 October simplification](PHASE-D-SIMPLIFICATION-PROPOSAL.md). Current publication and evidence are in [status](../../IMPLEMENTATION-STATUS.md).

Authorized 14 October 2026: “Phase B is complete, proceed with Phase C.” The accepted [canonical specification](../../BATTLE-V2-SPEC.md) and refinements remain the design contract. Phase B user acceptance is confirmed; dated local checks remain evidence of what actually ran. No second planning approval is required. Deployment remains separately gated.

## Implementation decisions

1. Store the immutable integrated form and server-chosen arena in the room's release transaction, after the frozen surviving DNA is established and before any broadcast. Reuse the single pure selector/registry and unbiased server entropy; never couple presentation entropy to combat generation. Retain vote counts privately, publish only the safe chosen descriptor/modifiers/integration interval/arena. No stats, source anatomy, attribution or outcome changes.
2. Migrate JSON room schema 5 to 6 with legacy current attempts explicitly lacking v2 presentation. New attempts opt in at start; legacy frozen/released battles never reroll or gain retroactive presentation. Validate stored descriptors against frozen survivors without consuming entropy. Unknown/corrupt versions fail closed. New snapshot fields are additive/optional, so protocol 5/credential and pending-action recovery remain compatible; test this instead of assuming it. Gameplay defaults stay fixed; the new-entry pool default warrants rules 0.4.0 with older experiment rules accepted explicitly.
3. Reuse the accepted Stage/Sprite, sole effect registry, bounded loader and sound engine in normal release/battle UI. Shared timeline seeking drives motion and audio. Reconnection, hidden tabs and delayed frames suppress old cue playback; loading never pauses authoritative time. Maintain the legacy playback path for migrated attempts.
4. Theme and compact normal entry, matchmaking, briefing, experiment, readiness/recovery, release/battle, results and replay. Keep the dominant chamber and semantic controls, keyboard/touch targets, captions, reduced motion and graphics/audio fallback. Add device-local sound controls. Keep gallery controls/fixtures/development globals out of production.
5. Remove new region/Same-Room/display entry UI. New queue entries use Americas; old tickets/operation retries in other pools retain resume/cancel/admission/recovery. Enforce the new-entry default on the server without moving old claims. Legacy display credentials remain viewing-only with safe reconnect/leave. Existing backend same-room/display compatibility contracts are retained for legacy clients.
6. Ship only referenced approved runtime art/audio/font derivatives via an explicit build asset step; source masters/provenance/debug galleries remain outside the production build. Update the build guard to assert required production media and exclude fixtures/debug code, rather than falsely asserting all v2 content stays out.

## Verification and delivery checklist

- [x] Pure descriptor validation, survivor/tie/modifier invariants, new-release selection and immutable persistence; legacy schema/attempt/version compatibility and private audit data.
- [x] Real independent-client release races, duplicate actions, timer/grace boundaries, hibernation/full runtime restart, late admission, legacy display authorization and old-region queue recovery.
- [x] Real production browser controls for private/public entry, injections, five-second integration, battle/audio, countdown/results and three-round/replay flow; desktop/phone portrait/landscape, reduced motion, keyboard/WCAG, loading failures, seeking/reconnect and lifecycle bounds.
- [x] Relevant room/matchmaking/recovery/fresh admission/DNA/combat/art/composition/development preview regressions, check/build, production media guard and Worker dry run. Record actual outputs; physical devices/listening/latency/quota remain Phase D evidence.
- [x] Inspect actual production screenshots/motion/audio and publish local review instructions/evidence, asset/bundle bounds and remaining limits.
- [x] Reconcile canonical guidance/current summaries and checklists. At step 6/A/B/C implementation completion consolidate and archive superseded dated documents/evidence with preserved provenance and repaired links/tooling. Retain current implementation source and masters referenced by live provenance. Never manufacture historical checks.

Phase C ends with reviewable production integration, not deployment or blanket device/performance acceptance. Phase D remains human/device/browser/sound/pacing/network/quota review. Saved monsters, tarot cards and cabinet are cancelled; naming/signals are outside this work.

## Completion record

Phase C implementation is complete locally for review. Existing local server/browser suites and the newly scoped persistence/production browser checks are listed individually in [status](../../IMPLEMENTATION-STATUS.md), with [actual screenshots/recording](BATTLE-V2-PHASE-C-REVIEW.md). Closed milestones/evidence have been archived under the user's completion-cleanup instruction; current docs and live provenance remain accessible. Phase D human/device/browser/performance/network acceptance and deployment remain separate, not inferred from these checks.


## Approved predeployment refinement — 15 October 2026

The subsequent [approved scope](PREDEPLOY-REFINEMENT.md) extends this completed integration with frames/fonts/splash/specimen art/copy/leave refinements and a separate one-second switch delay in rules 0.5.0. This supersedes the earlier fixed-switch-cooldown premise for fresh attempts only. Historical Phase C checks remain separately dated; new checks and screenshots are recorded with the refinement. No deployment.

## Phase boundary — 15 October 2026

The user indicated readiness for Phase D after the approved refinements. [Current acceptance checklist](../../BATTLE-V2-PHASE-D-ACCEPTANCE.md) and [new evidence ledger](../../battle-v2-phase-d-review/README.md) now track the active work. This plan remains the completed implementation record; its checks are not retroactive physical-device/network/quota acceptance. No deployment.
