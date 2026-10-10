# Monstrum Mortis

A cooperative browser party game for 2–8 players. Remote-first Quick Play matchmaking, private invitation rooms, and an optional shared TV display. The approved design is in [docs/APPROVED-PLAN.md](docs/APPROVED-PLAN.md).

Current local milestone: **step 5, DNA/mutation/release mechanics**, implemented under the [plan approved on 7 October 2026](docs/STEP-5-PLAN.md). Players select private specimens and inject into one shared creature, with six doses, six-second cooldowns, all 30 mutations and a deliberate release switch. The service freezes the creature at the battle boundary: **“Creature released. Prepare for combat!”** Combat is unavailable; this milestone cannot complete a game or generate results/cards.

The user confirmed steps 1–4 complete, pushed and deployed at https://monstrum-mortis.scott-jeffrey-miller.workers.dev, steps 1–3 tested on multiple devices, and step 4 presentation reviewed. Step 5 has been verified locally; it has not been deployed by this session. Deployment and step 6+ require a new instruction.

## Work locally

Use Node.js 24 LTS and npm. Node 24 runs the TypeScript foundation, room and matchmaking tests without a separate test transpiler.

```sh
npm ci
npm run check
npm run build
```

The manifest records installer approvals for the exact locked esbuild/workerd versions. `npm fund` lists optional sponsorship links. For dependency findings, inspect `npm audit` before changing versions; avoid `npm audit fix --force`, which can replace the pinned Cloudflare toolchain. A scoped Miniflare → Sharp 0.35.5 override resolves the recorded librsvg advisory while keeping Wrangler 4.147.0. See the dependency follow-up in [implementation status](docs/IMPLEMENTATION-STATUS.md).

Start the Worker in one terminal after the first build:

```sh
npm run dev:worker
```

Start the client in another terminal:

```sh
npm run dev
```

Open `http://localhost:5173`. The Vite server proxies `/api` and WebSocket requests to the Worker at port 8787. Worker API changes are watched by Wrangler; client changes are watched by Vite. Authentication is not needed for local development.

For Quick Play, skip or complete the rehearsal, select the same regional pool on independent browser profiles, and tap Ready when enough guests join. Two guests trigger readiness after thirty seconds; four trigger it immediately. Each public player needs a separate browser guest identity.

Create a private room and join its code/link from another browser profile or device. Optional display entry consumes no player seat. The host can start an experiment with two connected players. After the eight-second briefing, select a private specimen and press Inject; finish using Unleash after at least one injection and its cooldown. Timer expiry also releases the creature. Credentials live in tab session storage; use Reconnect after a drop and explicitly confirm replacement if the same seat is still open elsewhere. For isolated automated runtime verification:

```sh
npm run test:rooms
npm run test:matchmaking
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for API contracts, version compatibility and the frozen step 5 boundary.

## Layout

| Path | Responsibility |
| --- | --- |
| `src/client/` | React views and per-device controls |
| `src/shared/` | Public contracts, message types, versioned rules |
| `src/server/` | Authoritative Worker and Durable Object classes |
| `src/server/catalogue/` | Hidden DNA definitions and rival design records |
| `src/assets/` | Versioned asset production manifest |
| `public/assets/` | Produced chamber, creature layers and original specimen clues |
| `tests/` | Foundation invariants, deterministic room tests and independent-client runtime verification |
| `docs/` | Approved plan, setup guidance, implementation status |
| `wrangler.json` | Cloudflare deployment and SQLite-backed bindings |

The client must never import the server catalogue, persistent seat records, or server secrets. Specimen trays expose only visual clues until injection. Protocol types alone do not validate untrusted messages; the room service validates and authorizes every supported intent.

## Cloudflare

Cloudflare runs the Worker and stores room state. You do not run the Worker on your self-hosted server. The initial configuration uses only a provider `workers.dev` address and contains no route for `scottjmiller.com`.

Follow [docs/CLOUDFLARE-SETUP.md](docs/CLOUDFLARE-SETUP.md) to sign in, check your account, review a dry run, and publish a reviewed milestone when requested. Durable Object namespaces are created by deployment; no D1, KV namespace, R2 bucket, tunnel, or separate paid server is needed.

The health endpoint confirms bindings are present. It does not prove namespace storage operations, WebSockets, or matchmaking work. Those are verified in the corresponding stages.

## Continue with Codex

Open this directory in VS Code with the official Codex extension. Begin with [docs/CODEX-HANDOFF.md](docs/CODEX-HANDOFF.md); `AGENTS.md` records project constraints. Your local repository and Cloudflare browser login stay on your computer. This chat's conversation history should not be assumed to appear automatically in a new Codex session.

## Checks and deployment commands

| Command | Purpose |
| --- | --- |
| `npm run check` | Configuration guards, TypeScript checks, foundation/room/matchmaking and client regressions |
| `npm run test:rooms` | Build/dry run, then independent WebSocket clients, SQLite persistence, alarms and runtime restart |
| `npm run test:matchmaking` | Public queues, guest claims, readiness, allocation recovery and independent-client admission |
| `npm run test:dna` | Private draws, concurrent/replayed injections, scaling, release and persisted mechanics |
| `npm run test:dna-browser` | Actual trays/switches, pending reload, all 30 rendered mutations and public browser clients |
| `npm run test:composition` | Development-only authoritative creature gallery, all 30 art modules, responsive/static screenshot checks |
| `npm run test:step5` | Checks/build/dry run, all service runtime suites, DNA/presentation/art browser checks |
| `npm run build` | Build the client |
| `npm run deploy:dry` | Run checks, build, and validate the Worker bundle without publishing |
| `npm run cf:login` | Browser-based Cloudflare login |
| `npm run cf:whoami` | Confirm the local authenticated Cloudflare account |
| `npm run deploy` | Publish the reviewed milestone to Cloudflare |

Never commit `.env`, `.dev.vars`, tokens, or login files. Only template files belong in Git. No automatic deployments are configured at this milestone.

## Step 4 presentation and art review

The approved laboratory presentation is implemented and user-confirmed deployed: real chamber/starter artwork, all 30 mutation appearance modules, responsive controller/TV views, motion settings and artwork-loading recovery. Step 5 connects these layers to authoritative mutations; combat remains unavailable. Production keeps the existing room/matchmaking/session service and does not expose the development art controls.

With Node 24:

```sh
npm run test:step4
npm run test:art
npm run dev
```

`test:step4` performs checks/build/Worker dry run, the four service runtime suites and local browser regressions. `test:art` opens the development gallery with headless Chrome. Both browser harnesses use `/usr/bin/google-chrome` by default; set `MM_CHROME_PATH` locally for another installed Chrome/Chromium executable. No browser is downloaded and no deployment is performed.

Visit `/art-gallery` on the Vite development origin to review individual modules and combinations. Start `npm run dev:worker` as well for actual local room/queue behavior. See [asset provenance](docs/ASSET-PROVENANCE.md) for source files/prompts/optimization and [implementation status](docs/IMPLEMENTATION-STATUS.md) for actual checks, user-reported deployment confirmation and physical-device/accessibility/performance limitations.

Creature assembly was refined within step 5: body-relative sockets, actual pivots, outward limbs, protected facial areas, the definitive user contact sheet, half-opacity isolated lungs and original-part body assemblies calibrated to the higher-resolution sheet, and a single-triangle chamber seal. See [the composition review and screenshots](docs/CREATURE-COMPOSITION-REVIEW.md). Run `npm run test:composition` in addition to the existing step 5 regression suite. No deployment or step 6 work is included.
