# Monstrum Mortis

A cooperative browser party game for 2–8 players. Remote-first Quick Play matchmaking, private invitation rooms, and an optional shared TV display. The approved design is in [docs/APPROVED-PLAN.md](docs/APPROVED-PLAN.md).

Current milestone: **step 4, laboratory presentation**, authorized on 6 October 2026; the user approved the [detailed plan](docs/STEP-4-PLAN.md) on the same date. The user confirmed steps 1–3 complete, deployed at https://monstrum-mortis.scott-jeffrey-miller.workers.dev, and verified with multiple devices. Private invitations, persistence, authorized WebSockets, reconnect, deadlines, regional Quick Play, readiness, replacements and public progression are implemented. The service stops at the battle boundary until a future combat producer supplies results; DNA and battles remain later milestones. No deployment or step 5+ work is authorized for the current milestone.

## Work locally

Use Node.js 24 LTS and npm. Node 24 runs the TypeScript foundation, room and matchmaking tests without a separate test transpiler.

```sh
npm ci
npm run check
npm run build
```

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

Create a private room and join its code/link from another browser profile or device. Optional display entry consumes no player seat. The host can start the service timeline with two connected players; DNA and battle controls remain unavailable. Credentials live in tab session storage; use Reconnect after a drop and explicitly confirm replacement if the same seat is still open elsewhere. For isolated automated runtime verification:

```sh
npm run test:rooms
npm run test:matchmaking
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for API contracts, limits and the step 3 boundary.

## Layout

| Path | Responsibility |
| --- | --- |
| `src/client/` | React views and per-device controls |
| `src/shared/` | Public contracts, message types, versioned rules |
| `src/server/` | Authoritative Worker and Durable Object classes |
| `src/server/catalogue/` | Hidden DNA definitions and rival design records |
| `src/assets/` | Versioned asset production manifest |
| `public/assets/` | Finished original/licensed assets in later stages |
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
| `npm run build` | Build the client |
| `npm run deploy:dry` | Run checks, build, and validate the Worker bundle without publishing |
| `npm run cf:login` | Browser-based Cloudflare login |
| `npm run cf:whoami` | Confirm the local authenticated Cloudflare account |
| `npm run deploy` | Publish the reviewed milestone to Cloudflare |

Never commit `.env`, `.dev.vars`, tokens, or login files. Only template files belong in Git. No automatic deployments are configured at this milestone.

## Step 4 presentation and art review

The approved laboratory presentation is implemented locally: real chamber/starter artwork, all 30 mutation appearance modules, responsive controller/TV views, motion settings and artwork-loading recovery. DNA and combat remain unavailable. Production keeps the existing room/matchmaking/session service and does not expose the development art controls.

With Node 24:

```sh
npm run test:step4
npm run test:art
npm run dev
```

`test:step4` performs checks/build/Worker dry run, the four service runtime suites and local browser regressions. `test:art` opens the development gallery with headless Chrome. Both browser harnesses use `/usr/bin/google-chrome` by default; set `MM_CHROME_PATH` locally for another installed Chrome/Chromium executable. No browser is downloaded and no deployment is performed.

Visit `/art-gallery` on the Vite development origin to review individual modules and combinations. Start `npm run dev:worker` as well for actual local room/queue behavior. See [asset provenance](docs/ASSET-PROVENANCE.md) for source files/prompts/optimization and [implementation status](docs/IMPLEMENTATION-STATUS.md) for actual checks and physical-device/accessibility/performance limitations. New visuals have not been deployed.
