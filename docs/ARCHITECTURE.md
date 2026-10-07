# Service and presentation architecture (steps 1–4)

One repository, one Cloudflare Worker, one static client origin. On 6 October 2026 the user confirmed steps 1–3 complete, deployed, and verified with multiple devices at https://monstrum-mortis.scott-jeffrey-miller.workers.dev. Step 4 only is authorized and its detailed plan was explicitly approved on the same date. The client now implements that presentation locally; no deployment occurred. There are no custom-domain routes or paid dependencies.

## Stable infrastructure

| Binding | Class | Responsibility |
| --- | --- | --- |
| `ROOMS` | `LaboratoryRoom` | Room state, seats, admission, phases, deadlines, reconnect and hibernating WebSockets |
| `MATCHMAKING` | `MatchmakingPool` | One coordinator per coarse region: FIFO tickets, ready checks, allocation journal and vacancy offers |
| `GUEST_LEASES` | `GuestLease` | Server-issued browser identities and atomic claims across queues and rooms |

Class identities, bindings and declarative SQLite exports in `wrangler.json` remain unchanged. Objects are named `room:<code-or-public-id>`, `pool:<region>` and `guest:<uuid>`. The `control:private-entry` room instance bounds anonymous entry attempts and allocates private codes. A guest control object, `control:guest-identities`, retains replay-safe issuance mappings.

Rooms persist an explicit schema-3 JSON record in SQLite, with a migration from schema 2 that adds `publicState: null` while preserving private seats and credentials. Unknown schemas fail closed. Schema-2 public contracts remain supported for binding-only legacy fixtures; actual matchmaking allocations always carry a region and enforce guest leases. Additional SQL tables retain action receipts, rate windows and creation mappings. Pool state includes ready checks and allocation journals. Guest identity records include hashed access tokens, private HMAC secrets and the current fenced claim.

Events reload SQLite state. Per-object promise queues serialize asynchronous operations. Room state, action receipts and alarms commit before acknowledgment; allocation journals commit before cross-object calls. A persisted room notification outbox publishes only vacancy context to its pool, **after releasing the room event queue**, avoiding a room/coordinator deadlock. Monotonic notification sequence numbers reject stale offers. Pending notifications retry by alarm, including after reactivation.

## Browser API

| Route | Method | Contract |
| --- | --- | --- |
| `/api/health` | GET / HEAD | `stage: public-matchmaking`, protocol 3, rules 0.1.0, room/matchmaking available, gameplay unavailable |
| `/api/guests` | POST | `{ operationId }` returns owner-only opaque guest credentials, authored alias and symbol |
| `/api/guests/session` | GET | Authenticated owner-only current queue/room claim for session recovery |
| `/api/guests/leave-session` | POST | Authenticated explicit leave with the observed `{ kind, id, nonce }`; stale claims cannot release newer sessions |
| `/api/pools/:region/ping` | GET | Response-time probe; no precise location or execution-region guarantee |
| `/api/queue/:region/enter` | POST | `{ operationId, mode }`; exact fresh-session or fill-existing-laboratory consent |
| `/api/queue/:region/ready` | POST | `{ ticketId, readyCheckId }`; only this guest's chosen ready check |
| `/api/queue/:region/resume` | POST | `{ ticketId }`; explicit resumption of an inactive ticket |
| `/api/queue/:region/cancel` | POST | `{ ticketId }`; fences guest allocation before coordinator I/O completes |
| `/api/queue/:region/status` | GET | `?ticketId=<uuid>`; private owner-only queue projection |
| `/api/queue/:region/socket` | GET upgrade | Protocols `mm-queue-v3, guest.<uuid>, token.<accessToken>`; replies with `mm-queue-v3` only |
| `/api/rooms/private` | POST | `{ operationId, alias, presentation }`; collision-checked six-character private code and host seat |
| `/api/rooms/:id/join` | POST | Private `{ operationId, alias, role: player \| display }` |
| `/api/rooms/:id/admit` | POST | Public `{ operationId, reservationId, admissionToken }`; issued identity and lease required |
| `/api/rooms/:id/snapshot` | GET | Seat bearer token; public state plus only its owner's controller |
| `/api/rooms/:id/socket` | GET upgrade | `mm-v3, token.<reconnectToken>`; replies with `mm-v3` only |
| `/api/rooms/:id/display` | POST | Participant bearer token plus `{ operationId }`; separate display credential |

