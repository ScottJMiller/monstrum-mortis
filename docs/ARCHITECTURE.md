# Room service architecture (step 2)

One repository, one Cloudflare Worker, one static client origin. The user deployed the step 1 foundation to https://monstrum-mortis.scott-jeffrey-miller.workers.dev. This working tree adds step 2; it has not been published in this session. There are no custom-domain routes or paid dependencies.

## Stable infrastructure

| Binding | Class | Responsibility |
| --- | --- | --- |
| `ROOMS` | `LaboratoryRoom` | SQLite room state, admission, seats, reconnect authorization, phases, alarms and hibernating WebSockets |
| `MATCHMAKING` | `MatchmakingPool` | Inert until step 3: regional queues and ready checks |
| `GUEST_LEASES` | `GuestLease` | Inert until step 3: atomic cross-pool guest claims |

Class identities and `wrangler.json` exports remain unchanged. Use the existing declarative `exports` with `storage: sqlite`; do not mix in legacy migrations. The `ROOMS` namespace also contains a bounded control instance named `control:private-entry`. It limits anonymous creation/join attempts and retains private creation keys; it is not a matchmaking coordinator. Room objects are keyed `room:<invitation-code-or-public-id>`.

`room_state` stores one explicit server-only schema-2 JSON record in SQLite. SQL tables also retain action receipts, rate windows, and creation mappings. Schema 1 existed only as an inert foundation TypeScript interface and was never persisted. Unknown stored versions fail closed; future structural changes need a real migration. Each event reloads state from SQLite, and socket attachments identify the authenticated session after hibernation. A per-object promise queue serializes async token derivation and event handling. State, action receipts, and the next alarm commit together in a SQLite storage transaction before acknowledgement.

## Browser API

| Route | Method | Authorization and behavior |
| --- | --- | --- |
| `/api/health` | GET / HEAD | Binding diagnostic; reports `stage: room-service`, protocol 2, rules 0.1.0, `roomServiceAvailable: true`, `gameplayAvailable: false` |
| `/api/rooms/private` | POST | `{ operationId, alias, presentation }`; creates host seat and collision-checked six-character invitation |
| `/api/rooms/:id/join` | POST | Private invitations only; `{ operationId, alias, role: player \| display }` |
| `/api/rooms/:id/admit` | POST | Public reservations only; `{ operationId, reservationId, admissionToken }`; no user-controlled alias |
| `/api/rooms/:id/snapshot` | GET | `Authorization: Bearer <reconnectToken>`; public state plus only the caller's controller |
| `/api/rooms/:id/socket` | GET upgrade | `Sec-WebSocket-Protocol: mm-v2, token.<reconnectToken>`; confirms `mm-v2` only |
| `/api/rooms/:id/display` | POST | Authenticated participant requests `{ operationId }`; returns a separate display credential |

Clients cannot call internal Durable Object routes or allocate public rooms. Cross-origin browser requests fail; the local Vite origin is allowed only on local hosts. No tokens go in URL query strings, invitation links, public state, or logs. JSON bodies are streamed with a 4 KiB maximum; socket messages must be text JSON at most 2 KiB. Names have a bounded character vocabulary. Intents have exact field validation, a random UUID action ID, and the current protocol version; supplied player IDs, phases, stats or outcomes are rejected.

An entry response contains a secret reconnect credential, public snapshot, and the owner's controller (null for displays). The browser keeps its credential in tab-local session storage. Independent browser profiles/devices have independent credentials. Invitation links contain only the room code, with an optional `display=1` presentation hint. A display credential grants viewing only and does not consume a player seat or become host; it can synchronize or leave. Public display issuance requires an admitted participant. Browser storage refusal is reported; losing the credential loses automatic identification of that seat.

Creation/join `operationId` values must be unpredictable UUIDs and kept private: retrying the same entry key returns the same credential. Only their hashes and request fingerprints are stored. Reconnect tokens are derived with HMAC from a private per-room secret and stored as SHA-256 hashes for verification. Reusing a key with different details fails. These are anonymous bearer credentials, not person-level identity. Private invitation codes are conveniences, not strong authentication.

