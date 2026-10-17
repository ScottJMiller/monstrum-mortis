# Cloudflare hosting and deployment

The approved simplification is deployed at **https://monstrum-mortis.scott-jeffrey-miller.workers.dev**. The user authorized publication for Phase D testing on 16 October 2026. [Status](IMPLEMENTATION-STATUS.md) records the exact version, local checks and bounded deployed smoke test. [Release acceptance](BATTLE-V2-PHASE-D-ACCEPTANCE.md) is complete and records the exact evidence/limitations. Future publication requires a new explicit instruction. Earlier foundation/migration instructions are [archived](archive/pre-simplification-2026-10-16/CLOUDFLARE-SETUP.md).

## Preserve the existing service

Cloudflare hosts the Worker, static client and SQLite Durable Objects; the development computer does not need to stay online. Keep Workers Free, Worker name `monstrum-mortis`, `workers_dev: true`, no custom-domain routes, and the existing LaboratoryRoom/MatchmakingPool/GuestLease identities and ROOMS/MATCHMAKING/GUEST_LEASES bindings. ASSETS serves dist/client and /api/* runs the Worker first. No D1/KV/R2 bucket, tunnel, paid plan, nameserver change or custom domain is needed. Leave scottjmiller.com/www and their self-hosted DNS/routes unchanged.

Wrangler remains pinned to the committed dependency/lockfile. Do not use forced audit fixes or automatically upgrade dependencies during deployment. This candidate uses room JSON 7/protocol 6/rules 0.6.0, with unchanged DNA/combat calibration. The clean public-only cutover expires previous room/queue/display credentials without namespace deletion.

## Validate and publish

Use Node 24. Existing local Cloudflare login was verified for this publication; do not request or paste tokens into chat. If it expires, complete Wrangler's local browser login yourself.

```sh
npm ci
npm run test:phase-d-local
npm run test:composition
npm run simulate:combat
npm run test:audio-lettering
npm run test:viewport-scroll
```

The simplification aggregate includes check/build, a Worker dry run, current public admission/DNA/runtime/browser checks and media exclusion/hash checks. `npm run deploy:dry` is useful on its own but does not publish or establish account access.

When publication is authorized:

```sh
npm run cf:whoami
npm run deploy
```

This updates the existing named Worker and its assets; never rename infrastructure to work around a failed deploy or select a paid upgrade. Inspect the printed URL/version and binding list. The current capability response has stage automatic-combat, protocol 6/rules 0.6.0, all four configured bindings true, gameplay/mechanics/combat/presentation available and `fullReleaseAvailable: false`. That existing runtime flag is unchanged by documentation acceptance; it is not an automatic reflection of this checklist. Health is configuration/capability evidence, not proof of storage or synchronization.

Use independent browsers/devices to create a public named lab, join that row, vote/start and play. Refresh old tabs after this cutover. Old private codes/queue clients are intentionally expired. The bounded deployed smoke test exercised actual HTTPS/SQLite/WebSockets. The user has separately accepted device/network/accessibility/performance testing and supplied low-usage quota reports; see completed acceptance for their dates and scope. No synthetic production load or capacity guarantee is claimed.

## Optional local review

For desktop Vite development, run `npm run dev:worker` and `npm run dev` separately. For local multi-device production-build review:

```sh
npm run build
npx wrangler dev --ip 0.0.0.0 --port 8787
```

On the same trusted LAN open the full numeric `http://<Linux-LAN-IP>:8787/` address. The secure-byte UUID helper supports ordinary HTTP; local review does not establish deployed HTTPS or physical-device acceptance. Do not forward this port through the public router. The deployed workers.dev address is the simpler authorized test path.

Before any sustained/deployed capacity test, check actual account Free usage/headroom and define a bounded cohort/stop condition. Never infer quota usage from Miniflare, Node timing or total shipped file size. Do not change account plan, namespace bindings or self-hosted domains.

## Logging and release records

The user's dashboard-enabled invocation logging is retained locally as `observability.logs.enabled: true` and `observability.logs.invocation_logs: true` in [wrangler.json](../wrangler.json). It applies to this Worker and its Durable Object entrypoints; no separate class/binding change is needed. Keep local configuration aligned with the dashboard so a later deployment retains it. Housekeeping does not redeploy the already-applied logging setting.

For a reported problem, collect its timestamp, Worker version, browser/device and reproduction steps. Capture a short tail with the installed local Wrangler:

```sh
npx wrangler tail monstrum-mortis --format json > /tmp/monstrum-mortis-tail.log
```

Stop with Ctrl+C after reproducing. Review/sanitize request URLs, headers, identities and credentials before sharing or committing any excerpt; raw logs remain outside the repository. Invocation outcomes, HTTP statuses and application failures are different: a canceled invocation or disconnected stream alone is not a proven gameplay exception. The [accepted log review](battle-v2-phase-d-review/log-review/README.md) records the observed sample and its unresolved limits.

A documentation/evidence-only commit does not require deployment. The accepted version/bundle is in [release acceptance](BATTLE-V2-PHASE-D-ACCEPTANCE.md); check it when diagnosing old tabs or a new incident. Future application/config changes require appropriate validation and explicit publication authorization.
