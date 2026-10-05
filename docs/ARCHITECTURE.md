# Foundation architecture

One repository, one deployable Cloudflare Worker, one static client origin. Serving client and API together avoids cross-origin credential and WebSocket configuration in the first release. There is no self-hosted game backend.

The Worker routes `/api/*` to server code. Other paths are static client assets, with SPA fallback. The only implemented API is read-only `GET /api/health` (and `HEAD`). Gameplay APIs return 501 until they are implemented.

Three SQLite-backed Durable Object classes are registered:

| Binding | Class | Keying and eventual responsibility |
| --- | --- | --- |
| `ROOMS` | `LaboratoryRoom` | Per-room identity; authoritative phases, seats, doses, creature, battle, score |
| `MATCHMAKING` | `MatchmakingPool` | Per coarse pool; waiting tickets, readiness, admission reservations |
| `GUEST_LEASES` | `GuestLease` | Per guest identity; atomic queue/room claim across pools |

Classes are intentionally inert in step 1. They allocate no active game rooms or matchmaking queues. Step 2 adds authenticated rooms and storage operations; step 3 adds queues and leases. Declaration of a namespace is distinct from creating a running object instance.

The current Wrangler configuration uses Cloudflare's declarative `exports` entries with `storage: sqlite`, not the legacy `migrations` array. Do not mix those two class-registration mechanisms. Generated Worker types come from `wrangler types worker-configuration.d.ts`; regenerate when configuration changes.

Public and private data are separate. `src/shared/types.ts` contains client-safe projections; `src/server/state.ts` contains persistent internal records. Private controller snapshots go only to the authenticated seat owner. Display sessions receive public state only. Hidden DNA maps are server-only.

Versioning:

- `schemaVersion` identifies each stored-record structure.
- `rulesVersion` identifies gameplay defaults used by a session and its card records.
- `protocolVersion` identifies the client/server wire contract.
- `assetManifestVersion` identifies the art set used for a frozen card portrait.

These are foundation contracts; add runtime validators, explicit storage migrations, idempotency-key retention, lease expiry, and replay-safe state transitions before accepting gameplay traffic. The type definitions do not replace authentication or runtime validation.

No precise data location is promised by the coarse matchmaking regions. Pools group guests; Cloudflare manages actual execution placement.
