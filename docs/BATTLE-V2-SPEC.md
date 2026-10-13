# Monstrum Mortis — Battle v2 specification

Version: 1.0 · 10 October 2026 (America/New_York)

## 1. Purpose, authority, and implementation boundary

This document consolidates the user's Battle_v2.md proposal, the subsequent design discussion, and approval: body selection uses surviving-mutation votes with random tie-breaking; the rest of the reviewed direction is accepted. It specifies a presentation redesign of the completed step 6 game, including earlier integration of sound. It is not permission to implement unrelated later features or deploy.

The five integrated body types and overlays replace the modular released/battle appearance. The existing modular creature remains during experimentation. Gameplay remains cooperative, remote-first, 2–8 players, three rounds, private labs and public Quick Play, with authoritative automatic combat and personal commendations.

Current instructions: reconcile documents, implement a development-only vertical slice, and deliver it for visual/audio review. Full asset production and production rollout follow acceptance of that sample. The sample must contain actual functioning animation, not just static concept art. Do not deploy. Do not implement card export/cabinet/naming or unrelated team-signal features in this work.

This specification supersedes previous appearance rules at integration/battle, region-selection UI, Same-Room presentation UI, and display-only entry UI. It preserves existing mechanics, infrastructure identities, and the experiment's approved anatomy artwork. Update AGENTS.md to describe this authorization accurately without erasing historical records.

Priority when interpreting requirements: current user instructions; this specification; current approved plan after reconciliation; older implementation notes. Old notes are historical evidence, not competing requirements. Implementation refinements may clarify these requirements but may not silently change their design meaning.

## 2. Explicit defaults and terminology

- **Experimental creature:** existing modular, immediately mutated creature in the containment chamber.
- **Integrated form:** a new presentation descriptor selected once from frozen active mutations at release. It is not a new mechanical creature.
- **Body family:** one of five authored bodies below, plus an animated blob fallback.
- **Pose:** idle, attack, recoil, defense, or defeat. Recoil and defense are distinct even if initial assets share elements.
- **Effect:** a reusable directional visual such as a slash, electrical arc, or corrosion splash.
- **Lettering:** a themed comic-style word accompanying a significant effect.
- **Current slice:** body family 1 versus Iron Widow in a development gallery; it does not replace the deployed game yet.

The animated blob fallback is the explicit default adopted from the preceding recommendation, because the user did not designate one of the five bodies as the no-vote default. Preserve existing slot competition. No reinforcement-based visual variants for integrated forms in v1; Titan Fibers applies one 10% enlargement, irrespective of repeat doses. These defaults must be visible in the implementation plan and review handoff.

## 3. Preserved mechanical contract

Preserve DNA IDs, targets, replacement, stacking, diminishing returns, 2/N scaling, stats, abilities, attribution, doses, cooldowns, switches, experiment/release deadlines, frozen records, rivals, combat generation, scoring, commendations, progression, matchmaking ownership, and recovery rules.

Existing timings include an eight-second briefing, 75-second experiment, six-second injection cooldown, and five-second release. Preserve private host advancement/replay, public readiness behavior, and three-round scoring (100 win / 50 draw / 0 loss).

The integrated body, colors, size, and overlays confer NO stats, bonuses, penalties, attacks, or contribution credit. A body depicting teeth does not grant a bite mutation; a kitten silhouette does not automatically impose the Kitten Paws penalty. Actual active DNA remains the source of mechanics and attack semantics.

The existing combat engine remains authoritative. Freeze the original active anatomy/mechanical contribution data, then derive a separate integrated presentation descriptor. Do not overwrite the frozen mechanical creature with a body-family approximation. Presentation must not recompute winners, health, or scoring.

## 4. Body selection: votes and persisted random ties

At release, after all relevant action/deadline/grace settlement, use the frozen active anatomical state:

1. Collect distinct DNA IDs with at least one surviving active target. Fully replaced mutations contribute no vote. A partially surviving mutation contributes one vote.
2. Map eligible DNA IDs to body families using section 5.
3. Each distinct mapped DNA ID contributes exactly one vote. Repeat doses, potency, contributor count, and the number of surviving targets do not multiply votes. In particular, paired claws/paws count once.
4. Select the family with the most votes.
5. If two or more families tie for the highest positive total, choose uniformly at random among those tied families only, ON THE SERVER.
6. If no family receives a vote, choose animated blob fallback; do not randomly choose one of the five.
7. Persist the chosen descriptor with the frozen attempt before broadcasting. Duplicate switches, concurrent release paths, reload, hibernation, and runtime restart must return the same choice.

