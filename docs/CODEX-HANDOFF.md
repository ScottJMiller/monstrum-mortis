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

## Current handoff

The user confirmed steps 1–4 complete, pushed and deployed at https://monstrum-mortis.scott-jeffrey-miller.workers.dev on 7 October 2026, with steps 1–3 tested on multiple devices and step 4 presentation reviewed. Cloudflare authentication has already been completed locally; do not repeat login unnecessarily. Step 5 only is authorized and implemented locally under [STEP-5-PLAN.md](STEP-5-PLAN.md), approved with “Creature released. Prepare for combat!” and permission to run necessary scripts. No new deployment is authorized. The import notes above describe the original handoff, not outstanding work in this clone.

> We are developing Monstrum Mortis. Read AGENTS.md, docs/APPROVED-PLAN.md, docs/IMPLEMENTATION-STATUS.md, docs/ARCHITECTURE.md, docs/STEP-4-PLAN.md, docs/STEP-5-PLAN.md, and the asset provenance/render metadata. Steps 1–4 are complete, pushed and deployed; the user tested steps 1–3 on multiple devices and reviewed step 4 presentation. Step 5 only was approved and implemented locally. Review its actual verification in IMPLEMENTATION-STATUS.md. Preserve the room service, matchmaking, entry-key, session-recovery, fresh-admission fixes and presentation assets. Review existing changes and use Node 24 for documented checks. Keep Cloudflare Free, SQLite-backed Durable Objects, workers.dev-only routing, and scottjmiller.com/www self-hosted. Stop production at the frozen-creature combat-pending boundary. Do not implement step 6+, cards/cabinet or deploy without a new instruction. Do not assume access to earlier chat history.

Use npm run dev:worker and npm run dev for the laboratory presentation with the existing service. Use /art-gallery on the Vite development origin for fixture art review; it is excluded from production. Two independent browser profiles/devices can join the same private invitation; a display uses no player seat. The host can start the server timeline, which stops at the battle boundary until combat is implemented. Reconnect uses a private credential in tab session storage; a second active connection requires explicit replacement. See docs/ARCHITECTURE.md for contracts and limits.

The approved specification and project documents provide continuity independently of the chat. Return to this interface whenever you want to review design choices or discuss a larger change.

Official IDE guidance: https://developers.openai.com/codex/ide/

Quick Play now includes regional queues, authored guest identities, ready checks and explicit replacement queues. Public rooms start without a host. Results/replay/recovery are implemented behind the future trusted battle-completion boundary; step 3 does not fabricate combat results. Guest claims apply across all public pools and private entries carrying that issued identity. Legacy private-only guests remain independent anonymous seats. See the current status for historical local runtime evidence, the user's deployed multi-device confirmation, and remaining integration/load/visual verification.

Step 4 historical local verification passed: 41 automated tests, build/dry run, all room/matchmaking/recovery/fresh-admission runtime suites, nine headless Chrome scenarios and all 30 gallery modules with three assembled examples. The user's later review/deployment confirmation supersedes its publication gap. Manual accessibility, broader browser and measured physical-device frame-rate evidence remain outstanding. Source artwork, prompts and applicable terms are recorded in docs/ASSET-PROVENANCE.md.

Step 5 planning reviewed the clean baseline, prose-only DNA catalogue, twelve logical/render-slot differences, private projection/action/persistence gaps and all 34 source hashes/runtime file measurements. Check/build passed; no behavior changed. The proposal includes executable catalogue numbers/caps, safe private draw packets, schema-4 migration, protocol-4 attempt fencing and rules-0.2.0 defaults. These approved changes are now implemented locally; see the status and proposal for the verification matrix and human-device checklist.


Step 5 uses room schema 4, protocol 4 and rules 0.2.0. Real owner-private trays/draw packets, six-dose budgets, cooldown, all 30 mutations, replacement/diminishing/scaling, attributed history, coarse readings and deliberate switches now feed an immutable creature at release. The headline is “Creature released. Prepare for combat!”, followed by an honest explanation that combat is unavailable. Existing gameplay completion fixtures remain test-only; no outcome producer exists. The renderer updates in place with bounded textures, pending injection/switch intentions survive tab reload, and original opaque SVG clues have their own provenance. Run `npm run test:step5`; review the current status for exact counts, fixture scope and human-device checklist. Do not deploy or continue into step 6 without instruction.

A dependency follow-up repaired an accidental `npm audit fix --force` Wrangler downgrade: retain Wrangler 4.147.0 and its verified runtime, use the scoped Miniflare → Sharp 0.35.5 override, and commit the refreshed lockfile plus exact esbuild/workerd installer approvals. Clean install and both audit scopes report zero vulnerabilities; see the latest implementation status for actual full-suite results. Avoid forced audit version changes; review a concrete dependency update and validate it instead.

Step 5 presentation refinement was authorized on 7 October 2026. Creature assembly now uses body-relative sockets, audited real pivots, outward mirrored forelimbs and deliberate face/organ layering. The user's definitive sheet now governs sizes/placement: the higher-resolution 9 October sheet is measured in `src/assets/reference-calibration.json`; isolated lungs stay at 50% opacity, candle/skeleton bodies reuse the original modules in deterministic assemblies, and original eyes retain their geometry with shared color grades. Independent left/right poses preserve the sheet’s slight asymmetry. The chamber seal has one upright triangle. Run `npm run test:composition` as well as existing regression checks. Review [CREATURE-COMPOSITION-REVIEW.md](CREATURE-COMPOSITION-REVIEW.md) for all 30 audit decisions, retained before/after/contact-sheet artifacts and device limitations. This adds no step 6 authorization or deployment permission.
