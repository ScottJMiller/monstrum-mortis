# Monstrum Mortis — Final Plan for Approval

Status: approved by the user on 5 October 2026. Step 1 implementation authorized. Remote play is primary; public matchmaking, private room codes, and optional shared display are included.

## 1. Product and first-release scope

Monstrum Mortis is a real-time browser party game for 2–8 players using their own devices, designed primarily for people playing from separate locations. Everyone contributes mysterious DNA to one shared monster in a prominent containment chamber. The group releases that monster against a rival laboratory's creation, watches an automatic battle, and receives a team result and personal awards.

The atmosphere is sinister, decayed Frankenstein-era science with eldritch details, grotesque comic mutations, and dry institutional humor. The creature, its transformations, and player reactions are the primary experience.

First release: one shared-creature mode, public Quick Play matchmaking, private laboratories joined by code or invitation link, optional shared TV/browser display, three rounds per session, 30 DNA types, six rival archetypes, synchronized mutation and battle events, preset team signals, personal commendations, per-device sound controls, reconnect support, and downloadable tarot-style monster cards. No login is required to play. Public matchmaking assembles a cooperative laboratory; battles remain against authored rival creatures, not another matched human laboratory.

Individual-creature competition, team-versus-team laboratories, competitive ranking, friend-party public queueing, accounts, cloud collections, playable saved monsters, free-text chat, integrated voice/video, and runtime AI generation are outside this release. Friends can play together in private code/link rooms from any location. Private rooms never enter public matchmaking.

## 2. Exact round and injection rules

A round is one complete experiment: a fresh blob, an injection period, a release, one battle, and results. A session contains three rounds and therefore produces three different monsters. Bodies and DNA do not carry into the next round; team score and player award history do.

Each player receives six doses PER ROUND, not one. Each dose permits one specimen injection. A player can therefore inject up to 18 times in a three-round session.

| Rule | Default |
| --- | --- |
| Players | 2–8; display-only devices do not count |
| Rounds per session | 3 |
| Build timer | 75 seconds per round |
| Personal specimen tray | 4 specimens |
| Injection allowance | Up to 6 per player per round |
| Cooldown | 6 seconds after each accepted injection |
| Injection action | Tap a specimen to select; tap Inject to commit |
| Switch label | Unleash the Creature! |
| Early switch eligibility | After at least one accepted injection |
| Switch consequence | Irrevocably ends that player's injections for the round |
| Release trigger | All eligible participating players have ended, or time expires |
| Release sequence | 5 seconds; injections locked |
| Automatic battle | Approximately 20–30 seconds |
| Results | Public: 25 seconds, with early advance after 10 seconds if all active players are ready; private: host advances |

The six doses are an upper limit, not a requirement. Players may stop because they like the creature, dislike their remaining choices, or distrust further experimentation. Unused doses disappear at the end of the round; they do not produce points or carry over. Using every dose does not automatically pull the switch. The switch remains a deliberate ritual, with a clear prompt when the player has no doses left. Time expiry prevents the group being held up indefinitely.

Example: with four players, the creature may receive up to 24 injections. A player who injects twice and pulls the switch forfeits their remaining four doses. Other players can keep injecting. The creature is released when they all finish, or when the 75 seconds end.

Players may use the full timer without injecting; expiry still releases the creature. A zero-injection player cannot prematurely pull the switch. Disconnection handling is specified in section 10.

The six-dose budget, six-second cooldown, and 75-second timer are configuration values. Approval establishes these starting defaults; playtesting may tune numerical balance without changing the game structure.

## 3. Session flow and screens

