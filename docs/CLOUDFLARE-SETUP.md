# Cloudflare setup without changing your self-hosted site

Cloudflare hosts this game's Worker, static client, and SQLite-backed room/coordinator storage. Your computer is used for development and deployment commands; it does not need to stay online for deployed games. Your self-hosted `scottjmiller.com` site is separate.

The user completed the initial local login and deployment on 5 October 2026 and confirmed steps 1–4 pushed and deployed on 7 October at https://monstrum-mortis.scott-jeffrey-miller.workers.dev. Steps 1–3 passed multi-device tests and step 4 presentation was reviewed. Step 5 was subsequently approved and implemented locally; no new deployment is authorized. Do not repeat authentication unless the existing local login has expired. The steps below also serve as setup guidance for a new machine.

## 1. Use the account you already have

Sign in to your Cloudflare dashboard and open **Workers & Pages**. Check that you are in the intended account and using the Workers Free plan. You do not need to transfer a domain, change nameservers, edit your home-server DNS records, or create a paid database for this milestone.

If prompted, choose a workers.dev account subdomain. The first deployment's address will have the form:

`https://monstrum-mortis.<your-workers-subdomain>.workers.dev`

This is an address pattern, not an already-created URL. If a Worker named `monstrum-mortis` already exists in that account, stop and inspect it before deploying: Wrangler would update that named service. Choose a fresh service name deliberately rather than overwriting unrelated work.

## 2. Authenticate from your local clone

Use Node 24 LTS. In the project directory:

```sh
npm ci
npm run cf:login
npm run cf:whoami
```

Wrangler opens your browser for Cloudflare authorization. Complete that browser flow yourself. Do not paste a Cloudflare token into this chat or put one in the repository. `whoami` should identify the account you intended. If you have several accounts, set the selected account's public account ID as Wrangler's `account_id` in your local reviewed configuration before deploying. An account ID is not an API token; it is not needed in the starter because most single-account logins can select the account automatically.

The user has completed authentication/account access locally for the foundation deployment. A new machine or expired login still requires local verification. A local dry run cannot establish your account plan, permissions, or deployed domain state.

## 3. Review the supplied configuration

`wrangler.json` deliberately contains:

- Worker name `monstrum-mortis`.
- `workers_dev: true`, no custom domains, and no root-domain routes.
- Client assets from `dist/client`; `/api/*` runs server code first.
- Three Durable Object bindings: `ROOMS`, `MATCHMAKING`, `GUEST_LEASES`.
- Declarative class exports with `storage: sqlite`, which fits the free plan.
- No D1 binding, KV namespace, R2 bucket, tunnel, API key, or paid-plan configuration.

You should not manually create a D1 database called ROOMS. A Durable Object owns its SQLite storage through its class namespace. Wrangler's deployment registers the declared namespaces.

## 4. Validate before publishing

```sh
npm run deploy:dry
```

Expected: configuration checks, type checks, foundation/room/matchmaking tests, a client build, and a Worker bundle dry run all succeed. Inspect the listed bindings and confirm the SQLite exports. The dry run does not publish a service or verify your authenticated account's permissions.

To test locally, start `npm run dev:worker` and then `npm run dev` in separate terminals. Open the local client, create a private laboratory, and join from another browser profile. Alternatively:

```sh
curl http://localhost:8787/api/health
```

The local step 5 tree returns `stage: dna-mechanics`, `protocolVersion: 4`, `rulesVersion: 0.2.0`, `roomServiceAvailable: true`, `matchmakingAvailable: true`, `mechanicsAvailable: true`, `combatAvailable: false`, `gameplayAvailable: false`, and all four configured bindings true. The user-reported deployed steps 1–4 tree remains at protocol 3/rules 0.1.0 until a separately authorized publication; this session has not queried or changed that origin. Health remains a wiring/capability check, not multiplayer evidence.

Use `npm run test:step5` for the local service, DNA, actual browser and art regressions, or the focused commands in README. The harnesses use isolated SQLite and independent clients. Neither the tests nor the dry run publishes anything.

## 5. Publish a reviewed milestone when requested

After confirming the selected account, Worker name, and free plan:

```sh
npm run deploy
```

Wrangler builds the app, uploads the Worker and assets, registers its SQLite-backed namespaces, and prints the actual workers.dev URL. Open that URL and `/api/health`. Expect the screen and health stage for the milestone being published. The local step 5 tree exposes real DNA controls and stops at the frozen creature boundary; combat remains step 6. Active legacy experiments remain service-only on migration, preserving deadlines; start a new laboratory to use DNA. Old protocol clients must reload while retaining their reconnect credentials. After a separately authorized publication, test actual private storage/WebSocket operations and the new milestone behavior from separate browser profiles and devices on that origin; the health result alone is insufficient.

In Workers & Pages, inspect this Worker and its bindings. Keep the Worker on the free plan, and inspect usage as testing expands. Free quotas are limits, not unlimited public matchmaking capacity; exceeding a quota can interrupt operations. Do not choose a paid upgrade just to make a failed configuration deploy.

## 6. Optional game subdomain later

Once the game is working, a dedicated name such as `monstrum.scottjmiller.com` can point to this Worker while the apex and `www` continue to serve your self-hosted site.

Prerequisites: the zone is active in your Cloudflare account, and the proposed game hostname is unused. Check its DNS and any wildcard entries first. Cloudflare cannot add a Worker Custom Domain on a hostname with an existing CNAME; do not delete records indiscriminately to work around that.

Add only the dedicated game hostname as a Worker **Custom Domain**, not a broad Worker Route. Current dashboard path: Workers & Pages → your Worker → Settings → Domains & Routes → Add → Custom Domain. Cloudflare manages the game hostname's DNS and certificate.

When chosen, mirror that setting in the reviewed Wrangler configuration so subsequent deployments preserve it:

```json
"routes": [
  { "pattern": "monstrum.scottjmiller.com", "custom_domain": true }
]
```

Keep `workers_dev: true` if you want the provider address available too. This snippet is future guidance; it is intentionally not active in the starter. `npm run check:config` currently enforces workers.dev-only setup and must be deliberately updated when the custom-domain milestone is approved.

Do not attach `scottjmiller.com/*`, `*.scottjmiller.com/*`, or `www.scottjmiller.com` to the game Worker. Those would affect your existing hosting. There is no reason to move the self-hosted site to Cloudflare Workers.

## Official references

- https://developers.cloudflare.com/workers/get-started/guide/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/durable-objects/get-started/
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