Use a server-only random source with unbiased bounded selection, or an existing suitable seeded generator with a fresh server-only seed. Neither client entropy nor request order chooses the winner. Keep entropy/seed private; the chosen family is public. Use an injectable entropy source in tests. Do not promise exact frequency equality in a finite statistical test; test tied-candidate eligibility and bucket boundaries deterministically.

Persist a presentation version, attempt identifier, chosen family, eligible vote counts, modifier descriptor, and authoritative integration interval. Internal audit data can remain private. Persisting the vote result must not introduce duplicate scoring or new combat runs.

## 5. Complete DNA mapping

All mappings apply only if at least one target survives at release. "None" in the vote column means the mutation never votes for a body; its modifier/mechanics can still apply. Alpha is opacity: 100% = fully opaque, 50% = 0.5. Tints are a presentation treatment, not separate visible organs.

| Mutation | Family vote | Integrated presentation |
| --- | --- | --- |
| Titan Fibers | None | Uniform 1.10 scale; roots/grounding remain correct |
| Spring Tendons | 1 | Represented by selected family; no extra leg overlay |
| Razor Talons | 1 | Represented by selected family; no extra claw overlay |
| Guillotine Teeth | 1 | Represented by selected family; no extra tooth overlay |
| Ossified Plates | 1 | Represented by selected family; no extra armor overlay |
| Auxiliary Heart | None | Red body tint, 50% treatment opacity; no heart sprite |
| Reweaving Tissue | None | Green body tint, 50% treatment opacity; no tissue sprite |
| Hook Tentacles | 2 | Represented by selected family |
| Venom Glands | None | No persistent appearance change; mechanics/effect retained |
| Storm Organ | None | No persistent appearance change; mechanics/effect retained |
| Acid Bladder | None | No persistent appearance change; mechanics/effect retained |
| Barbed Hide | None | Opaque sparse torso barb nodes |
| All-Seeing Cluster | 2 | Represented by selected family |
| Bellows Lung | None | No persistent appearance change; mechanics/effect retained |
| Counterweight Tail | 3 | Represented by selected family |
| Funeral Mane | 5 | Represented by selected family |
| Cathedral Horns | 3 | Represented by selected family |
| Mourning Veil | 5 | Represented by selected family |
| Lantern Eyes | 3 | Represented by selected family |
| Ink Bloom | None | Opaque marbled-vein torso overlay |
| False Halo | 4 | Represented by selected family |
| Too Many Smiles | None | Opaque small surface mouths occupying about one-third of visible torso area |
| Kitten Paws | 3 | Represented by selected family |
| Candle Flesh | 4 | Represented by selected family |
| Brittle Skeleton | 5 | Represented by selected family |
| Wandering Limb | 4 | Represented by selected family |
| Tremor Ganglia | None | Occasional local decorative spasm; not an extra mechanical malfunction |
| Porcelain Teeth | None | No persistent appearance change; bite/shard mechanics retained |
| Excessive Viscera | 2 | Represented by selected family |
| Existential Organ | None | Opaque tumorous shoulder growth containing a wandering eye |

Body families:

1. Long-legged, skinny creature; long arms/talons; face dominated by guillotine teeth.
2. Horrifying tentacled, multi-eyed creature with dragging viscera.
3. Cute but blood-stained kitten body; long sharp teeth, cathedral horns, bright eyes, counterweight tail.
4. Fat, melty wax creature with precarious limbs and a dripping wax halo.
5. Crumbly, decrepit skeleton with long ragged hair and mourning veil.
6. Fallback identifier should be named `blob`, not another voted family: animate the starter blob without inventing additional mechanical abilities.

The winning family is complete art, not a merger of silhouettes from other voted families. Mutations associated with losing families retain mechanics but do not add their family-specific body parts to the winning silhouette. Explain this separation in concise player-facing trait/help text, not implementation jargon.

## 6. Modifiers, compatibility, and bounds

Modifiers follow existing mechanical target competition, NOT their screen position. Barbed Hide, Ink Bloom, Too Many Smiles, Reweaving Tissue, and Candle Flesh compete for the same active skin target. Titan Fibers, Auxiliary Heart, Existential Organ, Tremor Ganglia, and the other body-target mutations likewise compete. Do not revive replaced modifiers from injection history.