1. Start screen: Quick Play, Create Private Laboratory, and Join by Code/Link, with Monstrum Mortis branding and a restrained laboratory backdrop. The Specimen Cabinet is accessible without entering a game.
2. Entry: Quick Play provides a short first-time interactive explanation, a cancellable matchmaking queue, and an automatic ready check. Private laboratories show a six-character room code excluding ambiguous characters, invitation link, QR join link, roster, connectivity, and instructions; the host starts with 2–8 players. No accounts or email.
3. Rival briefing: approximately eight seconds, showing the rival's silhouette and one meaningful strength and weakness. Each round selects a different rival from the six archetypes.
4. Experiment: everyone sees the same quivering blob and accepted mutations. Each player's private tray, remaining doses, cooldown, and switch are visible only on their controller.
5. Release: switches illuminate, coils surge, the chamber opens, and the creature enters the battle stage.
6. Battle: both specimens fight without player control. Camera changes, impacts, health changes, and concise event captions explain important outcomes.
7. Autopsy: outcome, revealed traits, personal awards, monster name, and Save Specimen Card.
8. After round three: total team score, three specimen cards, and cumulative commendations. Private rooms offer host-controlled Play Again with the same roster. Public rooms offer Play Again Together and Find New Laboratory; neither queues a player without an explicit choice.

Each player's device is a complete game view: a prominent live chamber, private specimen tray, remaining doses, cooldown, teammate activity, switch readiness, team signals, full battle, results, and card export. A communal display is optional. On desktops the chamber occupies roughly two-thirds of the main view beside the controls. On phones it remains the dominant upper region, with four specimens in a compact grid and always-accessible primary controls. Screens must preserve readable anatomy rather than reducing the creature to a thumbnail. Battle takes over the main surface on every device.

Private rooms support Remote and Same-Room presentation presets. Remote enables each player's audio after their first interaction. Same-Room designates one sound source, normally the TV/browser display, and mutes other devices initially. Players can override their own audio preference. The preset affects presentation only: physically mixed groups can still participate, and the rules are identical.

The host can play from their own device. An optional display-only view can run on a TV or laptop, uses no player seat, and exposes no private tray. Private rooms pair a display by code/link. Public rooms allow a participating player to generate a limited display link; outsiders cannot browse or spectate arbitrary public rooms. No casting integration is required; an ordinary browser or screen mirroring is sufficient.

## 3A. Public matchmaking and low-population behavior

Quick Play matches individual guests into cooperative laboratories. The initial system targets 4–6 players and allows up to eight; it never claims a queue time is guaranteed.

- Before first queue entry, a short interactive rehearsal teaches selection, injection, dose limits, and the switch without revealing the actual DNA catalogue. Skip is available.
- A guest receives a random reconnect identity and a generated alias with an avatar/symbol. Public aliases are selected from an authored vocabulary; custom names remain a private-room feature.
- Matchmaking uses three coarse pools: Americas, Europe/Africa, and Asia/Pacific. Pool choice is based on measured connection response times, with an explicit manual selector; it does not request precise location.
- Tickets are ordered by queue entry time. Four waiting players trigger a 10-second ready check; additional queued players may fill the group to six during that check. No group exceeds eight, including later replacements.
- If the oldest ticket has waited 30 seconds and at least two people are queued, begin the ready check with the available 2–6 players. With fewer than two, keep the queue open and show the minimum-player requirement. After 60 seconds, offer another pool or creating a private invitation; never invent players, silently add bots, or silently change pools.
- Every selected player must tap Ready during the 10-second check. Ready players proceed when at least two confirm. Unresponsive players return to an inactive queue state and must explicitly resume. Ready players from a failed check return to the queue with their original priority.
- A player may cancel before launch. Ticket cancellation, readiness, and room admission are idempotent, and temporary reservations expire automatically.
- Quick Play starts a new three-round session. Ordinary fresh tickets do not send players into a half-completed session.
- Public rooms do not have a player host. Server rules start rounds, advance results, and handle departure. The build timer and switch ritual remain unchanged.
- Public autopsy screens last 25 seconds. After the first 10 seconds, all active players choosing Next Round advances early. Saving a card never blocks progression: the completed record is already in that device's cabinet.
- At session end a 30-second regroup window lets players opt into Play Again Together. At least two opting in create a new session with reset score. If fewer than two opt in, they receive a choice to queue again or leave; there is no involuntary replay. Players choosing Find New Laboratory leave the regroup and enter the normal queue.

Population is a product constraint: public matchmaking needs at least two people present in a pool. Empty queues receive useful status and private-invitation alternatives. Queue status shows actual waiting conditions and elapsed time, not unsupported estimates.

## 3B. Remote cooperation and public-room continuity

