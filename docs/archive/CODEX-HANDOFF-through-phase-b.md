# Continue in VS Code with Codex

> Archived historical record. Current execution and evidence are in [implementation status](../IMPLEMENTATION-STATUS.md). Original dated checks retain their scope; this file does not authorize work.

Current authorization (14 October 2026): the user confirmed **Phase B complete** and authorized **Phase C** production integration. [Phase C plan](../BATTLE-V2-PHASE-C-PLAN.md) governs current execution; earlier Phase B-only/Phase C-unauthorized notes below are historical. Preserve every gameplay mechanic, legacy recovery/permissions, Workers Free identities and self-hosted domains. No deployment or cancelled card/cabinet work.

Completion tracking: [Phase B completion checklist](battle-v2/BATTLE-V2-PHASE-B-PLAN.md#phase-b-completion-checklist) and [Phase C look-ahead](battle-v2/BATTLE-V2-PHASE-B-PLAN.md#phase-c-look-ahead-completion-checklist) separate development readiness, human acceptance and future production work. Phase C/deployment remain unauthorized.

Current change (14 October 2026): saved monsters, tarot cards and the local cabinet are removed from the product plan, rather than deferred. Historical mentions retain their original dates/scope. Phase C includes production UI/UX; development contact sheets are references, not final production screens. After step 6 and Battle v2 A/B/C are complete and accepted, consolidate guidance and move superseded documents/evidence into dated `docs/archive/` folders, preserving provenance/verification and repairing links. That cleanup is pending; Phase C and deployment remain unauthorized.

Latest approved family/blob refinement: [family redesign and voting](battle-v2/BATTLE-V2-FAMILY-REFINEMENT.md). Blob receives Razor Talons/Counterweight Tail votes and remains the no-vote fallback; Families 1/3 artwork is redesigned. Production rollout remains Phase C and is not authorized.

Current Phase B presentation refinement: [14 October review](battle-v2/BATTLE-V2-REFINEMENT-2026-10-14.md) supersedes native status graphics, procedural added cues and damage masks. Creature damage is text feedback; production mechanics and Phase C authorization are unchanged.

Current authorization (13 October 2026): **Battle v2 Phase B** asset production and development review. The user accepted the Phase A gate by requesting Phase B. See [Phase B plan](battle-v2/BATTLE-V2-PHASE-B-PLAN.md). Phase C production integration and deployment remain unauthorized; earlier Phase A-only notes below are historical.

> Current scope: [Battle v2 specification](../BATTLE-V2-SPEC.md) and [Phase B plan](battle-v2/BATTLE-V2-PHASE-B-PLAN.md) govern asset production in the development preview. Earlier appearance, region, Same-Room and display-entry guidance is superseded for the future redesign. Production behavior and legacy permissions remain unchanged until separately authorized Phase C. Dated verification records below retain their historical scope.


Recommended: VS Code with the official OpenAI Codex extension, working on a local clone of `git@github.com:ScottJMiller/monstrum-mortis.git`. VS Code is the editor; Codex is the agent that can inspect and change the opened project. There is no need to migrate the game to an OpenAI runtime, add an OpenAI API, or create an API key for the game.

## Current Battle v2 handoff

The user authorized Phase B after reviewing Phase A. Read [BATTLE-V2-SPEC.md](../BATTLE-V2-SPEC.md), [BATTLE-V2-PHASE-B-PLAN.md](battle-v2/BATTLE-V2-PHASE-B-PLAN.md) and [BATTLE-V2-PHASE-B-REVIEW.md](battle-v2/BATTLE-V2-PHASE-B-REVIEW.md). Twelve five-role bodies, three arenas, textured grafts and the current effect/audio library render at Vite-only `/battle-v2`. `npm run test:battle-v2-phase-b` and `npm run review:battle-v2` reproduce current checks/artifacts; the original Phase A review remains dated history. Manual body/arena/damage overrides and directional samplers are explicitly art-only; 47 legal recordings use the existing producers.

Experimental anatomy and step 5/6 mechanics are unchanged. The selector has no production caller. Protocol/schema/rules remain 5/5/0.3.0; production UI/routes/media remain the baseline. Stop before Phase C, cards/cabinet/naming or deployment. Phase C requires atomic persisted form/background selection, compatibility, integrated playback/themed UI, Americas-only new entry and removal of new Same-Room/display entry while preserving legacy guests/permissions. Phase D covers physical devices and human sound/pacing/performance acceptance.

## Historical step 1 import instructions

The chat workspace could not clone over SSH, but it successfully cloned this empty repository over HTTPS. The foundation was committed locally on `implementation/step-1`. Pushing failed because this workspace has no GitHub write credentials, so the branch is not on GitHub. Use the provided ZIP to import the work into your local clone, then push using your own GitHub authentication. Treat your actual GitHub clone as authoritative for any subsequent changes.

1. Install Node 24 LTS, Git, VS Code, and the official Codex extension; open Codex and sign in through its supported account flow.
2. Clone your repository locally:

```sh
git clone git@github.com:ScottJMiller/monstrum-mortis.git
cd monstrum-mortis
```

If SSH access is not configured on your machine, use your normal GitHub SSH setup or clone over HTTPS. This package does not include credentials.

3. If `implementation/step-1` is available on GitHub, check it out and skip manual import:

```sh
git fetch origin
git switch --track origin/implementation/step-1
```

If pushing was unavailable and a handoff ZIP was provided instead, extract it elsewhere. It contains a `monstrum-mortis/` folder with the project files, excluding `.git`, dependencies, generated build output, and login files.
4. Compare any existing files in your clone before copying the handoff contents into it. Preserve its `.git` directory. If the remote has an existing README, license, workflow, or `AGENTS.md`, merge deliberately rather than overwrite it blindly. The assistant could not inspect those remote files.
5. For a manual ZIP import only, create a branch. If you already checked out the remote foundation branch, just run the npm commands:

```sh
git switch -c implementation/step-1
npm ci
npm run check
npm run build
```

6. Open the folder in VS Code. Review the changes with Git, then commit and push using your own configured identity:

```sh
git add .
git commit -m "Establish Monstrum Mortis project foundation"
git push -u origin implementation/step-1
```

No deployment is triggered by this push; CI/CD is not configured yet.

## Historical step 6 handoff (10 October 2026)

The user declared step 5 complete and authorized **step 6 only**. The user previously reported deployed step 5 and approved its artwork. Cloudflare login is already local; do not request credentials or repeat login unnecessarily. This work does not deploy. Preserve SQLite-backed infrastructure identities, Workers Free compatibility, workers.dev routing and the self-hosted scottjmiller.com/www setup.

> Read AGENTS.md, APPROVED-PLAN.md, IMPLEMENTATION-STATUS.md, ARCHITECTURE.md and STEP-6-PLAN.md before continuing. Review existing changes. Step 6 implements the six real rivals, seeded automatic combat, synchronized playback, actual team results/commendations and three-round private/public progression. Step 7 cards/cabinet/naming, step 8 audio/signals and deployment require a new instruction. Do not assume access to earlier chat history. Preserve all admission, matchmaking, recovery, fresh-cohort briefing, replay-safe DNA and approved creature-composition behavior.

Use Node 24 and the committed lockfile. Wrangler is pinned to 4.149.0, with the scoped Miniflare→Sharp override and exact installer approvals. Avoid `npm audit fix --force`. No dependency or infrastructure changes were required for combat.

Current contracts: room schema **5**, protocol **5**, gameplay rules/combat **0.3.0**, unchanged DNA catalogue **0.2.0**. The required private advance/replay fences are battleId/sessionId. Existing room/guest credential storage remains valid after a protocol reload. Active schema-4 DNA sessions keep their original frozen boundary; a private host may explicitly start a new combat session, while public guests leave and choose Quick Play. No battle is retroactively rerolled. New ordinary rounds enable combat. Corrupt/unknown combat versions fail closed.

The release headline is “Creature released. Prepare for combat!” and now leads to a real bounded timeline. The producer and numeric tables are server-only; snapshots never contain private seeds/hands or explicit future results. Timeline events are public as approved, so an inspecting client can derive the eventual result. Outcome/score and autopsy numeric details commit at the actual deadline. Freeze remains immutable; detached/melted anatomy and finite hazards use a battle copy. Already-started battles finish after disconnect/reactivation.

Private hosts control next experiment and Play Again. Public outcomes feed the existing 25-second results/10-second readiness minimum, inactivity and replacement/recovery hooks, and 30-second explicit replay regroup. Three distinct rivals, fresh blob/hand/dose budgets per round, 100/50/0 actual team scoring and cumulative observed evidence are implemented. No card export/cabinet, naming, audio or team signals are implemented here.

Use `npm run dev:worker` plus `npm run dev` for real local play. `/art-gallery` and `/combat-gallery` are Vite-only review tools; they are absent from production. Run `npm run test:step6` for service/DNA/presentation/combat/composition regression suites and the seeded simulation. `npm run test:combat` and `npm run test:combat-browser` are focused alternatives. Tests use isolated SQLite and installed Chrome (`MM_CHROME_PATH` override), never production accounts or deployment. See IMPLEMENTATION-STATUS.md for actual counts and remaining device/latency/quota gaps.

Six rival masters/prompts/hashes are in `assets/rival-provenance.json` and `assets/source/rivals`; rebuild derivatives with `python3 scripts/prepare-rivals.py`. Production receives only same-origin optimized WebP. Existing blob, face, all 30 mutations, half-opacity lungs, definitive high-resolution calibration and single-triangle chamber are preserved. The combat SVG uses the same pivots, mirroring, layer/color projection, with ground framing rather than another Pixi engine. Renderer retry, resize, motion and playback do not own socket/session lifecycle.

Earlier step 1 import notes above are historical; this local clone is authoritative. The approved design and project docs provide continuity without chat history.

Phase A refinement (13 October): supplied sounds/SVGs, Metal Mania, removed shadow disks and dedicated bite lunge are integrated and locally checked. Current evidence/readiness and outstanding non-tint textured-graft discussion are in [BATTLE-V2-REVIEW.md](battle-v2/BATTLE-V2-REVIEW.md). Do not treat historical procedural-audio or initial review counts as the current asset inventory; this was prior to the separately authorized Phase B work.

Latest lettering refinement supersedes the earlier Metal Mania selection: New Rocker and all 21 requested phrases are integrated. Choices are cosmetic and stable per public event identity; block/miss/timeout lettering is enabled with the existing cap. Eleven labeled timelines and current 203-test/ten-browser-scenario evidence are documented in the review. This record predates Phase B authorization; production/Phase C/deployment remain gated.