Derive modifiers from surviving active DNA. Scale defaults to 1.0; Titan Fibers makes it 1.10 exactly once. Tint covers the body surface while preserving eyes/contrast. Specify fixed palette constants during the slice. For simultaneous red and green tints, use a fixed, order-independent combined palette rather than applying filters in injection order. Tone and 50% blending must be shown in a reference preview.

All overlays need transparent backgrounds, matching registration, and sensible roots for EACH family and pose. "Same outline" means alignment with its associated body/pose, not one bitmap stretched onto six different silhouettes. Sparse barbs and mouths must remain readable at phone scale. Eye wandering is decorative and respects motion settings.

A naive five-family independent-feature bound is 640, but it is not the actual current-rule count. Preserved slot competition gives an upper bound of 100 broad static modifier/family descriptors for five voted families, or 120 including blob, BEFORE accounting for unreachable vote/modifier combinations. These are bounds, not a claim of exact reachability. Enumerate reachable descriptors under the final selector in a development script if reporting an exact count. Exclude reinforcement, frame/time variations, event damage, and gameplay stat differences from this count.

## 7. Injection and release choreography

Experiment art and mutation visibility retain their current identities and layout.

Injection response, target duration 600–900 ms:

1. Accepted injection triggers a fluid pulse through chamber tubes, with whoosh/bubble/squelch.
2. Creature quivers and machinery flickers briefly.
3. New accepted composition resolves visibly; authoritative logs/doses update without waiting for the animation.

Rejected or merely selected specimens do not animate as accepted injections. The cosmetic reveal may briefly transition from old to new art, but state/cooldown remain authoritative. Concurrent accepted injections coalesce into one bounded reaction whose final artwork is the newest composition; do not queue six long performances or roll back to an older composition.

Release uses the EXISTING five-second release interval, not an added phase or delay:

- No injection-fluid pulse.
- Prominent "Integrating DNA…" while quivering/flickering occurs.
- Reveal the persisted integrated form during that interval, then seek into battle at the existing authoritative start.
- A proposed initial timing is 0–2 seconds machinery/spasm, 2–3.5 seconds transformation/reveal, 3.5–5 seconds hold/unleash. Calibrate during the slice without changing the five-second deadline.
- Late/reconnecting clients seek to the current interval; they do not restart the transformation or delay battle.
- Never send strobing/flashing effects without conservative bounds and reduced-motion alternatives. Use restrained illumination changes, not high-frequency full-screen flashes.

## 8. Battle animation model

All animations decorate the persisted authoritative timeline. Mirroring reverses direction without reversing readable lettering. Preserve clear team/rival identification and health/status readability.

For an ordinary successful attack: idle → short anticipation → attack pose/lunge → contact/effect/lettering and defender recoil TOGETHER → recovery → idle. Block/resistance can use defense pose; a miss gets a miss/dodge treatment, not a false impact. Defeat overrides recovery. Do not depict regeneration or retaliation as an ordinary deliberate lunge.

Use five pose roles per body/rival: idle, attack, recoil, defense, defeat. Final production requires SIX player families including blob plus SIX rivals: twelve animation sets. Start with one player family and one rival. Separate parts, rigging, or pose frames are implementation choices; evaluate genuine motion and reliable registration rather than naming a technique as completion.

Reusable presentation families:

- Direct: strike, talon slash/bleed, bite.
- Specials: electrical discharge, poison, corrosive splash, restraint, roar.
- Reactive/support: barb retaliation, shard retaliation, regeneration, slowing slick, crawling distraction.
- Readable reactions: dodge, block, malfunction, detachment, knockout.

Map current timeline kinds and source mutation IDs to these presentations in one documented registry. Existing direct captions can distinguish bites/slashes when source metadata is absent; prefer an explicit minimal presentation discriminator if needed. A protocol extension for presentation cannot alter mechanical outcomes or leak private data.

Large themed word treatments include "CORROSION!", "RETALIATION!", and other relevant effects, using aged occult/comic lettering rather than cheerful superhero art. Mirror the effect, not the word. Supply equivalent accessible text/captions. Show large lettering for major events; recurring poison/bleed ticks use small status feedback. Effects may briefly obscure parts of the arena, but not health/readiness/critical controls. Bound overlapping effects and use a deterministic priority policy; never serialize cosmetic playback so slowly that it trails authoritative health.