A compact roster shows who is connected, injecting, cooling down, or finished. Mutation captions identify the contributor with their alias and symbol. The readiness panel shows how many switches have been pulled. Sound-independent captions and animations communicate the same important events.

Players can send six authored team signals: More Teeth, More Armor, Enough Limbs, Unleash, Applause, and Uh-oh. Signals appear briefly beside the contributor and are rate-limited to one per three seconds. They communicate intent without spending a dose or casting a release vote. Each device can hide all signals or those from a particular guest. There is no free-text chat or integrated microphone requirement. Friends may use their existing call, but public play must work entirely within the game without speaking.

Active rounds never receive replacement injectors. After a departure, remaining contributors finish under the locked player-count scaling. Players looking for a game may explicitly opt into a separate Fill an Existing Laboratory queue to replace vacancies between rounds. This queue shows the round number, current team score, approximate remaining session length, and whether it is an ordinary vacancy or a recovery lobby before they confirm. It never takes people from the normal fresh-session queue without consent.

Ordinary between-round replacements must complete a ready check within the 25-second autopsy window; unused reservations expire, and the next round proceeds with at least two connected players. A replacement joins with a fresh six-dose budget at the next round boundary, never inherits someone else's identity, and receives no personal credit for earlier DNA. The interface distinguishes the laboratory's existing team score from the newcomer's own contribution history.

At fewer than two players, public-room recovery pauses the unfinished experiment according to section 10. It then abandons that unfinished attempt if reconnection fails and opens a 60-second recovery lobby for opt-in replacements. With at least two confirmed players, retry that round from a fresh blob and retain only scores/cards from completed rounds. At recovery timeout, preserve completed cards and offer the remaining player Quick Play or Exit; do not force them into a new queue.

Public specimen names are generated. On the autopsy screen players may vote among three authored name suggestions; plurality wins, with seeded tie-breaking at screen close. The initial generated name remains valid until a winning title is finalized. This avoids giving a random stranger exclusive naming control. A downloaded card uses the current title; the cabinet record updates to the final shared title and can be downloaded again. Private-room hosts retain custom renaming.

## 4. Specimen selection and mutation behavior

Each player gets four independently dealt specimens. Injecting consumes the selected specimen and replaces it immediately with a new draw. There is no free discard or reroll. Players do not race over a shared disappearing pile.

Specimens have an accession number and recognizable visual cues, but no explanatory trait name before injection. Color is supplemented by shape, texture, and motion. A non-spoiling descriptive label, such as 'branching, twitching filaments', supports accessibility. The chosen specimen's actual mutation is named when it takes effect; complete numerical details are revealed in the autopsy.

Each DNA type has a defined effect rather than a fresh lottery after selection. Clues remain consistent across sessions so learning is possible, while similar-looking families preserve uncertainty for new players. Each personal six-injection draw sequence is prepared server-side from a common distribution, with safeguards against a tray containing only harmful specimens. These safeguards do not guarantee identical hands.

Accepted injections immediately update the authoritative creature. Presentation shows fluid entering, a convulsion, and the part settling. Several closely timed injections can animate together; no growing animation queue delays the displayed state. Attribution remains available in the mutation log. Budget and cooldown update only after server acceptance; pending actions receive immediate UI feedback.

Mutations use defined body slots: central body, eyes, mouth, left and right forelimbs, lower limbs, skin, head growths, and appendages. Repeated traits enlarge or evolve existing parts. Competing traits use explicit rules, such as kitten paws replacing the active clawed hands. Replaced DNA remains in the history but loses the mechanical effect tied to the replaced part. Detached parts and slime can remain as battle hazards when the catalogue says so. Morphology is bounded to keep silhouettes readable.

## 5. Initial DNA catalogue

These are developer/autopsy names; players initially see unlabeled specimens with visual clues. All 30 types have visible effects, including those that are primarily cosmetic.

