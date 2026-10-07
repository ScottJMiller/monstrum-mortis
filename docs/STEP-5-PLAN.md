# Approved step 5 plan: authoritative DNA, mutation and release

Status: **approved by the user on 7 October 2026**, with the release message changed to “Creature released. Prepare for combat!”. On 7 October 2026 the user confirmed steps 1–4 complete, pushed and deployed, steps 1–3 tested on multiple devices, and step 4 presentation reviewed. The user authorized step 5 only and explicitly required approval of this implementation and verification plan before building. The user also authorized running the scripts needed to complete step 5. The specification below is the approved implementation scope; actual results are recorded in IMPLEMENTATION-STATUS.md.

## Delivery boundary

Deliver an actual shared creature, private four-specimen trays, six injections per eligible player, six-second cooldown, all 30 mutations, server-owned replacement/stacking/scaling, attributed public changes, and the deliberate Unleash switch. Preserve the existing eight-second briefing, 75-second experiment, five-second release, admission, queue, recovery and display behavior.

Production ends at `battle` with an immutable released specimen and a clear “Creature released. Prepare for combat!” message. Do not generate a battle seed/timeline, rivals, fabricated results, score, awards, autopsy disclosures, card exports or cabinet. Existing trusted public completion/progression hooks remain available for regression fixtures and future step 6 integration; no browser completion route is added. No deployment is authorized. Cloudflare Free, SQLite infrastructure identities, workers.dev-only routing and existing apex/www hosting remain unchanged.

## Historical findings before implementation

| Area | Existing foundation | Step 5 gap |
| --- | --- | --- |
| Catalogue | 30 unique DNA IDs: 15 tactical, 7 cosmetic, 8 liability; names, logical slots and prose intent | No numerical effects, typed abilities, clues, conflict rules, stack curves or caps |
| Room model | Schema 3; fixed player-count boundary; phases/grace/recovery; participation hooks | No authoritative creature, private tray/draw sequence, injection history, distinct switch state or frozen combat input |
| Actions | Validated `inject`/`pull-switch` shapes, serialized events, principal-scoped SQL receipts | Handlers reject mechanics; no attempt fencing; private controller frames lack revision/attempt IDs |
| Presentation | Public CreatureView adapter, all 30 WebPs, fallback, responsive layouts, reduced motion | No real tray controls/readings; chamber recreates its renderer whenever parts change |
| Artwork | 34 provenance records and source masters, 30 mutation modules, calibrated anchors/order/mirroring | Five specimen-clue assets remain planned; one appearance per mutation, no authored shape variants |

The planning review verified all 34 source hashes and main derivative byte counts and confirmed all 30 mutation files exist. Twelve logical catalogue slots differ from their art attachment slots. Use a server-side mapping between mechanical ownership and visual placement; do not blindly put the logical slot into MorphologyPart or relabel provenance to hide these differences.

| DNA | Catalogue slot | Produced attachment slot |
| --- | --- | --- |
| Titan Fibers | body | skin |
| Auxiliary Heart | body | appendages |
| Venom Glands | mouth | appendages |
| Storm Organ | appendages | head-growth |
| Acid Bladder | body | appendages |
| Bellows Lung | body | skin |
| Mourning Veil | appendages | skin |
| Candle Flesh | skin | body |
| Wandering Limb | forelimb-right | forelimb-left; right mirroring supported |
| Tremor Ganglia | body | appendages |
| Excessive Viscera | body | appendages |
| Existential Organ | body | appendages |

## Server state and round initialization

Add a deterministic mutation/dealing domain module under `src/server`, separate from transport and public types. Supply entropy and time from the Durable Object; tests supply fixed draws/time. Never import hidden catalogue data into the client.

