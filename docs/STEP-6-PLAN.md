# Step 6: automatic combat and three-round sessions

The user declared step 5 complete and authorized step 6 only on 10 October 2026. This records the implementation decisions within the already-approved design; no additional approval is required. Step 7 cards/cabinet/naming, step 8 audio/signals and deployment remain outside this authorization. The user previously reported deployment of step 5. No production deployment or DNS changes occur in this work.

## Delivery

The existing 8-second briefing, private four-specimen trays, six doses, 6-second cooldown, 75-second experiment and 5-second release stay unchanged. Release retains **“Creature released. Prepare for combat!”**. It now leads to a real automatic battle, autopsy and three-round session results. Each new round begins with a new authoritative blob and private hand. Private hosts advance and replay; public rooms keep their 25-second results, 10-second early-ready minimum, explicit replacements/recovery and 30-second regroup.

A session selects three different rivals using private entropy before its first briefing. The six are Iron Widow, Gutter Seraph, Carrion Duke, Coil Saint, Maw Engine and The Unfinished. Each briefing displays the actual rival silhouette and one meaningful strength/weakness. Rival strength is fixed by round, not the observed team's mutations or a desired outcome.

## Versioned calibration

- Rules **0.3.0** introduce combat calibration. All 30 DNA definitions, caps, signed deltas, draw distribution, 2/N scaling and reinforcement rules remain catalogue **0.2.0**.
- `catalogue/combat.ts` pins combat version 0.3.0, 100ms simulation steps, 1-second status ticks, 1.2-second opening, 2.4-second baseline cadence (900–4,000ms bounds), hit bounds 55–97%, dodge cap 25%, armor reduction cap 55%, damage spread 90–110%, mishap cap 28%, 30-second maximum and 512-event hard bound.
- `catalogue/rivals.ts` pins six actual stat/ability sets. Vitality, power, regeneration and ability magnitude use round multipliers **0.75 / 1 / 1.25**. Other archetype stats remain fixed. These tables target the normalized full budget; they never inspect realized spending to adapt difficulty.
- Poison/bleed replace their existing status on reapplication, retain a finite lifetime and tick once per second; application is distinct from observed damage. Acid temporarily reduces protection. Electrical discharge follows every third landed strike. Contact/shard retaliation cannot recursively retaliate.
- Cadence/agility determine bounded attack spacing. Accuracy changes hit chance; teeth create a one-second vulnerability after a miss. Tremor can shorten the next cadence. Soft paws reduce mishap damage and shorten recovery after misses. Existential lost turns and instability mishaps emit distinct events.
- Roar, hooks and crawling distraction share a per-target control budget of at most **35% of 30 seconds**, plus **5 seconds of immunity after each completed control interval**. Tail resistance reduces actual duration before applying the budget. Attacks delayed by control resume without building a queue.
- Candle Flesh melts at 12 seconds and leaves a two-second slowing slick. Wandering Limb detaches at 12 seconds, may distract once during its seven-second hazard lifetime, and loses its attached mechanics. Porcelain Teeth shatter at 18 seconds; contact shards persist for three seconds. Removing these parts recomputes active stats/abilities, removes their rendered anatomy and prevents later attacks from using it. The release portrait remains immutable. A remaining core is rendered only if a melted body leaves no active body; an intact skeleton is not replaced.
- Same-tick scheduled attacks resolve as one exchange, permitting mutual knockout. Death prevents later ticks/attacks/resurrection. At expiry compare health percentages rounded to **0.01 percentage point**; equal rounded percentages and mutual knockout draw. Strong builds may knock out a rival earlier than 20 seconds.

These are initial implementation values. The seeded simulation report establishes bounded behavior and comparative difficulty, not human-validated balance or Cloudflare CPU/quota usage.

## Authority, persistence and compatibility

The room freezes once at release. At the release deadline a synchronous pure producer consumes that frozen record and a private seed, computes the complete chronological timeline and result, and persists both atomically with the battle deadline. There is no per-frame server loop. Battle completion commits exactly one result and 100/50/0 team points. It completes after disconnection and chronological alarm catch-up, including after reactivation/restart.

Public snapshots expose the identical timeline/start time, public rival information, health percentages and event frames. They exclude the private seed, private hands and unrevealed result. Numeric creature stats/trait details are projected at autopsy; previously completed results remain available during later rounds. A full chronological event list inherently lets an inspecting client derive its eventual outcome; the explicit result/score still commits only at its deadline. No browser can submit outcomes.

Room JSON becomes **schema 5**, preserving deployed SQLite classes/namespaces, credentials, leases, private hands, budgets, deadlines and SQL receipts. Schema-4 active attempts retain rules 0.2.0 and their frozen boundary; they are not retroactively assigned a rival or rerolled battle. Private hosts can explicitly start a fresh combat session from that boundary; public players leave and choose Quick Play. A new ordinary round enables combat. Schema-2/3 migration retains its existing service-only behavior. Unsupported/corrupt combat versions, rival orders, events or result deadlines fail closed rather than rerolling.