| Type | Visual change | Mechanical intent |
| --- | --- | --- |
| Titan Fibers | Bulging muscle bands | More melee power; slightly slower |
| Spring Tendons | Taut elongated legs | Faster movement and attack cadence |
| Razor Talons | Hooked foreclaws | Slashing attack with a brief bleed |
| Guillotine Teeth | Oversized cutting teeth | Stronger bite; more vulnerable after a miss |
| Ossified Plates | Uneven bone armor | More protection; less speed |
| Auxiliary Heart | Pulsing chest sac | More vitality; added instability |
| Reweaving Tissue | Wounds knitting closed | Slow regeneration |
| Hook Tentacles | Grasping side appendages | Brief restraint; reduced direct power |
| Venom Glands | Swollen dripping throat | Poison attack |
| Storm Organ | Sparking dorsal growth | Electrical strike; extra instability |
| Acid Bladder | Translucent abdominal sac | Corrosive spit that weakens armor |
| Barbed Hide | Short skin spines | Limited contact retaliation |
| All-Seeing Cluster | Multiple alert eyes | Better accuracy; less vitality |
| Bellows Lung | Expanding rib cage | Roar that briefly delays a rival |
| Counterweight Tail | Heavy articulated tail | Better balance and resistance to restraint |
| Funeral Mane | Long wet hair | Cosmetic; reacts to motion |
| Cathedral Horns | Ornate curling horns | Cosmetic silhouette |
| Mourning Veil | Ragged translucent frills | Cosmetic flutter |
| Lantern Eyes | Unnatural glowing eyes | Cosmetic gaze and light |
| Ink Bloom | Black marbled veins | Cosmetic spreading pattern |
| False Halo | Floating fleshy ring | Cosmetic oscillation |
| Too Many Smiles | Small grinning surface mouths | Cosmetic twitching and occasional murmur |
| Kitten Paws | Soft furry hands | Replaces talons; less claw damage, better landing recovery |
| Candle Flesh | Sagging waxy skin | Less protection; leaves a slowing slick |
| Brittle Skeleton | Cracked narrow bones | Lower vitality; some speed gain |
| Wandering Limb | A limb loosens and detaches | Lower melee power; brief crawling distraction |
| Tremor Ganglia | Constant spasms | Erratic aim; occasional accelerated attack |
| Porcelain Teeth | Teeth crumble on impact | Weaker bite; minor shard retaliation |
| Excessive Viscera | Dangling organs and bulk | Higher vitality; slower movement |
| Existential Organ | A staring chest growth | Adds instability and occasional lost actions |

Draw weights start at 50% combat-enhancing or tactical tradeoffs, 25% cosmetic, and 25% comic liabilities. Because traits interact, these categories are not a guarantee of usefulness. They are balancing categories, not visible labels.

## 6. Balance, combat, and rivals

Combat uses vitality, power, protection, agility, regeneration, and instability, plus explicit abilities such as poison or restraint. Live instruments show approximate readings; the autopsy reveals the final values. Cosmetic mutations consume doses normally, contributing appearance and comic character rather than invisible stat bonuses.

The starting blob is the same at each player count. Numerical dose magnitude and ability potency scale by 2 / N, where N is the player count locked at the round's start. Six injections from each player therefore represent the same total numerical investment whether N is two or eight. Visual changes still happen on every injection. Repeated abilities strengthen within a cap rather than creating unlimited attack sources; first acquisition at higher N starts at correspondingly lower potency. This scaling is tested rather than assumed to solve every interaction.

Instability is a cost attached to dangerous mutations, not simply a penalty for using more doses. It causes bounded mishaps. Repeated mutations have diminishing returns; no single stack can dominate indefinitely. Stats and control effects have caps, and a creature cannot be restrained for the whole battle.

The six rival archetypes are: Iron Widow (armor), Gutter Seraph (speed), Carrion Duke (regeneration), Coil Saint (electric bursts), Maw Engine (heavy bites), and The Unfinished (unstable mixed abilities). Round one is forgiving, round two standard, and round three demanding. Rival strength is set by round and the normalized full budget, not retroactively adjusted to ensure a chosen result.

The server freezes the released monster, chooses a battle seed, and generates the full chronological battle event list in a short computation. Clients animate that same list against a shared start time. There is no continuous server physics loop. Randomness modifies bounded hit, dodge, and mishap probabilities; traits determine the available attacks and most of their effectiveness.

