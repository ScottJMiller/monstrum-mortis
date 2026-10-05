# Implementation status

The remote-first plan was approved on 5 October 2026. The current request is implementation step 1 only.

## Step 1 deliverables

- Project structure: React/Vite client, server Worker, public shared contracts, server-only persistence records/catalogues, assets, tests, and documentation.
- Rules: version 0.1.0, including six-dose rounds, private/public progression, matchmaking defaults, player-count scaling, reconnect timing, and tarot dimensions.
- Protocol: typed intent/action and public snapshot contracts, without runtime gameplay dispatch yet.
- Catalogue: 30 DNA design entries and six rivals; combat numbers are deliberately not calibrated in this milestone.
- Asset manifest: versioned production inventory with planned status; no generated artwork or audio yet.
- Cloudflare configuration: static client plus one Worker; three SQLite-backed Durable Object classes; provider workers.dev address only.
- Local diagnostic: `/api/health` confirms binding availability and explicitly reports gameplay unavailable.
- Guidance: local Codex/VS Code handoff and Cloudflare account/deployment steps that keep the existing self-hosted domain separate.

## Verification

Completed in the chat workspace on 5 October 2026:

- Installed dependencies and committed an exact-version npm lockfile. Node types target Node 24.
- Generated Worker runtime/binding types using Wrangler 4.147.0.
- Configuration guard passed: no existing-domain routes; three SQLite-backed class exports; static/API routing separated.
- TypeScript client and server checks passed.
- Five foundation tests passed, including player-count normalization, timing bounds, catalogue coverage, asset status, and health readiness.
- Vite production client build passed.
- Wrangler deployment dry run passed and listed all four bindings. Nothing was deployed.
- GitHub SSH access failed, but HTTPS successfully cloned the repository and confirmed it was empty.
- Foundation committed locally on `implementation/step-1`; GitHub push failed because authenticated write access is unavailable here. The ZIP handoff contains the source and lockfile for local import; no changes were published to the remote.

Outstanding checks:

- `wrangler whoami` reports no authenticated Cloudflare account in the chat workspace. Complete `npm run cf:login` and `npm run cf:whoami` on the user's computer to verify the intended account and free plan.
- The local Wrangler runtime could not start here: `uv_interface_addresses` failed in the workspace environment. Runtime HTTP/static-assets checks must be completed on the local machine using the documented commands. This is not reported as a passing runtime test.
- Real namespace SQL operations, authenticated rooms, and WebSockets remain step 2 work. Matchmaking and cross-pool lease verification remain step 3 work.

Local checks and a bundle dry run do not establish deployed service permissions, actual account quota, or real multiplayer behavior.

## Not implemented

Step 2 rooms and runtime authentication/validation; step 3 public queues/leases; step 4 art/scene; step 5 DNA mechanics; step 6 battles; step 7 specimen exports; step 8 polish/failure testing; step 9 complete-game deployment.

The foundation may be deployed for wiring verification, but it is not a playable demo and does not claim multiplayer works.
