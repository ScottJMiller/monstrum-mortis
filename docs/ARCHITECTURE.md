# Monstrum Mortis — architecture

Current contract: **room JSON 7, protocol 6, rules 0.6.0**, DNA 0.2.0/combat 0.3.0, presentation battle-v2-b2. [Approved flow](APPROVED-PLAN.md), [simplification](archive/release-closeout-2026-10-17/PHASE-D-SIMPLIFICATION-PROPOSAL.md), [actual status](IMPLEMENTATION-STATUS.md). The [pre-cutover architecture](archive/pre-simplification-2026-10-16/ARCHITECTURE.md) is retained as history.

## Durable boundaries

The same LaboratoryRoom, MatchmakingPool and GuestLease classes remain deployed through SQLite Durable Object exports and ROOMS/MATCHMAKING/GUEST_LEASES bindings. Assets remain on the same Worker/workers.dev origin. No namespace/class renames, paid service, storage wipe or domain changes.

MatchmakingPool's Americas object owns a bounded public forming-lab index and an idempotent creation journal. Allocate and persist the opaque l-UUID before calling the room; a lost create response cannot allocate another room on retry. Public projections contain only room label/ID, aliases/symbols, admitted count and formation deadline/revision. At most 64 labs are projected; allocation history/tombstones are bounded. Rooms publish persisted notices after releasing their event serialization queue, avoiding a pool→room→pool deadlock; notice revisions reject stale announcements. Idle refreshes renew index expiry without broadcasting unchanged projections.

Lab discovery uses a receive-only hibernating WebSocket with native ping/pong, closed while the page is hidden or entry unmounts. HTTP refresh is a 30-second fallback when that socket is unavailable. There is no per-frame/global room population scan. The directory never exposes a hand, token, guest ID, vote ballot, combat seed or hidden outcome.

GuestLease issues server aliases/symbols and secure bearer credentials. Epoch-6 authentication rejects pre-cutover guests. A fenced room/nonce lease prevents the same guest claiming two laboratories. Alias edits change only the room label, never identity. Room admission is serialized with votes/deadlines/capacity; a departed guest's tombstone rejects every future operation in that lab. Existing entries can recover only the original membership. New public IDs and browser storage keys separate this clean cutover from old private/public sessions.

LaboratoryRoom owns authoritative phases, timers, private hands/planned draws, action receipts, creature, frozen presentation and combat/results. It reloads/validates JSON from SQLite on each event. Persistent receipts bind action ID, principal and fingerprint: accepted and rejected replays retain their answer, and conflicting payloads fail. Room-state/receipt/next-alarm writes commit together before broadcast. Hibernating WebSocket attachments retain identity/liveness; reconnect tokens are hashed, and only their owner gets controller snapshots.

## Current HTTP/socket surface

- POST /api/guests: replay-safe guest issuance.
- GET /api/labs: bounded public directory; GET /api/labs/socket: mm-labs-v6 public projection stream.
- POST /api/labs: authenticated public creation with operationId and editable alias.
- POST /api/rooms/:l-id/join: authenticated forming-only admission with operationId/alias.
- GET /api/guests/session: authenticated recovery of the current room seat, including a lost admission response; stale claims release through their original fence.
- GET /api/rooms/:l-id/snapshot and /socket: bearer/subprotocol seat authentication; mm-v6 room socket.
- POST /api/rooms/:l-id/leave: authenticated, fenced departure when the room socket is unavailable.
- /api/health: capability/version/configuration projection; it is not a storage/multiplayer test.

Old private/code/display/admit/queue/pool paths return an expired-session response. No production fixture/debug endpoint exists. Same-origin enforcement, bounded JSON, runtime intent validation, per-IP entry/create limits, seat action/reconnect limits and eight-seat capacity remain. Old private/queue model helpers are retained only for historical regression fixtures; they are not external entry routes. Old room alarms expire the previous contract without continuing its gameplay.

## Formation, rounds and recovery

A 30-second lobby countdown starts with two connected members. Strict majority of currently connected members, or eight connected members, commits at most three seconds; no new admission during final countdown. Dropping below two before play reopens formation. Votes deduplicate by seat and action receipts. At start, lock connected participants/N and initialize private trays and a fresh named creature directly into a 75-second experiment. An admitted client that never connected before that first boundary is retired, not made a late-round spectator.

The shared deadline engine catches up chronologically, including delayed alarms. Grace is 15 seconds: a reconnect inside grace resumes existing eligibility; afterwards that seat cannot regain this round's injections. No fresh seat/backfill is admitted. Remaining connected members continue without pausing for a minimum of two; one can complete later rounds with 2/max(2,N) potency. Current N/parts never recalculate after departure. Zero connected members after grace closes the lab. Explicit Leave is immediate, irrevocable for that guest/lab and releases its fenced lease.

DNA catalogue/mechanics/slot competition and deterministic combat are unchanged. Freeze, battle-v2 descriptor/arena selection and authoritative timeline/result persist once before broadcast. Server-authored lab/per-round creature names are independent labels and persist through reconnect/restart. Autopsy readiness retains 10-second minimum/25-second fallback; three-round voluntary replay needs two connected opt-ins.

## Client projection and assets

App retains one room socket across render/audio/phase changes; exact pending intentions persist in sessionStorage for replay. Secure-byte UUIDs work on ordinary LAN HTTP. Versioned room/pending/guest keys expire old credentials cleanly. Connection failure probes the seat and retries without minting budgets; acknowledged or conclusively revoked Leave clears local room recovery. The editable player-name preference (mm.player-name.v1) is stored separately in localStorage, survives Leave/session expiry, and never grants membership or changes a recovered seat’s alias. Entry falls back to the generated guest alias when no nonblank saved name exists; storage failures do not block editing.

Chamber's Pixi and static projections share existing anatomical calculations and one outer camera crop. Decorative Pixi input is detached and artwork passes gestures through to native page scrolling; controls retain their own input. Mutation textures remain bounded. Private vial art/clues stay public and opaque. DNA rail selection auto-highlights a specimen but sends no action until Inject. Available actions pulse only when authoritative eligibility, connection and pending state allow; reduced motion uses static emphasis.

One per-device audio engine unlocks on completed touch/click or keyboard gestures, defaults on subject to saved preferences, fades master over half a second and retains limiter/ducking/eight voices. Pending resume cannot fence out later gestures; media decode/graph setup is deduplicated separately. Supported Apple browsers request the playback audio session without overriding device mute/volume or hidden-page suppression. Terminal typography measures its actual arena and loaded glyphs on resize, including the smaller wrapping winner line. Audio and rendering seek server time; no cosmetic delay changes deadlines. Desktop integration/battle uses viewport-bounded flex/grid with uniformly contained SVG artwork and visible health/caption/control rows; ordinary overflow remains scrollable. Integration/battle viewport takeover, compact result disclosures and persistent Next controls are CSS/UI projections. All approved art/provenance, integrated pose registration and sole effect registry remain intact. Development galleries/fixtures/masters remain excluded from production.