Battles end at knockout or at the maximum duration. At time expiry, higher remaining health percentage wins; equal percentages within the defined rounding tolerance produce a draw. A mutual knockout is a draw. Every attack, block, poison tick, restraint, regeneration tick, and malfunction has an explicit event and supporting visual. A melted or detached part must change the attacks available afterward.

Numerical effect values, caps, animation durations, and rival stat tables live in versioned data files. Their initial calibration is implementation work, followed by simulation and playtesting. It does not introduce new rules or content categories without approval.

## 7. Team score and personal awards

Per round: victory gives the team 100 points, a draw 50, and defeat 0. The session score ranges from 0 to 300, alongside a clear win/draw/loss record. There is no bonus for rapid tapping, spending every dose, or forcing an early release.

Personal commendations recognize observed contributions without pretending to prove who caused victory. Each injection is tagged with its contributor. Shared attacks and stacked effects split attributed credit according to the active normalized contribution weights; overwritten parts no longer earn active-part credit. General baseline effects remain unattributed. The log distinguishes direct contribution from team-wide outcome.

| Award | Evidence |
| --- | --- |
| Instrument of Ruin | Most attributed damage from contributed attacks/statuses |
| Keeper of the Unkillable | Most attributed healing and protection |
| Architect of Inconvenience | Most successful restraint, poison, or slowing activity |
| Most Questionable Science | Most comic-liability doses administered |
| Anatomical Liability | Most attributed malfunction or self-damage events |
| Curator of the Unnecessary | Most cosmetic mutations |

Award only categories with qualifying activity. Ties are shared; a player may earn more than one award. Everyone receives a personal contribution summary even without an award. Commendations are humorous recognition, not a numerical individual leaderboard.

## 8. Saved monsters and tarot cards

Every round freezes an archival portrait at the moment of release, before battle damage. Results pair that portrait with the outcome. Players can save winning, defeated, and drawn specimens.

The card is a 1080 × 1800 PNG: aged-paper or stained-black stock, engraved occult border, Roman round numeral I/II/III, Monstrum Mortis title, the actual assembled creature, specimen name, six final gauges, up to four dominant traits, battle seal, and names of players who actually contributed to that specimen in a compact footer. The card excludes the room code. The rival and outcome can appear in a brief autopsy inscription. Smaller text must remain readable at export resolution.

The exact creature renderer draws its parts into an export canvas using the frozen composition and a stable pose. It does not use a newly generated approximation or a screenshot containing interface controls. Artwork, fonts, and audio are bundled or served from the same origin; export waits for required assets to load.

Names are generated from a small authored vocabulary, for example 'The Velvet Catastrophe'. Private-room hosts can rename a specimen on its results screen with a length limit; public rooms use the timed authored-name vote in section 3B. The shared card title updates consistently. Renaming does not alter the portrait or stats.

Save Specimen Card downloads the PNG where supported. On devices where direct download is awkward, the game offers the native file-share action if available, then an image preview that can be saved manually. Players can save each card separately; no ZIP download is required.

A device-local Specimen Cabinet keeps up to the 20 most recent completed cards and their brief records, using IndexedDB. Completed round cards are added automatically on that device; quota failures are handled with a clear notice and leave manual export available. The oldest cards are removed when the local limit is exceeded. This cabinet survives an ordinary reload but does not synchronize across devices or survive clearing browser data. Downloaded PNGs are the durable keepsakes. Cabinet cards cannot be imported back into battle in this release.

## 9. Art, animation, audio, and usability

Visual direction: cloudy containment glass, corroded riveted iron, oxidized brass, cracked ceramic insulators, stained tubing, wax seals, handwritten accession tags, damp stone, and decaying laboratory machinery. Colors: near-black, dirty ivory, tarnished copper, diseased green, bruised violet, and sparing blood red. Decorative typography can evoke antique books; action labels and instructions use a legible face.

The chamber and monster are the dominant visuals, not dashboard cards. Creature artwork consists of original transparent raster layers with stable attachment points, expressive idle poses, and transformations. A small coherent set of environmental textures supplies the lab. Geometry, gauges, layout, and interactions are code-rendered; detailed representational artwork is authored/generated as assets. Creature motion is driven by the renderer, not repeated image generation.