Each new attempt has an opaque UUID, catalogue/rules version, same baseline blob, ordered history, active mechanical groups and public anatomy. Starting briefing creates a fresh creature/attempt. At the briefing-to-experiment boundary, lock N to the connected eligible cohort exactly as today, initialize their private trays/draws and six doses, reset accepted-injection/interaction counters and switch flags, and start the existing timer. The fresh public cohort joining before briefing ends is included; displays and waiting seats are excluded. An alarm arriving late catches up against the persisted scheduled deadlines, without gifting extra experiment time.

Persist, per eligible player: four opaque specimen UUIDs with hidden DNA IDs, a six-replacement draw plan, cursor, remaining doses, cooldown deadline, accepted injection count, explicit switch flag and completion reason. At most 48 injections per attempt and 144 per ordinary three-round session bound history. Retain only the current attempt's mutation history in this milestone; restarting an abandoned attempt discards its hands/history, while bounded principal/action receipts retain replay results. Preserve historical contributor identity within the current history even if its seat leaves.

An attempt restart after abandonment creates a new blob, draw plan and attempt ID. Reconnection during the same attempt restores the exact hand, budget, cooldown, finish reason and latest anatomy. It never deals again. The fixed N survives departures and late returns; waiting seats receive nothing usable until a new eligible boundary.

## Private dealing and consistent clues

Use the approved 50% tactical / 25% cosmetic / 25% liability distribution, then choose uniformly within the selected family. Duplicate types are allowed. Prepare four initial draws and six replacement packets server-side before the player's first injection. Each packet contains a weighted primary draw and a precomputed safe fallback drawn from tactical/cosmetic families with their relative 2:1 weights. If the initial tray is entirely liabilities, replace its fourth draw with a safe draw. On injection, examine the actual three remaining cards: if the primary replacement would make the tray entirely liabilities, use that packet's fixed fallback. This works regardless of which card the player selects and uses no fresh random draw on retry. This safeguard deliberately changes the conditional distribution; it promises neither equal hands nor universally useful specimens. There is no discard, reroll or unused-dose carryover.

Selection is local UI state; Inject sends only the chosen opaque specimen ID and current attempt ID. Each accepted injection removes that exact specimen, advances one replacement draw, creates a new opaque specimen ID in the same tray position, consumes one dose and starts a six-second cooldown in the same committed operation.

Give every type a stable, opaque clue key, accession label and non-spoiling accessible description. Author simple SVG specimen patterns in code/files using the five planned visual families (serrated, pulsing, branching, fuzzy, spiral), with distinct shape/texture/color combinations for all 30. Similar families span tactical, cosmetic and liability types. Do not show family usefulness, DNA names/IDs, mutation artwork, effects, numerical deltas, future draw order or seeds before injection. Motion is supplementary; static shape and text convey the same clue. Do not encode DNA IDs in accession numbers or specimen UUIDs.

These are original code-authored clues, with actual SVG sources, opaque client metadata and a separate provenance record. Mark the five clue manifest entries ready only after files and verification exist; retain generated-image provenance unchanged. No new raster generator, user-supplied art, paid service or credential is required. Consistent clues are intentionally learnable through play, not a promise to defeat inference by experienced players.

## Approved catalogue and numerical contract

The table below supplies the approved initial calibration; combat balance has not been validated. Values are server-only and associated with the active part. Step 5 calculates and freezes them; step 6 will implement their battle execution.

Baseline stats: vitality 100, power 10, protection 10, agility 10, regeneration 0, instability 0. Final bounds: vitality 40–240; power 2–40; protection 0–40; agility 2–24; regeneration 0–8 per second; instability 0–40. Accumulate signed deltas from active contributions, then clamp once; recompute from baseline whenever ownership changes, so saturation never leaves a residual replaced effect.

Every injection contributes raw potency `w = 2/N`. Positive effects, tradeoffs, liability penalties and ability potency all use that factor. Ability acquisition at eight players starts at one-quarter of its two-player magnitude, including control duration/proc magnitudes; it does not enable a full-strength attack just because the ability now exists.