Visual hit-stop pauses a local decorative pose only. It must not stop the authoritative battle clock, extend deadlines, or diverge on reconnect. Simultaneous exchanges can show both attacks. Defeat/disconnection/reduced motion must not leave a stuck pose.

Use several authored battleground backgrounds for full rollout (initial target: three). Select a background once per battle on the server, persist its ID, and show the same background to everyone. Background selection has no gameplay effect and cannot reroll on reload. One finished background is sufficient for the slice. Keep figures grounded and overlay contrast readable.

Existing timed detachment/melting/shattering mechanics stay intact. Map these to damaged pose variants, masks, or small effect components on the integrated form. Do not switch body family mid-battle or restore lost abilities. A visually pre-existing generic body limb is not proof of an active mechanical limb; avoid implying an unsupported combat change. Specify and test the mapping before full rollout.

## 9. Sound brought forward

Integrate sound in this redesign rather than waiting for the old step 8 ordering: ambient electrical hum/crackle/bubbles, accepted injection, integration, switch/unleash, attacks, creature reactions, abilities, and defeat/result punctuation. The slice must demonstrate sound, not just list planned assets.

Unlock audio through a user gesture; failed/blocked audio never blocks play. Provide accessible per-device mute and volume. New presentation is remote-only: each participant independently controls audio; no default single shared sound-source selection. Do not produce a backlog after reconnect/backgrounding. Seek visuals to current time and play only timely cues, with capped voice count and reduced ambient volume during foreground cues. Prefer a shared effects/sound event registry and same-origin bundled assets with recorded provenance. No paid or runtime AI audio dependency. If sound tooling is unavailable, use honest project-authored procedural effects or report the missing deliverable.

## 10. UI and admission simplification

- Remove region-selection UI; NEW public entries use the existing Americas pool identifier. Preserve validation/server ownership and existing sessions in other pools until they safely leave/expire. Do not force-migrate queued guests or rename durable infrastructure.
- Remove new Same-Room options and display-only creation/join UI. Participant play remains fully functional on desktop and phone. Preserve safe reconnect/leave behavior for legacy display sessions; a display must never gain player permissions. Do not keep advertising display mode in current docs/help.
- Tighten entry, lab, experiment, results, and replay layouts while preserving important states and controls.
- Mount text fields/buttons in aged brass/iron apparatus, stained labels, glass gauges, parchment, and real-looking specimen trays. Keep the chamber/battle the primary visual element.
- Decorative artwork is separate from semantic HTML controls. Never rasterize input labels, button semantics, status text, or player names into a background. Use legible contrast, keyboard/touch operation, visible focus, mobile reflow, and at least 44 CSS-pixel touch targets. No drag-only requirement.
- Preserve understandable name-required, pending, cooldown, offline/reconnect, waiting, finished, ready, host-only, error, and replay states. Copy explains the action; it should not expose architecture details.

The full UI simplification is a later phase of this redesign. The slice demonstrates one themed panel and chamber/arena framing without rewriting the entire entry/session flow.

## 11. Assets and performance

Maintain an asset manifest, source masters, exact prompts/tool or license records, hashes, optimized runtime files, pose/overlay registration, and previews. Assets are "ready" only when real files and working render integration exist. Preserve archived experimental anatomy and the definitive reference.

Preload essential battle assets during briefing/experiment or earlier; do not delay combat deadlines for loading. Failed artwork offers retry and a legible fallback without changing results. Keep caches/effects/audio bounded, stop decorative work when hidden, and keep connections/renderers stable across mutations, resize, settings, and pose changes. Measure bytes and phone performance; do not treat the prior 250 KB JS budget as permission for unbounded new media. Publish new measured asset/loading budgets in the plan.

Reduced/paused motion suppresses shake, lunge, camera movement, spasms, particles, and flicker while retaining readable states, poses/captions, and outcomes. Muting does not remove captions. Avoid generating every complete modifier combination as a separate asset.

Keep Workers Free, SQLite Durable Objects, `LaboratoryRoom`, `MatchmakingPool`, `GuestLease`, existing bindings, and workers.dev-only configuration. Leave self-hosted scottjmiller.com/www unchanged.

## 12. Documentation reconciliation and working procedure

Before coding, inspect the current branch, AGENTS.md, approved plan, status, step 5/6 plans/reviews, renderer, catalogue, protocol, migrations, tests, and asset provenance. Fetch upstream if available without overwriting local work. Check that all 30 DNA entries still match this mapping.