Idle: breathing, wobbling, eye tracking, twitching, drifting fluids. Injection: tube pulse, convulsion, part transition, wet impact. Release: deliberate switch snap, coil surge, mechanical door movement. Battle: lunges, recoil, restraint, bite, spit, sparks, detached parts, and knockout. Accessibility settings reduce movement and eliminate intense flashing while retaining readable state changes.

Audio: electrical hum, coil crackle, bubbling fluid, squelches, strained moans, snarls, switch clanks, steam, and punctuating battle impacts. Browser audio is enabled by a user interaction. Remote play, including Quick Play, enables sound independently on every player's device after interaction. Private Same-Room mode designates one default sound source, normally the shared display. Every device can mute, adjust volume, or override its initial setting. Visual captions accompany important sounds, and audio never gates participation.

Humor is terse and institutional: 'The committee considers this a promising number of limbs.' Avoid constant narration that obscures the action. Touch targets are at least 44 CSS pixels; controls work by keyboard and tap; no drag-only or sound-only task is required. The knife switch supports a deliberate tap or keyboard activation, even if its animation looks mechanical. Clear pending, cooldown, locked, offline, and ready states prevent uncertainty.

## 10. Real-time architecture and failure rules

Proposed stack: TypeScript, React and Vite for screens, PixiJS for the 2D scene, Web Audio for playback, and Cloudflare Workers with one SQLite-backed Durable Object per room plus region-pool matchmaking coordinators. Build output is portable source plus an explicit Cloudflare deployment configuration. No separate always-running server, paid database, or runtime AI API is required.

The server owns seats, room phase, start times and deadlines, private trays and hidden effects, remaining doses, mutation order, switch state, monster snapshots, battle seeds/events, scores, and awards. Clients submit intentions rather than stat values or outcomes. Initial connection and reconnect receive a phase snapshot. Ordered events have monotonic revision numbers. Each action carries an idempotency key; duplicates cannot spend a dose twice.

Room phases: lobby → briefing → experiment → release → battle → autopsy, repeated three times, then session results. Private-room host actions govern start and advance; public rooms use server-owned readiness and timed progression. Timed transitions use server deadlines and alarms; clients animate countdowns locally rather than requesting a tick every second. Hibernating WebSockets and event-driven updates reduce idle resource usage.

Data records: Room (public/private and presentation preset), PlayerSeat, GuestIdentity, QueueTicket, MatchReservation, ReadyCheck, Round, private SpecimenTray, CreatureComposition, InjectionEvent, BattleEvent, TeamSignal, NameVote, AwardSummary, and CardRecord. Room access uses the join code plus a separate random seat-reconnect token. Join codes are invitation conveniences rather than strong authentication. Validate names and action sizes, limit join attempts and action frequency, and reject unauthorized host actions. Public rooms are entered through matchmaking rather than a browsable room directory. No public free-text chat is included. Private join credentials are never advertised to matchmakers. Public membership requires a server-issued admission reservation; guessing a public room code cannot create a seat. Display access is separate and limited to its viewing role.

Failure rules:

- A dropped player has 15 seconds to reconnect with the same seat, hand, and budget. The round timer continues during that grace period.
- After that grace, the disconnected player is marked finished for the current round and no longer blocks unanimous release. Their injected DNA remains. Returning after this point permits viewing but no further injections that round.
- N is fixed at the experiment's start. Leaving does not retroactively strengthen the other doses or change rival strength.
- With fewer than two connected players after grace during an experiment, suspend time for up to 30 additional seconds. Resume on return; otherwise abandon the unfinished attempt with no score. Finished specimen cards remain available. Private hosts may restart from the lobby with at least two players. Public rooms enter the 60-second recovery lobby described in section 3B. Already-started battles finish even if people disconnect, and their results are recoverable while the room exists.
- In private rooms, host ownership transfers to the longest-connected remaining player when the host's reconnect grace ends. Display-only devices cannot become host. Public rooms have no player host to transfer.
- Private-room invitees enter during the lobby or between rounds. During an active round they may watch and receive a seat and dose budget for the next round if capacity permits. Public injectors enter only at a round boundary through the explicit fresh-session or existing-laboratory queue; no uninvited public spectators are admitted.
- Reconnecting during battle receives current battle time and state, not a replay from the start.
- An injection whose server handling begins at or after the experiment deadline is rejected. Server time governs expiry; the UI identifies rejected late actions and restores its displayed pending selection.
- Public players with no injections in a completed experiment receive an inactivity prompt. If they neither interact with the prompt nor have sent any gameplay/readiness action during that round, their seat expires before the next round. Intentional early finishers who injected and pulled their switch are active. Individual players can leave instantly; this removes their pending queue reservation or marks their current-round seat finished, without deleting their existing contributions.
- Room codes are collision-checked. Invalid, full, locked, expired, and temporarily unavailable rooms show distinct messages.
- Room records expire after two hours without participant activity, with a hard maximum lifetime of 24 hours. Cleanup removes room state and server-held cards/snapshots; downloaded and device-local cards remain.