For a repeated active type, sum normalized raw dose units u and use `F(u) = min(u,1) + 0.5*min(max(u-1,0),1) + 0.25*min(max(u-2,0),2)`. This gives progressively smaller gains, reaching an effective cap of 2 at four normalized units. Apply table values times F(u). The first dose uses exactly w; all later marginal gains follow this curve. Calculate using fixed precision rather than repeatedly rounding each injection; public readings are coarse bands, not this data.

For paired limbs, allocate half the contribution to each limb. Compute each limb's effect as `0.5*F(2*u_limb)`; sum surviving halves. This applies the same curve to a complete pair and removes exactly the replaced half's effects. Attribute active effects proportionally to surviving normalized contributor weights. Capped injections still consume doses and record a visible reinforcement/caption; they grant no extra mechanics.

| DNA | Logical ownership | Unscaled stat delta / typed ability data |
| --- | --- | --- |
| Titan Fibers | body | power +4, agility −1 |
| Spring Tendons | lower-limbs | agility +3; attack cadence bonus +0.08 |
| Razor Talons | both forelimbs | power +2; bleed 2 damage/second for 3 seconds |
| Guillotine Teeth | mouth | power +4; post-miss vulnerability +0.04 |
| Ossified Plates | skin | protection +4, agility −1 |
| Auxiliary Heart | body | vitality +16, instability +3 |
| Reweaving Tissue | skin | regeneration +1.5/second |
| Hook Tentacles | appendages | power −1; restraint duration +0.75 seconds |
| Venom Glands | mouth | poison 2 damage/second for 4 seconds |
| Storm Organ | appendages | instability +4; electric strike magnitude 5 |
| Acid Bladder | body | armor reduction magnitude 3 for 4 seconds |
| Barbed Hide | skin | protection +1; contact retaliation magnitude 2 |
| All-Seeing Cluster | eyes | vitality −8; accuracy bonus +0.04 |
| Bellows Lung | body | rival attack delay +0.5 seconds |
| Counterweight Tail | appendages | agility +1; restraint resistance +0.10 |
| Funeral Mane | head-growth | zero mechanical effect |
| Cathedral Horns | head-growth | zero mechanical effect |
| Mourning Veil | appendages | zero mechanical effect |
| Lantern Eyes | eyes | zero mechanical effect |
| Ink Bloom | skin | zero mechanical effect |
| False Halo | head-growth | zero mechanical effect |
| Too Many Smiles | skin | zero mechanical effect; audio deferred |
| Kitten Paws | both forelimbs | power −2; landing recovery bonus +0.10 |
| Candle Flesh | skin | protection −4; slowing-slick magnitude +0.10 for 2 seconds |
| Brittle Skeleton | body | vitality −16, agility +2 |
| Wandering Limb | right forelimb | power −2; crawling-distraction duration +0.5 seconds |
| Tremor Ganglia | body | accuracy bonus −0.06; accelerated-attack proc chance +0.08 |
| Porcelain Teeth | mouth | power −3; shard retaliation magnitude 1 |
| Excessive Viscera | body | vitality +12, agility −2 |
| Existential Organ | body | instability +5; lost-action proc chance +0.06 |

For damage-over-time, scale rate/magnitude while keeping the authored base lifetime; for control, scale duration/magnitude while keeping its authored triggering model for step 6. No unscaled damage or binary immunity is granted. Store explicit kinds, units, capped potency, base lifetime, cooldown constraints and attribution; do not serialize executable callbacks or invent battle events now.

Additional frozen-contract limits: accuracy bonus −0.25 to +0.20; cadence bonus −0.40 to +0.50; resistance/recovery bonuses 0–0.50; any proc chance 0–0.35; individual control duration at most 2 seconds; slowing at most 0.30; armor reduction at most 6. Retaliation is a bounded modifier, never recursive retaliation. The future combat producer must enforce at most 35% aggregate hard-control duty and a five-second same-control immunity window. Step 5 verifies these stored constraints/potencies; it cannot verify future battle behavior.