Queue HTTP operations use `X-Guest-Id` and `Authorization: Bearer <accessToken>`. Private create/join includes `X-Guest-Id` and `X-Guest-Token` when the browser already has an issued identity; that guest cannot also occupy another queue or room. Legacy/private-only invitation guests still have independent anonymous seat identities. These credentials are browser identities, not verified people: separate browser profiles can deliberately create independent identities.

Tokens never appear in invitation URLs, query strings, public room projections or other guests' queue projections. JSON bodies are streamed with a 4 KiB limit; room messages are exact validated JSON at most 2 KiB. Queue sockets synchronize owner status and accept only `sync` plus automatic `ping`/`pong`; queue intentions use authenticated HTTP. Cross-origin browser requests fail, with the existing local Vite exception.

Room entry keys and action IDs are secret/random UUIDs. Entry fingerprints detect changed retries; reconnect tokens are HMAC-derived and compared as SHA-256 hashes. A room supports eight players, four displays, 128 historical admissions/reservations and 1,024 mutation receipts per seat. Entry limits remain 5 creations and 30 entry attempts per IP per minute, 10 seat connections per minute, 30 room actions per 10 seconds and 4 display grants per issuer per minute. Queue HTTP/sync operations are limited to 30 per guest per 10 seconds. Pools retain at most 1,000 tickets and 2,000 notification histories; the issuer retains at most 4,096 issuance mappings, and each guest at most 1,024 cancellation tombstones. Shared-IP groups share limits.

## Queue allocation and guest fencing

Three pools: Americas, Europe/Africa, Asia/Pacific. The client probes their response times and chooses the fastest responding pool, with manual override. This measures requests to the service; it does not pin Cloudflare execution to a continent. Queueing requires an explicit choice. Fresh tickets never consume replacement offers.

Four waiting guests trigger a ten-second ready check. FIFO additions fill that check to six without extending its deadline. With two or three waiting guests, the oldest thirty-second wait triggers the check; fewer than two remain waiting. After sixty seconds the UI offers another pool or a private invitation without changing pools automatically. At the deadline, two confirmed fresh guests suffice; nonresponders become inactive and must explicitly resume. Confirmed guests in a failed check keep their original queue priority.

The coordinator journals an allocation UUID, member reservation UUIDs and expiry before contacting a room. Room allocation is idempotent. Each guest authority atomically transfers the exact queue claim to the exact room/reservation. Partial failures revoke reservations and return eligible guests to their original priority. Reactivation retries the same journal rather than creating another room. Room admission and connection independently verify the lease. A cancellation tombstone prevents a delayed transfer or admission from reviving a cancelled ticket; subsequent queue consent uses a new ticket. Once the participant connects, cancellation uses the room Leave intent.

Claims have a two-minute technical expiry and renew while the queue/seat is live, at intervals of roughly forty-five seconds. Conditional release checks both holder and nonce so old callbacks cannot release a newer claim. Unused admission grants expire after ten seconds (and never after a replacement window); the room releases pending claims, and owner status becomes inactive for explicit resumption. Stale queue connections become inactive after sixty seconds. Ticket/allocation history expires after two hours; guest credentials and cancellation history have a twenty-four-hour idle lifetime. Alarm maintenance does not extend an idle identity forever.

## Public room progression

Public rooms have no player host. Two admitted, connected players start briefing automatically; remaining fresh grants may join during briefing before the experiment player count locks. Private rooms retain host-controlled starts, mid-round waiting seats and display invitations. A second room socket requires explicit replacement; hibernating attachments and authoritative deadlines preserve reconnection behavior.

The service timeline remains `lobby → briefing (8s) → experiment (75s) → release (5s) → battle`. **Battle has no automatic completion yet.** Production DNA, switch mechanics, outcomes, awards, cards and actual three-round gameplay require steps 5–7. Empty trays/zero doses and `mechanicsAvailable: false` remain honest service projections.

A binding-only `finishPublicBattle(sessionId, completionId, outcome)` boundary accepts a future trusted server battle producer. Browsers cannot call it or submit an outcome. It records completion exactly once, updates team score using approved rules, and enters results. Runtime tests supply this boundary after seeding battle state; they do not validate combat.