### Matchmaking consistency and abuse limits

One coordinator per coarse region serializes queue admission and reservations; each room still owns its own game state. A lightweight per-guest lease authority serializes that guest's claims across pools, so a guest can have only one live queue ticket or active seat at a time. Moving pools releases the previous claim before requesting another. Rejoining uses the reconnect token; an explicitly confirmed replacement connection supersedes the old connection rather than duplicating a seat. Guest leases expire or are renewed from accepted activity and release cleanly on departure.

Creating a room and admitting a group uses an idempotent allocation ID and short-lived signed reservations. The coordinator reserves guests, requests room creation, and confirms admission; failures release or expire reservations and return eligible guests with their prior queue priority. Rooms validate reservation ownership, capacity, and phase independently. The system must tolerate coordinator or room reactivation between any two steps. Stale queue tickets and abandoned reservations expire. Queue cancellation racing with allocation cannot admit a cancelled guest unless they subsequently reconfirm.

Guests receive server-issued opaque identities and queue access tokens. Apply limits to room creation, repeated queue/cancel cycles, duplicate guest tickets, signal frequency, and oversized input. Anonymous identity is browser-scoped and cannot guarantee protection against someone deliberately creating many separate browser identities; this is recorded as a first-release limit, not presented as verified person-level identity. Generated public aliases and authored signals keep public interaction bounded without adding an unstaffed free-text moderation system.

Client clocks are synchronized with sampled server time; countdowns and battle playback correct drift gradually. High latency or reconnect never grants an extra dose or changes the battle outcome. Measure latency across coarse pools. Region pools organize guests and room allocation; they do not promise hard Cloudflare execution-region pinning.

## 11. Hosting and cost approach

Target the Cloudflare Workers Free plan with SQLite-backed Durable Objects. Workers Static Assets serves the client and bundled artwork/audio. A free provider subdomain is sufficient; a custom domain is optional and outside the zero-cost requirement.

Cloudflare documentation checked on 5 October 2026 states that SQLite-backed Durable Objects are supported on the free plan, subject to daily request, duration, and storage-operation quotas. Exceeding a free quota causes relevant operations to fail rather than providing unlimited capacity. Static asset requests are free under the documented asset-serving rules. Hibernating WebSockets are recommended for idle connections.

Design for initial small-scale public and private use: short room and ticket lifetimes, compact event messages, no server frame-by-frame rendering, a single precomputed battle timeline, no persistent public leaderboard, and client-side card rendering. Matchmaking coordinators are event-driven and use hibernating connections; queue countdowns run locally against server deadlines. Include coordinator and queue traffic in the quota measurements. Measure usage in a multi-room test before making a capacity claim. The first target is 10 concurrent eight-player rooms plus display devices under synthetic test, not a promise that any traffic volume will be free.

Public deployment requires access to the chosen hosting account and provision of the room binding. Verify deployment access and free-plan configuration before publishing. If unavailable in the build environment, deliver the runnable game and deployment instructions with the exact remaining step identified; do not substitute a single-device simulation for real multiplayer.

References:

- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/

## 12. Implementation sequence after approval