## Replacement, stacking and visible composition

Maintain nine logical slots. A different type replaces the current type in its target logical slot; the same type strengthens that active slot using the above curve. Razor Talons and Kitten Paws target both forelimbs as one injection with split effect ownership; Wandering Limb replaces the right only. Reinserting a paired type restores/replaces each hand independently. Other definitions retain their catalogue logical slot even if their art is attached elsewhere.

Replacement removes the old part's stat changes, abilities, penalties and active attribution. Its name, source player, sequence and superseded status remain in server/public mutation history. A cosmetic replacing a tactical part can therefore remove existing benefits, but contributes no hidden bonus or penalty of its own. Only active Candle Flesh/Wandering Limb prepare hazard capabilities; step 5 does not execute detachment, melt damage or persistent battlefield hazards. Replacing those sources removes their frozen capability.

Produce public MorphologyParts using the existing metadata's actual attachment slot/order/mirroring and `mutation.<id>` artwork. Keep the blob substrate unless a produced full-body part replaces its drawing; keep starter eyes/mouth only while their logical slots remain unmutated. A body-owned organ/muscle overlay retains the substrate. A skin-owned full-body Candle Flesh can replace the substrate drawing while other active overlays remain. If a full-body Brittle Skeleton and Candle Flesh coexist, use the body-owned skeleton as the base and Candle Flesh as a bounded translucent overlay, with an explicit public render-style descriptor, so both active changes remain visible. Test/calibrate that composition rather than covering an active part with an opaque second body. Separate ownership from drawing so overlapping chest/head/skin art does not accidentally compete mechanically. Bound active layers to baseline plus one per logical owner, including two hand layers, never one image per historical injection.

Repeated types enlarge their current drawing within a proposed 1.0–1.3 scale bound and receive a brief reinforcement accent even at the cap. Use the existing image and code animation/accent, not fabricated additional image variants. Keep distinct instance IDs, deterministic layer ordering and contributor metadata. Render/gallery tests must inspect overlapping logical body/skin/appendage combinations, mirrored hands, replaced starter features and maximum-size phone silhouettes.

Public changes carry an ordered mutation sequence, injection UUID, contributor ID/alias, revealed name, visible replacement/reinforcement caption and bounded current-attempt history. Exact effects and family remain server-only until the future autopsy; post-injection names are intentionally public. Present vitality/power/protection/agility/regeneration/instability as server-derived coarse textual bands and matching gauges, without exposing exact values, forecasts or battle outcomes.

## Injection, switch and exactly-once release

At serialized server handling start, capture server time and validate the authenticated current connection, player role, attempt ID, eligible seat, phase, recovery lock, deadline, tray ownership, doses, cooldown and unfinished state. Never trust client clocks, submitted DNA/slot/stats, another player's specimen ID or a client-supplied contributor. At/after the experiment deadline, new injections are rejected even if the client countdown says otherwise; settling still performs the real release.

Look up a matching principal/action receipt before new-action mechanics checks. Identical accepted retries return their recorded acknowledgment and latest snapshots without a new draw, cooldown, dose, mutation or release; reuse with different contents is rejected. Rejected actions keep their recorded rejection; a deliberate new attempt after cooldown uses a fresh action ID. Validate on a candidate state before committing, so a failure cannot persist a half-consumed injection. Commit candidate state, receipt and alarm together before acknowledgment/broadcast. Preserve existing guest-lease authorization, receipt/rate limits, cleanup and outbox ordering.

Unleash requires at least one accepted injection, current cooldown completed, an eligible unfinished player and the live experiment deadline. It sets a separate irrevocable switch flag, marks that player's round complete and forfeits unused doses. Six spent doses leave the switch unpulled and still require waiting for the last cooldown. Grace expiry/timer completion are separate finish reasons, not falsely displayed as voluntary switch pulls.

