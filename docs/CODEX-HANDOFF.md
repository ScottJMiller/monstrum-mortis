# Continue in VS Code with Codex

Recommended: VS Code with the official OpenAI Codex extension, working on a local clone of `git@github.com:ScottJMiller/monstrum-mortis.git`. VS Code is the editor; Codex is the agent that can inspect and change the opened project. There is no need to migrate the game to an OpenAI runtime, add an OpenAI API, or create an API key for the game.

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

## Current handoff (10 October 2026)

The user declared step 5 complete and authorized **step 6 only**. The user previously reported deployed step 5 and approved its artwork. Cloudflare login is already local; do not request credentials or repeat login unnecessarily. This work does not deploy. Preserve SQLite-backed infrastructure identities, Workers Free compatibility, workers.dev routing and the self-hosted scottjmiller.com/www setup.

> Read AGENTS.md, APPROVED-PLAN.md, IMPLEMENTATION-STATUS.md, ARCHITECTURE.md and STEP-6-PLAN.md before continuing. Review existing changes. Step 6 implements the six real rivals, seeded automatic combat, synchronized playback, actual team results/commendations and three-round private/public progression. Step 7 cards/cabinet/naming, step 8 audio/signals and deployment require a new instruction. Do not assume access to earlier chat history. Preserve all admission, matchmaking, recovery, fresh-cohort briefing, replay-safe DNA and approved creature-composition behavior.

Use Node 24 and the committed lockfile. Wrangler is pinned to 4.149.0, with the scoped Miniflare→Sharp override and exact installer approvals. Avoid `npm audit fix --force`. No dependency or infrastructure changes were required for combat.

Current contracts: room schema **5**, protocol **5**, gameplay rules/combat **0.3.0**, unchanged DNA catalogue **0.2.0**. The required private advance/replay fences are battleId/sessionId. Existing room/guest credential storage remains valid after a protocol reload. Active schema-4 DNA sessions keep their original frozen boundary; a private host may explicitly start a new combat session, while public guests leave and choose Quick Play. No battle is retroactively rerolled. New ordinary rounds enable combat. Corrupt/unknown combat versions fail closed.

The release headline is “Creature released. Prepare for combat!” and now leads to a real bounded timeline. The producer and numeric tables are server-only; snapshots never contain private seeds/hands or explicit future results. Timeline events are public as approved, so an inspecting client can derive the eventual result. Outcome/score and autopsy numeric details commit at the actual deadline. Freeze remains immutable; detached/melted anatomy and finite hazards use a battle copy. Already-started battles finish after disconnect/reactivation.

Private hosts control next experiment and Play Again. Public outcomes feed the existing 25-second results/10-second readiness minimum, inactivity and replacement/recovery hooks, and 30-second explicit replay regroup. Three distinct rivals, fresh blob/hand/dose budgets per round, 100/50/0 actual team scoring and cumulative observed evidence are implemented. No card export/cabinet, naming, audio or team signals are implemented here.

Use `npm run dev:worker` plus `npm run dev` for real local play. `/art-gallery` and `/combat-gallery` are Vite-only review tools; they are absent from production. Run `npm run test:step6` for service/DNA/presentation/combat/composition regression suites and the seeded simulation. `npm run test:combat` and `npm run test:combat-browser` are focused alternatives. Tests use isolated SQLite and installed Chrome (`MM_CHROME_PATH` override), never production accounts or deployment. See IMPLEMENTATION-STATUS.md for actual counts and remaining device/latency/quota gaps.

Six rival masters/prompts/hashes are in `assets/rival-provenance.json` and `assets/source/rivals`; rebuild derivatives with `python3 scripts/prepare-rivals.py`. Production receives only same-origin optimized WebP. Existing blob, face, all 30 mutations, half-opacity lungs, definitive high-resolution calibration and single-triangle chamber are preserved. The combat SVG uses the same pivots, mirroring, layer/color projection, with ground framing rather than another Pixi engine. Renderer retry, resize, motion and playback do not own socket/session lifecycle.

Earlier step 1 import notes above are historical; this local clone is authoritative. The approved design and project docs provide continuity without chat history.