Public autopsy lasts twenty-five seconds; all active players choosing Next Round may advance after ten seconds. Pending reservations prevent early advance until admitted or expired. Explicit Fill Existing Laboratory tickets get the round, team score, approximate remaining length and vacancy/recovery reason before Ready. Room capacity and phase are checked again when reserving and admitting. A result window that advances while a fill ready check is pending may reject that allocation and return its confirmed guest with original priority. Replacements never inject into an active experiment, inherit a departed identity or receive earlier personal credit. Dose reset/dealing is the step 5 boundary.

Disconnect grace remains fifteen seconds. Fewer than two eligible players suspends an unfinished experiment for thirty seconds; failed reconnection abandons only that attempt and opens a sixty-second recovery lobby. Two confirmed participants retry the same round. Completed score remains. Timeout presents explicit queue/exit choices and never queues the guest automatically. Already-started battles remain at the combat boundary rather than rewind.

Session end opens thirty seconds for explicit replay opt-in. Two opting in start a new session UUID with reset score; nonparticipants leave that session. Fewer than two preserve the results and choose queue or exit. Find New Laboratory acknowledges leaving before entering a fresh queue. The inactivity prompt/seat-expiry hook is implemented for initialized per-round participation counters; step 5 must initialize/update those counters when real DNA actions become available. Mechanics-unavailable service rounds do not label every player inactive.

Room state, secrets and receipts expire after two hours without participant activity or twenty-four hours total. Hibernating heartbeat responses do not manufacture gameplay activity. Future downloaded/local records remain independent of room expiry.

## Browser recovery and verification

Room credentials remain in tab session storage. Guest access credentials are browser-scoped in local storage; queue tickets, queue mode and the admission operation key are tab-local. Reload or a lost admission response retries the same operation, recovering the same seat. Successful room entry retires its key; leave → create/rejoin uses a fresh key. Storage failure is reported. Private invitation links contain only code/display hints; public display tabs receive a separate viewing credential in their own session storage.

A missing server ticket retires the stale browser ticket and checks the guest's current claim. An in-flight queue entry is allowed to complete before classifying its ticket as missing. Check previous session and explicit Leave previous laboratory/Cancel previous queue controls recover issued guest identities even after a room credential is lost. Recovery preserves the identity, uses owner authentication and the observed claim nonce, and revokes the matching seat before conditionally releasing its claim. It never resets the guest or releases a newer claim automatically. Existing aliases intentionally survive reload.

`npm run check` covers configuration, both TypeScript projects and deterministic/component regressions. `npm run test:rooms` builds/dry-runs and tests independent private-room clients, real alarms, SQLite, eviction and restart. `npm run test:matchmaking` also uses independent network queue/room clients with isolated SQLite storage, real ready/fallback timers, cross-pool fences, persisted journal recovery, replacements and restart. Test-only database seeding reaches the future battle, regroup and recovery boundaries without fabricating production gameplay.

No runtime test publishes a Worker. The user has separately confirmed deployed multi-device verification for steps 1–3. This session has not repeated it; cross-region latency, delayed/lost packets and free-tier load/quota measurements remain separate validation. Account access and health alone cannot establish these results.

## Step 4 presentation boundary

The approved presentation plan is in [STEP-4-PLAN.md](STEP-4-PLAN.md). React retains semantic controller controls and the existing transport/session lifecycle. The client-only PixiJS scene consumes client-safe shared projections and local asset metadata. Animation, layout resizing, asset loading and renderer recovery must not recreate sockets, replay admission, release claims, or decide authoritative phases.

The art pipeline produces transparent raster creature layers with calibrated normalized anchors, pivots, ordering and bounds for the existing BodySlot contract. Rendering accepts public CreatureView data without importing the server catalogue or inferring hidden DNA. Fixture compositions are confined to local development/tests. Since the current service projects no creature and no usable doses, the starter blob is explicitly atmospheric presentation, not an authoritative initialized specimen; unavailable gameplay remains clearly identified.

No service schema, wire version, rules defaults, Durable Object identities, domain routing, combat producer or DNA mechanics changed. The scene owns per-instance image textures and destroys them when its composition is replaced; it does not share texture ownership across scene lifetimes. Renderer initialization failure uses the same real layers in a static DOM composition. Motion preferences change animation without recreating transport. Source images and exact prompts stay outside the public directory; only optimized artwork and render metadata are shipped. Export compatibility informs the asset contract; actual card export belongs to step 7.