Route switch unanimity, disconnect/leave settlement and timer expiry through one idempotent `beginRelease` operation. It records the reason/time/attempt once, deep-freezes active anatomy, stats, abilities, normalized attribution and history, and schedules exactly five seconds from that authoritative release time. Duplicate switch actions or an alarm racing the final switch cannot replace the frozen record or extend release. Injections remain locked through release/battle.

Preserve fifteen-second grace, finished-after-grace viewing, waiting seats, fixed N and the existing thirty-second recovery pause/abandonment. During recovery, injections and switches are locked; successful reconnect resumes the remaining experiment time without undoing a grace-expired finish. Preserve the current minimum-player recovery precedence; waiting players/displays do not supply unanimity or prevent release. A completed release never rewinds for a disconnection.

Initialize/update `injectionsThisRound` and `interactedThisRound` from accepted gameplay actions. Mere rendering, heartbeat or local selection is not participation. Preserve accepted readiness interactions and the existing inactivity prompt/seat-expiry hook. Verify next-round resets/replay/recovery through the existing trusted completion fixtures, without wiring fabricated production outcomes.

## Persistence, protocol and health contract

| Contract | Approved change | Reason/compatibility |
| --- | --- | --- |
| Room schema | 3 → 4 | Persist attempts, hidden draws, active/frozen mechanics, completion reasons and version pins |
| Room migration | Explicit 2 → 3 → 4 and 3 → 4 | Preserve seats, token hashes, admissions, claims, receipts, phases, deadlines and score; unknown/corrupt schemas fail closed |
| Protocol | 3 → 4 | Require attempt ID on inject/switch; add revision/attempt context to owner snapshots; fence stale requests across abandoned/restarted attempts |
| Rules | 0.1.0 → 0.2.0 | First executable DNA numbers, baseline, curve and caps become versioned defaults; existing timing/budget/player defaults do not change |
| Asset manifest | Bump only when clue files become ready | Preserve generated masters and existing attachment provenance |
| Health | DNA-mechanics stage; mechanics available, combat unavailable, full gameplay unavailable | Distinguish usable injections from complete-game readiness |

Schema migration is an application record migration inside the existing SQLite-backed class, not a Cloudflare class rename or namespace migration. Legacy lobby/briefing rooms initialize real mechanics at their next experiment boundary. Legacy experiments/releases/battles retain their existing service-only attempt and deadlines, with room `mechanicsAvailable: false` and clear instructions; do not grant retroactive doses, reroll hands or restart their clock. Their next new attempt can use step 5. Preserve historical receipt payloads/fingerprints; reuse of a legacy action ID with changed wire contents conflicts rather than rerunning it. Return current-version envelopes on valid replay; never reinterpret old injection/switch rejections as new acceptance.

Pin catalogue/rules versions on each initialized attempt and frozen specimen. Reject unsupported stored mechanics versions explicitly. Never use the public composition seed to generate private hands; public visual entropy is independent of hidden draw entropy. Clear only matching stale pending client actions when a seat/attempt changes, preserving room/guest credentials and current claims.

Update shared types, runtime validation, client transports and test clients together. Use protocol constants for `mm-v4` and `mm-queue-v4` rather than scattered literals. Old protocol clients must reload with an intelligible message and retain reconnect credentials; do not silently release/requeue them. Test rejection of v3 messages/handshakes and successful v4 reconnection with the existing credentials. No additional infrastructure dependency is planned.

## Client and renderer integration

Introduce a controller component within App's existing session lifecycle. Four specimen buttons support keyboard selection, clear selected state, accession/accessible clues, and a separate Inject button. Show authoritative remaining doses, cooldown, pending acknowledgment and Unleash eligibility/reason. Disable new intentions while disconnected, recovering, waiting or unresolved; no optimistic mechanical mutation. Keep the selected card on rejection if it still exists; after acceptance select nothing and focus a stable control with a concise replacement announcement.

