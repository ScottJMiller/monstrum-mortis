# Cloudflare hosting and deployment

The approved simplification is deployed at **https://monstrum-mortis.scott-jeffrey-miller.workers.dev**. The user authorized publication for Phase D testing on 16 October 2026. [Status](IMPLEMENTATION-STATUS.md) records the exact version, local checks and bounded deployed smoke test. [Human acceptance](BATTLE-V2-PHASE-D-ACCEPTANCE.md) remains separate. Earlier foundation/migration instructions are [archived](archive/pre-simplification-2026-10-16/CLOUDFLARE-SETUP.md).

## Preserve the existing service

Cloudflare hosts the Worker, static client and SQLite Durable Objects; the development computer does not need to stay online. Keep Workers Free, Worker name `monstrum-mortis`, `workers_dev: true`, no custom-domain routes, and the existing LaboratoryRoom/MatchmakingPool/GuestLease identities and ROOMS/MATCHMAKING/GUEST_LEASES bindings. ASSETS serves dist/client and /api/* runs the Worker first. No D1/KV/R2 bucket, tunnel, paid plan, nameserver change or custom domain is needed. Leave scottjmiller.com/www and their self-hosted DNS/routes unchanged.

Wrangler remains pinned to the committed dependency/lockfile. Do not use forced audit fixes or automatically upgrade dependencies during deployment. This candidate uses room JSON 7/protocol 6/rules 0.6.0, with unchanged DNA/combat calibration. The clean public-only cutover expires previous room/queue/display credentials without namespace deletion.

## Validate and publish

Use Node 24. Existing local Cloudflare login was verified for this publication; do not request or paste tokens into chat. If it expires, complete Wrangler's local browser login yourself.

```sh
npm ci
npm run check
npm run test:simplification
npm run test:composition
npm run simulate:combat
```

The simplification aggregate includes check/build, a Worker dry run, current public admission/DNA/runtime/browser checks and media exclusion/hash checks. `npm run deploy:dry` is useful on its own but does not publish or establish account access.

When publication is authorized:

```sh
npm run cf:whoami
npm run deploy
```

This updates the existing named Worker and its assets; never rename infrastructure to work around a failed deploy or select a paid upgrade. Inspect the printed URL/version and binding list. The current capability response has stage automatic-combat, protocol 6/rules 0.6.0, all four configured bindings true, gameplay/mechanics/combat/presentation available and fullReleaseAvailable false while acceptance remains open. Health is configuration/capability evidence, not proof of storage or synchronization.

Use independent browsers/devices to create a public named lab, join that row, vote/start and play. Refresh old tabs after this cutover. Old private codes/queue clients are intentionally expired. The bounded deployed smoke test exercised actual HTTPS/SQLite/WebSockets, but physical Safari, network/memory/sound and account quota-headroom acceptance still require the user's checklist. No synthetic production load was run.

## Optional local review

For desktop Vite development, run `npm run dev:worker` and `npm run dev` separately. For local multi-device production-build review:

```sh
npm run build
npx wrangler dev --ip 0.0.0.0 --port 8787
```

On the same trusted LAN open the full numeric `http://<Linux-LAN-IP>:8787/` address. The secure-byte UUID helper supports ordinary HTTP; local review does not establish deployed HTTPS or physical-device acceptance. Do not forward this port through the public router. The deployed workers.dev address is the simpler authorized test path.

Before any sustained/deployed capacity test, check actual account Free usage/headroom and define a bounded cohort/stop condition. Never infer quota usage from Miniflare, Node timing or total shipped file size. Do not change account plan, namespace bindings or self-hosted domains.
