# Monstrum Mortis

A cooperative browser party game for 2–8 players. Remote-first Quick Play matchmaking, private invitation rooms, and an optional shared TV display. The approved design is in [docs/APPROVED-PLAN.md](docs/APPROVED-PLAN.md).

Current milestone: **step 1, project foundation**. Room creation, matchmaking, mutations, and battles are not implemented yet. The development screen checks the Worker connection; it is not a playable game.

## Work locally

Use Node.js 24 LTS and npm. Node 24 runs the small TypeScript foundation tests without a separate test transpiler.

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

Open `http://localhost:5173`. The Vite server proxies `/api` and future WebSocket requests to the Worker at port 8787. Worker API changes are watched by Wrangler; client changes are watched by Vite. Authentication is not needed for local development.

## Layout

| Path | Responsibility |
| --- | --- |
| `src/client/` | React views and per-device controls |
| `src/shared/` | Public contracts, message types, versioned rules |
| `src/server/` | Authoritative Worker and Durable Object classes |
| `src/server/catalogue/` | Hidden DNA definitions and rival design records |
| `src/assets/` | Versioned asset production manifest |
| `public/assets/` | Finished original/licensed assets in later stages |
| `tests/` | Foundation invariants |
| `docs/` | Approved plan, setup guidance, implementation status |
| `wrangler.json` | Cloudflare deployment and SQLite-backed bindings |

The client must never import the server catalogue, persistent seat records, or authentication tokens. Specimen trays expose only visual clues until injection. Protocol types alone do not validate untrusted messages; runtime validation comes with the room service.

## Cloudflare

Cloudflare runs the Worker and stores room state. You do not run the Worker on your self-hosted server. The initial configuration uses only a provider `workers.dev` address and contains no route for `scottjmiller.com`.

Follow [docs/CLOUDFLARE-SETUP.md](docs/CLOUDFLARE-SETUP.md) to sign in, check your account, review a dry run, and optionally deploy the foundation. Durable Object namespaces are created by deployment; no D1, KV namespace, R2 bucket, tunnel, or separate paid server is needed.

The health endpoint confirms bindings are present. It does not prove namespace storage operations, WebSockets, or matchmaking work. Those are verified in the corresponding stages.

## Continue with Codex

Open this directory in VS Code with the official Codex extension. Begin with [docs/CODEX-HANDOFF.md](docs/CODEX-HANDOFF.md); `AGENTS.md` records project constraints. Your local repository and Cloudflare browser login stay on your computer. This chat's conversation history should not be assumed to appear automatically in a new Codex session.

## Checks and deployment commands

| Command | Purpose |
| --- | --- |
| `npm run check` | Configuration guards, TypeScript checks, foundation tests |
| `npm run build` | Build the client |
| `npm run deploy:dry` | Run checks, build, and validate the Worker bundle without publishing |
| `npm run cf:login` | Browser-based Cloudflare login |
| `npm run cf:whoami` | Confirm the local authenticated Cloudflare account |
| `npm run deploy` | Publish the foundation to Cloudflare |

Never commit `.env`, `.dev.vars`, tokens, or login files. Only template files belong in Git. No automatic deployments are configured at this milestone.