Persist the exact unresolved injection/switch intent in tab storage, scoped to room/seat/attempt. Reconnect/reload retries that same action ID after synchronization rather than creating a second injection. Matching controller revision/attempt prevents stale private snapshots from regressing the tray, and a late acknowledgment cannot unlock controls before the corresponding state arrives. Storage failure remains visible and does not reset identity. Explicit leave/forget and connection replacement remain deliberate.

Roster activity derives from accepted injection count, cooldown deadline and completion reason. Mutation captions carry actual attribution; keep a readable log without constantly announcing timer ticks. Displays receive public anatomy/readings/roster/captions, never a tray, cooldown budget controller or action controls. Replace “Start laboratory preview” with an accurate start label once mechanics exist; retain unavailable-combat messages across every device.

Refactor Chamber to retain its renderer across anatomy updates, diff sprites by stable part IDs and keep bounded texture ownership/cache. Async image loads carry generation/revision checks: an older composition cannot overwrite a newer one. Show the latest public state immediately using existing loaded/static layers while new artwork decodes; report loading errors separately from room errors. Coalesce closely timed accents into one short animation targeting the newest composition. Do not replay a history animation queue on reconnect. Motion off uses direct anatomy updates; graphics failure uses the identical new part list. Resize, clue loads and art retry must never replace sockets or repeat admission/injection.

Retain prominent phone/desktop/TV chambers, 44-pixel targets, focus, textual clues/readings, reduced motion and existing static fallback. Measure updated bundle/art payload and repeated-mutation texture/resource lifecycle; report headless versus actual device performance separately. Audio remains deferred.

## Implementation order after approval

1. Complete and validate server-only catalogue, ownership/art mapping, typed effects/caps and clue provenance; add deterministic domain tests before transport integration.
2. Add schema-4 migration/version pins, attempt initialization, private draws/projections and frozen release record.
3. Implement candidate-state injection/switch operations, replay-safe transactional receipts, phase/recovery/participation integration and protocol-4 validation.
4. Integrate private controls, persistent pending actions, public captions/readings and display isolation; update renderer to coalesce live anatomy changes.
5. Run independent-client backend/browser verification and every relevant existing suite; document actual results, limits and human-device checks. Stop locally at the frozen battle boundary; wait for separate deployment/step 6 instructions.

## Verification matrix

| Layer | Required evidence |
| --- | --- |
| Catalogue/domain | Exercise all 30 definitions; verify actual art mapping, clues, every signed effect/ability, cosmetic zero effects, replacement with no residual saturated stats, paired-hand partial replacement, reinforcement/caps and normalized attribution |
| Dealing | Fixed-entropy sequences/packets, distribution weights, all-liability safeguards for every selectable card at every tray step, four cards after every acceptance, six consumed replacement packets, no reseeding on reload/eviction, no free reroll |
| Scaling | N = 2,3,4,5,6,7,8; first ability acquisition and signed penalties scale by 2/N; equal normalized same-trait dose sequences yield equal effects; diminishing/capped comparisons and fixed N after leave/late join |
| Exact boundaries | Pure time-controlled tests at cooldown −1/exact/+1 ms, experiment −1/exact/+1 ms, switch minimum/cooldown/zero doses, grace/recovery boundaries; delayed alarms preserve scheduled 75/5-second durations |
| Independent runtime clients | Real HTTP/WebSockets and SQLite, at least 2/4/8 players plus display; simultaneous injections from different seats, same-seat competing actions, duplicate/mutated IDs, stolen specimen, waiting/display denial, synchronization of accepted anatomy/history |
| Release | Last switches concurrently, duplicate switch plus timer race, grace/leave versus unanimity, spent-six without auto-switch, exactly one frozen record/five-second release, injection lock and immutable battle boundary |
| Persistence/recovery | Live hibernating eviction, full Miniflare restart, accepted lost-response retry, rejected retry, tab reload, temporary disconnect within/after grace, paused recovery/resume/abandon, attempt fencing, schema-2/3 fixtures in all relevant phases, preserved admission and claim credentials |
| Privacy/security | Inspect HTTP/WS projections and production client bundle; no other hands, future draws, hidden deltas/abilities, internal seeds, raw persistent records or secret tokens in public messages; strict input/role/connection authorization |
| Real browser controls/art | Click/keyboard-select then Inject, replacement/cooldown/dose/switch feedback, failed/lost acknowledgment recovery, all 30 authoritative compositions, fast concurrent anatomy changes, max stacks/overlaps/mirrors, reduced motion, forced graphics fallback, failed/slow art, unchanged socket count |
| Accessibility/layout/performance | Axe on new tray/experiment/release/display states; logical focus and live announcements; 320px/phone/tablet/desktop/TV/zoom; measured bytes and bounded texture lifecycle; identify untested physical-device frame rates/manual screen readers |
| Existing regressions | Private room service, public queue/lease/allocation/progression, recovery, late fresh admission, leave→rejoin/create, presentation/motion/fallback and all art fixtures |