1. Establish repository structure, shared types, versioned rules, host configuration, asset manifest, and a deployment-access check.
2. Build the real room service: private create/join, public room admission, seats, tokens, authoritative phases, WebSockets, deadlines, and reconnection. Verify with independent clients.
3. Build regional Quick Play queues, ready checks, allocation/cancellation recovery, automatic public progression, explicit replacement queueing, and public replay. Verify concurrency and low-population behavior.
4. Produce the coherent laboratory and modular creature assets; implement chamber rendering, responsive controller screens, and accessibility settings.
5. Implement all 30 DNA types, private dealing, six-dose budget, cooldown, body replacement/stacking rules, player-count scaling, mutation attribution, and switches.
6. Implement six rivals, seeded automatic combat, synchronized battle playback, team score, personal awards, and three-round progression.
7. Implement archival snapshots, tarot card rendering, downloads/mobile fallback, naming, and the local Specimen Cabinet.
8. Integrate per-device/presentation-mode audio, team signals, public name votes, complete error/reconnect states, and exercise the acceptance checklist. Adjust numerical balance from measured results.
9. Publish to the verified free-plan setup, test from the deployed origin, and deliver the game link, source, run/deploy instructions, and known limits.

## 13. Acceptance checklist

- Two, four, and eight separate clients can join privately by code/link and complete all three rounds. A display-only client does not consume a seat. A ninth player receives a full-room message.
- Every accepted injection changes all clients' creature state; near-simultaneous actions remain ordered and no animation backlog hides the latest anatomy.
- Each player has six doses per round, can spend at most one per six-second cooldown, and cannot inject after pulling the switch or after expiry. Repeated requests do not double-spend.
- Switch unanimity and time expiry both start exactly one release and battle. A slow or disconnected client cannot hold the room indefinitely.
- Body replacement affects combat. Repeated trait caps, negative effects, purely cosmetic effects, and player-count scaling work at 2–8 players.
- All clients receive identical battle outcome, team score, awards, and monster card data. Cosmetic playback differences cannot change results.
- All six rivals and thirty DNA entries have working visuals and the declared effects. Battle events visibly demonstrate relevant traits.
- Reload, phone sleep, temporary disconnection, host departure, mid-round joining, and server reactivation recover according to section 10.
- All three round monsters can be exported; exported PNGs match released anatomy, contain legible names/stats, and work on current mobile Safari and Chrome through the defined download/share/preview paths.
- Local saved cards survive an ordinary reload. Quota errors leave manual export available. There is no claim of cross-device cloud saving.
- Portrait phones, desktop display, keyboard operation, mute, reduced motion, and reduced flashing remain usable.
- Quick Play correctly handles zero/one waiting guest, the 30-second two-player fallback, ordinary 4–6-player matching, ready-check expiry, cancellation races, duplicate queue attempts, pool switching, and allocation interruption. Public rooms never acquire more than eight players.
- Private rooms never appear in public allocation. Public admission and display permissions cannot be bypassed by guessing a room code.
- Public results advance automatically; no player host can stall a matched session. Missing players, explicit replacements, recovery-lobby expiry, and voluntary replay follow the specified timing. Newcomers get no earlier personal award credit.
- Remote clients each see a prominent creature, full battle, readiness, and team signals, and independently hear audio after interaction. Private Same-Room mode retains the TV display and avoids default multi-device audio echo.
- Public alias/name choices and team signals use authored vocabulary; public name votes and card exports remain consistent.
- Artificial latency, message duplication, connection loss, and server reactivation do not fork room state or admit a guest to two rooms.
- Synthetic ten-room load plus at least 100 idle queued guests is measured for latency and free-tier resource consumption; report observed limits honestly.
- The deployed game is tested with separate browser sessions, and a human playtest from at least two independent devices is completed or explicitly identified as the remaining verification step.

## 14. Approval boundary

Approval authorizes building this revised first release with the specified defaults, including remote-first public Quick Play matchmaking, private remote/same-room code and link play, optional TV/browser display, preset team signals, the 30-type catalogue, six rivals, free-hosting architecture, real multiplayer, tarot exports, and device-local cabinet. Ordinary implementation and numeric balancing choices may proceed within that scope. Material changes to mode, scoring, saving promises, paid services, or scope require discussion.

Approval was granted on 5 October 2026. The current implementation request covers step 1 only; later implementation stages are tracked in docs/IMPLEMENTATION-STATUS.md.