Limits: 5 creations and 30 creation/join/admission attempts per source IP per minute; 10 connection attempts per seat per minute; 30 socket actions per seat per 10 seconds; 4 display grants per issuing seat per minute. A room permits eight live player seats, four display sessions and 128 total historical admissions. Each seat retains up to 1024 mutating-action receipts for the room lifetime; new mutations are rejected at that limit rather than discarding replay protection. Sync requests are not retained. Anonymous entry limits have bounded storage and expire. Shared-IP groups share entry limits; these limits need measurement before public launch.

## Phases and reconnect

The private host starts with at least two connected players. Server deadlines and alarms progress `lobby → briefing (8s) → experiment (75s) → release (5s) → battle`. Delayed callbacks settle deadlines chronologically. The player count locks when the experiment begins; late private invitees occupy a waiting seat, watch, and cannot inject in that attempt. Rejected or duplicated actions cannot change deadlines. The host advance intent is phase/role checked, but autopsy cannot yet be reached because the combat producer is not implemented.

**Step 2 stops at the battle boundary.** There is no simulated creature, tray, injection, switch, battle outcome, score, card, or timer pretending to complete combat. Production DNA mechanics are step 5 and battles/results/three-round completion step 6. Empty controller trays and zero budgets explicitly reflect this boundary. Room snapshots advertise `mechanicsAvailable: false`.

A disconnect preserves the seat for a 15-second grace while the round timer continues. At grace expiry the seat is finished for the attempt. Returning later permits viewing but does not undo that flag. Private host ownership transfers to the remaining player with the longest current connection; display sessions are excluded. Explicit leave revokes that credential immediately, frees capacity, and preserves historical seat records for future attribution.

During an experiment, fewer than two connected eligible players after grace suspends the remaining time for 30 additional seconds. Returning eligible players resume that remaining duration. Failure to recover abandons the attempt and returns private rooms to a host-restartable lobby; public rooms enter a recovery boundary that step 3 will drive. A battle already reached is not rewound by departures. Alarms manage deadlines, disconnected seats and idle expiry, rather than per-second updates.

Only one socket owns a session. A second live connection fails unless the user explicitly confirms replacement (`?replace=1`, with no token in the URL). The old socket closes and stale callbacks cannot disconnect the replacement. The console offers explicit reconnect and replacement controls and reuses pending action IDs after reconnect. Auto-response `ping`/`pong` supports hibernation; a 60-second stale-transport check detects lost clients. Heartbeats alone do not renew participant activity. Accepted activity and authenticated synchronization renew idle lifetime; the 24-hour hard maximum never extends.

Room secrets, snapshots and action receipts are removed after two hours without participant activity or 24 hours total lifetime. A minimal expiry tombstone remains until two hours after the original maximum lifetime, then is cleaned. Local/downloaded records in future milestones are independent of server expiry.

## Public admission contract (no queue yet)

`allocatePublic(PublicAllocation)` and `cancelPublicReservation(allocationId, reservationId)` are binding-only methods. Allocation requires 2–8 distinct guest and reservation UUIDs and an opaque public room ID. Repeating identical allocation returns identical grants; changed allocations fail. Grants expire after the existing 10-second reservation/ready-check interval and allow one entry key to consume each grant. Admission retries return the same seat. A guessed public room ID or private invitation request cannot admit a guest.

Cancellation serializes with consumption and revokes a seat even if consumption raced first. Step 3 must own confirmation, lease checks, cancellation reconciliation, authored public aliases, activation, public timers/recovery and replacement admission. There is no regional queue, guest identity issuer, cross-pool lease authority, public round activation or automatic public replay in this milestone. Guests can create separate private-room identities until step 3 introduces guest leases; do not claim cross-room identity uniqueness now.

## Verification

`npm run check` validates configuration, client/server types and deterministic room tests. `npm run test:rooms` also builds, performs a deploy dry run, and starts an isolated local workerd/Miniflare runtime using Wrangler's locked dependency. It uses separate network WebSocket clients and temporary persisted SQLite storage, exercising actual alarms, hibernation eviction and restart. This proves local operations, not deployed account access, production routing, real-device behavior or free-tier capacity. A human two-device test and deployed room-service verification remain required before claiming production multiplayer.

Implementation references: [Cloudflare hibernating WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [SQLite storage and transactions](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [alarms](https://developers.cloudflare.com/durable-objects/api/alarms/).