Keep all deterministic time/entropy/storage seeding in isolated tests, not a production forced-DNA endpoint or client-accessible debug menu. Runtime tests use actual independent network clients and temporary SQLite. Exercise at least one real six-second cooldown, the existing real experiment/release timers and an early unanimous release; boundary fixtures supplement rather than replace wall-clock checks. Tests compare canonical current creature/revision/frozen identity across clients; they do not claim battle correctness.

Run `npm run check`, `npm run build`, Worker dry run, `test:rooms`, `test:matchmaking`, `test:recovery`, `test:fresh-admission`, `test:presentation` and `test:art`. Add proposed `test:dna`, `test:dna-browser` and `test:step5` commands to collect the new domain/runtime/browser checks after approval. Update existing service-only assertions for initialized mechanics without dropping their original admission, privacy or persistence coverage. Production has no automatic completion despite seeded completion fixtures. Record exact passed counts, failures/corrections, benchmark scope and `git diff --check`; no tests deploy.

## Human-device checklist after a separately authorized deployment

1. Two real devices join privately; select then inject different clues and confirm identical anatomy, contributor captions and private hands. Repeat through Quick Play, including a third client's delayed briefing connection.
2. Spend six doses on one device; confirm six-second cooldowns, no seventh injection and no automatic switch. Pull Unleash only after cooldown; verify no further injections and one five-second release after everyone finishes.
3. Reload/sleep a phone during a pending injection and during cooldown; reconnect within grace and confirm no double spend/reroll. Return after grace and confirm viewing-only behavior for that attempt.
4. Join privately after experiment start and open a TV display; confirm no unauthorized tray/injection/switch and matching latest creature/readings.
5. Check portrait/landscape, reduced motion, keyboard/screen reader and static/slow-art behavior. Verify the frozen creature persists at the explicit combat-pending boundary, with no fabricated result or complete-game promise.

## Historical planning-session checks and remaining limits

The initial working tree was clean. With Node 24.21.0, `npm run check` passed configuration validation, both TypeScript projects and all six existing test files; `npm run build` passed. The provenance/file integrity checks above passed. These verify the existing steps 1–4 source baseline, not any proposed mechanics. That planning turn did not rerun runtime/browser suites, independently verify the deployed origin, test human devices or deploy.

The paragraph above records the planning baseline before approval. The approved numerical calibration, live mechanics, original clue files, schema/protocol changes and rendering updates are now implemented locally; actual implementation checks are recorded in [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md). Step 4 physical-device frame-rate/manual accessibility, existing development-tool audit findings, network-loss/latency/load/quota benchmarks and later combat/card integration remain separate outstanding evidence in IMPLEMENTATION-STATUS.md. The user's review establishes step 4 presentation acceptance, not unreported device/performance measurements.