Protocol **5** is justified by battle/result wire contracts and required `battleId` / `sessionId` fences on private advance/replay. Room and queue subprotocol names derive from that version. Existing credential/guest storage keys are retained. Clients reload for the new protocol; v4 pending requests are not replayed with a modified fingerprint. New pending mechanics requests use the same v5 action ID/payload across reconnect/reload and retain existing SQL replay protection.

The legacy binding-only completion method remains for isolated migration/orchestration fixtures. For a real generated battle it accepts only that persisted battle's ID/outcome after its deadline; production completion runs internally. There is no debug or completion HTTP endpoint.

## Results and observed commendations

Team victory/draw/defeat give 100/50/0, without timing or spending bonuses. Three-round totals remain 0–300. The six approved commendations qualify only with observed evidence, share ties, and allow multiple categories per contributor.

Positive active stat contributions split damage/protection/healing credit according to their surviving normalized weights and bounded contribution amount. Negative active deltas adjust the unattributed baseline; discarded and detached parts receive no new active-stat credit. Baseline damage remains unattributed. Ability damage/control uses its active source weights; already-applied finite statuses/hazards retain their original attribution. Liability/cosmetic awards count actual accepted doses, including overwritten history. Malfunction evidence counts weighted observed events, not speculative responsibility for a victory. Everyone gets a personal contribution summary; there is no ranked individual scoreboard. Late seats earn no earlier personal credit.

Autopsy reveals release stats, trait descriptions/numbers and active/replaced/detached status. Session results show the three outcomes and cumulative observed evidence. Display-only devices see team results and commendations with no private summary or progression permissions.

## Presentation and real artwork

Six actual transparent rival sprites are produced with the built-in imagegen skill during development. Masters, exact prompts, tool, origin and hashes live in `assets/rival-provenance.json` and `assets/source/rivals`; same-origin optimized WebP totals 382,750 bytes. `scripts/prepare-rivals.py` rebuilds derivatives from retained masters. No runtime AI, new service, dependency or required user asset is introduced. Existing blob/mutation/chamber sources and calibration remain unchanged.

Battle uses the same anatomical projection, pivots, mirroring, color matrices and layering as the chamber. Ground-aligned SVG anatomy avoids another Pixi engine/texture cache. Timestamp seeking updates directly to current health, anatomy and conditions; captions show only the latest three events and motion only decorates an 800ms recent window. No animation backlog affects state. Lunges, recoil, a restrained impact-camera move, electrical effects, restraint, healing, malfunctions, detached anatomy, status badges and knockout accompany text/health. Reduced/paused motion keeps all events readable with the camera still. Art failure reports an actionable retry and leaves health/control access available. The spent private tray is hidden during battle/results. The existing chamber remains mounted and paused, preserving lifecycle/cache ownership; resize or motion never recreates sockets.

Desktop, portrait/landscape phone and display use complete battle views. Scrollable trait/event records are keyboard focusable. `/combat-gallery` exists only in Vite development, with six authoritative fixture timelines and a seek control; no production debug endpoint is added.

## Verification matrix and reproducible commands

- Existing service, admission, matchmaking, recovery, fresh-cohort, DNA/privacy and calibrated art suites remain required.
- Pure producer tests: deterministic seeds, all 30 mutations, signed replacement/partial limbs, baseline and normalized contribution weights, 2–8 players, caps/immunity/finite hazards, damage/regen/malfunctions, ties/draw/KO, private fences, immutable freeze, migrations/corruption and direct playback seeking.
- Independent local network clients: actual first 8/6/5-second boundaries and battle alarm; duplicate actions, display/nonhost authorization, late seat, seed privacy, SQLite eviction/restart, three private/public rounds, readiness/regroup and eight clients spending 48 doses each round. Later fixture deadlines are shifted coherently in isolated SQLite to keep tests short; no production clock override exists.
- Browser controls: actual selection/injection/switch, keyboard host advance, private results/replay, synchronized playback with a skewed clock, reload mid-battle, reduced/static rendering, no resize socket churn, viewport/overflow checks, WCAG scans and actual screenshot review of six rivals.
- 4,536 seeded simulation cases cover all six rivals, rounds and player counts using random/tactical/cosmetic full-budget builds. The JSON report records outcomes, duration/event limits and local Node timings; it makes no deployed capacity claim.

```sh
npm run check
npm run build
npm run deploy:dry
npm run test:step6
```

Focused commands are `npm run test:combat`, `npm run test:combat-browser`, `npm run simulate:combat`, and `npm run test:composition`. Browser scripts use installed Chrome/Chromium (`MM_CHROME_PATH` override). `npm run dev` exposes `/combat-gallery`; fixture generation is `node scripts/prepare-combat-fixtures.mjs`. Actual completed checks and remaining device/deployment gaps belong in IMPLEMENTATION-STATUS.md.