Create a canonical repository document such as docs/BATTLE-V2-SPEC.md and a scoped implementation plan. Mark accepted defaults, requirements, implementation proposals, phase completion, and remaining evidence separately. Add a current authorization note to AGENTS.md and current summaries in the approved plan/status. Explicitly mark displaced display/Same-Room/region/appearance guidance as superseded. Preserve historical test records with dates; do not rewrite past checks as if they tested v2.

Revisit/revise/clean up documents at every phase boundary. Maintain one source of truth with linked summaries, one DNA-family/modifier registry, and one combat-effect mapping. Resolve naming, stale numbers, obsolete promises, duplicate conflicting requirements, and broken links. Record intentional deviations and their rationale. Routine clarification/implementation choices need no new approval; a change to an accepted mechanic/design decision must be presented for user decision. Do not invent missing approvals or use old step-only restrictions to request permission for this explicitly scoped sample.

## 13. Implementation phases and review gate

Phase A — reconciliation and vertical slice (current execution scope):

1. Install the canonical specification/plan and reconcile affected guidance.
2. Build the pure vote/modifier selector and test it in isolation using frozen active states and injected entropy.
3. Produce body family 1 and Iron Widow assets with the five pose roles, one arena background, and representative registered modifiers. Show enlargement, red/green/combined tint, barbs, veins, mouths, shoulder growth, and decorative tremor in controlled fixtures; fixture combinations must be labeled, distinguishing art samplers from legal server states.
4. Build a development-only preview with real working reusable effects, lettering, audio controls, injection feedback, and five-second integration choreography. Include at least strike, bite, slash, corrosion, and retaliation, with documented remaining effects.
5. Show timeline-based seeking, simultaneous contacts, mute/reduced motion, phone layout, and one themed instrument panel. Prefer actual producer timelines for combat fixtures; label any isolated choreography/art fixture honestly.
6. Deliver a playable preview, short recording where tooling permits, screenshots/contact sheet, actual tests, scope limits, and an updated next-phase plan. Keep unfinished redesign out of the production entrypoint/build. Do not deploy.
7. Stop at visual/audio acceptance of the sample before producing all remaining families/rivals or replacing production presentation. Do not ask a separate planning confirmation before completing this already-authorized sample.

Phase B — after sample acceptance: remaining five player sets and five rivals, complete effect/audio registry, pose/damage registration, and remaining arena artwork.

Phase C — full integration: persisted presentation selection/backgrounds, wire/schema compatibility, integrated playback, themed compact UI, Americas-only entry, removal of new display/Same-Room flows, and migration/regression verification.

Phase D — review/acceptance: actual device performance, sound, pacing, readability, recovery, and asset budgets. Deployment requires a separate user instruction. Later cards must use the persisted integrated form, but card implementation is outside this task.

## 14. Verification and completion evidence

Selector tests: all 30 mappings; no-vote fallback; unique/partially surviving votes; paired target deduplication; no votes from replaced DNA; reinforcement-neutral counts; unbiased tie bucket behavior; active-only modifiers; family choice affects no stats/abilities.

Integration runtime tests when Phase C is authorized: concurrent switch/deadline/grace release races persist one descriptor; random tie/background cannot reroll after duplicate actions/reload/eviction/restart; private hands/entropy stay private; old credentials/active sessions have an explicit versioned compatibility path; no retroactive random transformation of legacy attempts. Extend protocol/schema/rules versions only where justified and document compatibility precisely.

Animation/browser tests: shared contact timing and clock seeking; no elapsed-time resets; no delayed cosmetic backlog; proper recoil/block/miss/defeat; mirroring leaves words readable; registered overlays across all produced poses; rendering/texture/audio bounds; slow/failed asset retry; sound-unlock failure; reduced motion; phone portrait/landscape; keyboard and accessible text.

Preserve relevant room, public matchmaking, recovery, admission, DNA, scoring/awards, host advancement, replay, and three-round regression coverage. Run check/build and appropriate runtime/browser suites; Worker changes need a dry run. Do not claim browser/device/audio playback checks if unavailable. Local timing is not Cloudflare quota evidence.

Completion reports include: changed behavior and files; assets actually ready versus planned; previews and review evidence; passed checks and exit status; unrun/failed checks; bounds/performance measurements with scope; remaining limitations; phase reached; and the precise next decision. No implementation is considered visually complete on unit tests alone.
