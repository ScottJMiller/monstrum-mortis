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

The user confirmed steps 1–3 complete, deployed at https://monstrum-mortis.scott-jeffrey-miller.workers.dev, and verified with multiple devices on 6 October 2026. Cloudflare authentication has already been completed locally; do not repeat login unnecessarily. Step 4 only is authorized; the user explicitly approved its [detailed plan](STEP-4-PLAN.md) on the same date. No deployment is authorized. The import notes above describe the original handoff, not outstanding work in this clone.

> We are developing Monstrum Mortis. Read AGENTS.md, docs/APPROVED-PLAN.md, docs/IMPLEMENTATION-STATUS.md, docs/ARCHITECTURE.md, and docs/STEP-4-PLAN.md. Steps 1–3 are complete, deployed and user-verified on multiple devices. Step 4 only is authorized and its detailed plan is approved. Its presentation, real artwork and accessibility settings are implemented locally; review the implementation status for actual checks and remaining visual/device limits. Preserve the room service, matchmaking, entry-key, session-recovery and fresh-admission fixes. Review existing changes and use Node 24 for documented checks. Keep Cloudflare Free, SQLite-backed Durable Objects, workers.dev-only routing, and scottjmiller.com/www self-hosted. Do not implement step 5 or later, or deploy, without a new instruction. Do not assume access to earlier chat history.

Use npm run dev:worker and npm run dev for the laboratory presentation with the existing service. Use /art-gallery on the Vite development origin for fixture art review; it is excluded from production. Two independent browser profiles/devices can join the same private invitation; a display uses no player seat. The host can start the server timeline, which stops at the battle boundary until combat is implemented. Reconnect uses a private credential in tab session storage; a second active connection requires explicit replacement. See docs/ARCHITECTURE.md for contracts and limits.

The approved specification and project documents provide continuity independently of the chat. Return to this interface whenever you want to review design choices or discuss a larger change.

Official IDE guidance: https://developers.openai.com/codex/ide/

Quick Play now includes regional queues, authored guest identities, ready checks and explicit replacement queues. Public rooms start without a host. Results/replay/recovery are implemented behind the future trusted battle-completion boundary; step 3 does not fabricate combat results. Guest claims apply across all public pools and private entries carrying that issued identity. Legacy private-only guests remain independent anonymous seats. See the current status for historical local runtime evidence, the user's deployed multi-device confirmation, and remaining integration/load/visual verification.

Step 4 local verification passed: 41 automated tests, build/dry run, all room/matchmaking/recovery/fresh-admission runtime suites, nine headless Chrome scenarios and all 30 gallery modules with three assembled examples. Physical-device visual/accessibility/frame-rate checks remain outstanding. Source artwork, prompts and applicable terms are recorded in docs/ASSET-PROVENANCE.md. No new deployment occurred.
