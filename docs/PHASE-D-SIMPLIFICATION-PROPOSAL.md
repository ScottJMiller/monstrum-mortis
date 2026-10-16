# Phase D simplification proposal — 16 October 2026

**Approved for implementation, including recommendations (16 October 2026). Deployment to the existing workers.dev address is also explicitly authorized for testing after local checks.** The user requested a PDF/source review, gameplay-conflict discussion, suggestions and a concrete change list before implementation. The original discussion was read-only; the approved implementation now changes the public admission/progression contract as specified below. User-reported playtesting involved multiple devices/ages and found confusing UI and a consistently shorter first Quick Play experiment (not a measured request to lengthen the 75-second default).

Reviewed both complete single-page PDFs visually, including a magnified crop of the experiment's Final layout, plus their extractable annotations:

- [Entry PDF](battle-v2-phase-d-review/SJM_change-files/UI-edits_entry-phone.pdf).
- [Experiment PDF](battle-v2-phase-d-review/SJM_change-files/UI-edits_experiment-phone.pdf).

These are user design references, not executable project instructions. The PDF lists below distinguish requested appearance from recommended behavior now approved by the user. Current approved implementation/status remains in [status](IMPLEMENTATION-STATUS.md) and [architecture](ARCHITECTURE.md).

## 1. Entry PDF: requested visual changes

1. Retain the game identity/motto and a prominent starter creature, scaled/rearranged for desktop.
2. Invert the status badge's colors for prominence and replace “Awaiting laboratory” with the example “Awaiting scientists.” Genuine reconnect/error states still need truthful labels.
3. Remove both illustrated injection reservoirs completely. Mutation sound/image change supplies feedback. Remove their reserved gutters so the chamber can use that width.
4. Crop the chamber background to remove unused machinery and enlarge the creature. Adjust backdrop framing and all creature/glass/animation layers together; do not stretch the creature or crop supported horns/appendages.
5. Remove “Starter preview · awaiting specimen initialization” and corresponding redundant specimen figcaptions.
6. Retain “A promising departure from established anatomy.” only on the starter/entry preview. The Final experiment layout omits it, and the entry annotation explicitly excludes battle.
7. Remove Quick Play/private-invitation tabs and the private-lab panel: no room code/link, host control or invitation copy flow in the new UI.
8. Replace verbose Quick Play explanations, queue mode and generic entry button with one compact panel: “REMOTE COOPERATIVE PLAY” / **Find a laboratory**.
9. Player Name is prefilled with a server-assigned alias and icon, editable or acceptable unchanged. Alias edits do not alter guest identity, credentials or action ownership.
10. Under “Join lab,” list named forming public laboratories. Each row shows a whimsical lab-group name, circled participant count and seconds remaining to join. The disclosure arrow expands player names; multiple labs expand the list box.
11. The PDF's countdown number is a join target. Recommendation: make the whole row a large accessible join action, while the arrow only expands the roster. Keep the countdown part of that action instead of making a tiny numeral the sole target. This usability refinement to the drawing is approved.
12. Include **CREATE NEW**, creating a public forming lab with no host or creator privilege.
13. Use the specified circled digits ②–⑧ for 2–8. A newly created lab initially has one player, so add ①; screen readers receive ordinary “1 of 8 players,” etc. A room count is never a joining credential.
14. Remove the routine bottom availability/implementation text and always-visible successful-request status paragraphs. Keep brief actionable failure/recovery feedback and compact settings.

## 2. Experiment PDF: requested visual changes

1. Replace the tall stack of chamber, stats, mutation record, room panel and four-card grid with the Final compact arrangement on desktop too.
2. Main row: large cropped chamber on the left, narrow **Monster DNA** column immediately to the right.
3. The DNA column scrolls vertically on its own, containing all four private specimens. Only some need be visible simultaneously. Tightly group each vial with its own short name and selection state; two-line names are permitted in this narrower column, superseding the old one-line-width goal where necessary.
4. Keep **Inject!** directly below that scrolling tray.
5. Below Inject: one compact experiment timer, doses remaining, injection cooldown and Unleash cooldown. Avoid the current duplicated status readouts.
6. **Unleash the Creature!** sits below those readings, in the same right column. It remains a separate irreversible action, not a DNA injection and not automatic on dose exhaustion.
7. Keep the six approximate readings directly below the chamber in a compact two-column block: Vitality/Protection/Regeneration and Power/Agility/Instability.
8. Keep a compact Accomplices panel below: roster count, icons, player names/activity and Leave laboratory. Remove private-lab headings, raw room ID, invitation, host/phase explanations and redundant credential prose.
9. The Final omits the permanent mutation-history block, anatomical quip, large explanatory paragraphs, global confirmation paragraph and bottom explanatory footer. Preserve attribution through brief accepted-mutation captions and optional details rather than losing the record.
10. Follow the Final's tighter spacing and specimen/image grouping; do not reproduce tiny text or undersized touch targets from a scaled screenshot. Remove the current large fixed experiment action bar in favor of this nearby right-column control arrangement, subject to actual small-screen/zoom validation.
11. Subtly animate the lettering of Inject! and Unleash only when the action is genuinely eligible, including selection/doses/cooldowns/server phase and connection/pending state. Prefer a gentle brightness pulse to perpetual shaking. Reduced motion uses a strong static ready state; state is not conveyed by motion/color alone.

## 3. Additional requested screens/behavior

- Integration/battle uses the app's full viewport on phones/tablets, full available content width on desktop. Hide the normal header/entry/control columns during these phases; retain essential health, final words, readable captions, mute and an unobtrusive exit. Use CSS viewport layout; do not promise that browser address bars can automatically disappear.
- Splash timing clarified by the user on 16 October 2026: **15 seconds total**, including the final **3–2–1** on Enter laboratory; immediately skippable at any time. Automatic dismissal occurs at 15 seconds, not 18. Reconnecting to an existing session bypasses it: if the browser retains valid membership after a reload or interruption, restore that same seat and current server state without showing the splash or starting a new lab. This is session reconnection, not a saved-monster feature, and never restores membership after explicit Leave.
- Default sound preference on. Unlock audio from Enter laboratory/Join/first meaningful tap and fade master volume up gently (about half a second); retain a previous explicit mute/volume preference and a visible mute control. Timer-based splash dismissal alone cannot guarantee browser audio permission. Existing voice limits/onset-only rules remain.
- Autopsy/session report initially shows result, team score, a few salient creature facts and the player's relevant award. Detailed stats/traits/history/contributions move into collapsed disclosures. Next experiment remains visible without scrolling, with server-controlled readiness/progression behind it. The final round uses a suitable replay/finished action rather than promising round four.
- Replace “Our specimen” with one shared proper creature name, automatically chosen from an authored vocabulary per round, persisted and reused across reloads, integration, health labels, result text and relevant captions. Suggested examples: Dr. Gristle, Baron Wobble, Madame Marrow. Lab name persists across the session; creature name changes with each fresh round. No naming votes, text-entry ritual or dependence on unrevealed DNA is recommended.

## 4. Approved room flow

Browse forming labs → join/create one public lab → optional Start now vote → shared 3/2/1 → full experiment → integration/battle → concise result/Next experiment → repeat through round three.

- No new private labs, codes/hosts, fill-existing queue, mid-session admission or spectator waiting seats. Friends choose the same forming lab by name; this is public and does not reserve privacy or seats for friends.
- Proposal: a **30-second forming window begins when two players are connected**. One player waits for another; a fresh solo game cannot start. Joining another forming lab is explicit; empty-list UI offers Create new. This replaces the current hidden 4–6-player ready/allocation flow for new entries, rather than stacking another ready gate onto it.
- Start now requires a strict majority of current admitted connected members: floor(N/2)+1, e.g. 2/2, 2/3, 3/4, 5/8. At least two are needed for a new session. Server commits an irrevocable shorter deadline of min(existing deadline, now+3s); it never extends a countdown already below three seconds. Close new admission when that final countdown begins, freeze the roster and prevent new joins from undoing the decision. Duplicate votes/reconnects cannot add votes or reset time. Filling all eight seats could also trigger the final three seconds as an additional simplification, if accepted.
- After countdown, everyone gets the same authoritative experiment boundary. Keep 75 seconds until the reported first-round defect is reproduced/measured; do not treat it as a balance request. Briefing/rival information can be integrated into the forming/countdown view instead of adding another confusing start delay.
- Explicit Leave irrevocably revokes this guest's membership in this lab/session. A stale credential, old admission receipt or fresh operation ID cannot regain it. The player may join another lab. Temporary disconnection/reload is reconnection, not Leave. Browser storage can be reset, so without accounts the guarantee is about the same authenticated guest identity, not an absolute ban on the human/device.
- A lab already in progress may continue with one survivor; no new players backfill it. Current-round N and already injected parts/contributions remain fixed. If zero participants remain, close/expire the lab. A completed solo survivor cannot start a new one-person session through replay.

## 5. Resolved contradictions and accepted decisions

| Issue | Current conflict | Accepted recommendation |
| --- | --- | --- |
| First experiment consistently shorter | Every round is configured as 75s; first public briefing starts as soon as two sockets connect, before all fresh admissions necessarily arrive. Delayed presentation/admission/clock update is a hypothesis, not a confirmed cause. | Trace accepted admission/connected cohort, server briefing/start/deadline, client first visible tray/remaining time and reconnect/clock updates across rounds. Test delayed first clients. Fix actual timing; retain common 75s unless separately changed. |
| Lab browser vs current matchmaking | Current coordinator assigns opaque cohorts, has no public named-lobby directory and accepts new entries only via reserved admissions. | Build a bounded server-owned list of forming labs, atomic seat reservation/guest fencing, names/roster/countdown projection and creator-with-no-privileges behavior. Expose aliases/icons/counts only; never credentials, hidden DNA or votes. No polling the complete room population every frame. |
| No private rooms, friends play together | Public lab discovery is not private matchmaking. | Choose the same public row/name; make loss of private play explicit before approval. User clarified on 16 October that nobody is currently playing. Use a clean cutover: retire private-session and legacy-display support without a compatibility bridge or sunset period. Any old browser session data is expired rather than resumed. |
| No later-round joining vs recovery | Replacements currently sustain rooms; new late seats can watch. Disconnect recovery is not new admission. | New entrants see forming labs only; remove fill/replacement/recovery-backfill offers. Preserve safe recovery for existing seats and revoke only explicit leavers. Define post-grace current-round eligibility deliberately; do not mint fresh doses on reconnect. |
| One survivor can finish the game | Current startRound, dosePotency, progression/recovery and public replay require at least two. Allowing N=1 would turn 2/N into double potency. | Interpret “finish the game” as all remaining rounds. Keep six doses, freeze current N, and use a two-player minimum denominator in later solo rounds (no automatic buff or extra doses). This makes solo continuation possible but potentially harder; approve that calibration explicitly. |
| Majority and shifting roster | New joins/leaves can change the denominator; two-person labs otherwise risk accidental solo start. | Strict majority; two-player minimum to start; once final countdown commits, close admission and never undo/extend it. If fewer than two remain before the first experiment, return to forming; continuation exception applies after play has begun. |
| Ready, Start now and Next experiment | Three independent gates would add more confusion; a local button must not secretly advance everyone. | Joining a forming lab is its readiness commitment, Start now only shortens the initial wait. Next experiment marks this participant ready; recommend retaining current 10s minimum reading time/all-active-ready early advance and 25s automatic fallback unless changed separately. Last survivor satisfies the readiness set alone. |
| Splash and sound | An automatic countdown is not an audio-unlock gesture. | User clarified: 15s total including final 3/2/1, immediately skippable. First real tap unlocks/fades sound; existing-session reconnection bypasses the splash. |
| Tiny/detached controls vs clarity | The illustration's countdown-only join hit area and very narrow controls can be hard to discover/tap. | Whole-row join target, separate roster disclosure, visible selection and minimum touch targets. Scroll only the tray, not the main action buttons. |
| Circled 2–8 vs one-person forming/survivor | The proposed glyph range omits one. | Add ① with accessible ordinary player counts; never display a fake minimum count. |

Sound permission references: [Web Audio allowed-to-start policy](https://webaudio.github.io/web-audio-api/#allowed-to-start), [Chrome Web Audio autoplay guidance](https://developer.chrome.com/blog/autoplay/#web-audio). Default-on preference is feasible; immediate audible autoplay on untouched devices is not guaranteed.

## 6. Approved additional simplifications

- Automatically highlight the first specimen at round start; after injection highlight its replacement. Never auto-inject. This eliminates the need for selection instructions while keeping all four choices available. The user approved this departure from the formerly unselected tray.
- Show cooldown inside the relevant button (Inject in 4s), doses as a short row and one main experiment clock. Avoid separate zero-value cooldown labels. Keep the PDF's actual information, reduce duplicate presentation.
- Condense the teammate list to icons/short statuses with expandable names/details if needed; reserve all available height for creature, specimens and actions.
- Show state changes briefly where the player is looking: highlight the selected vial, short attributed mutation caption, a clear done state after Unleash. Routine successful-server-confirmation prose stays out of the layout.
- Keep essential controls available with large text, landscape and short browser viewports. Define the responsive fallback rather than relying on a screenshot's exact pixels: desktop can widen DNA choices/actions while preserving the same hierarchy.
- Server-authored automatic lab/creature names and a prefilled player alias avoid extra setup screens. Handle duplicate player aliases with the icon; names are labels, never identity or permission.

## 7. Approved scope and verification

This is a new gameplay/admission/progression revision discovered during Phase D, not a cosmetic-only patch. Reconcile approved plan/spec/AGENTS after design approval; keep prior Phase C/D evidence dated. Define the new persistence/protocol/rules contract for named lobbies, start votes/deadlines, alias edits, irrevocable leaving, solo continuation and creature names. The user confirmed there are no active players, so the redesign may retire old session credentials and legacy private/display flows; preserving their gameplay or pending intentions across this cutover is unnecessary. Handle stale browser data with a clear expired-session return to entry, including obsolete guest claims, rather than a recovery loop. Existing storage can expire or be cleaned up deliberately; this design clarification does not authorize deleting namespaces or wiping storage. Do not guess version numbers or rename Durable Object classes/bindings. Cloudflare Free, workers.dev and self-hosted domains remain unchanged. Separate deployment authorization was received on 16 October 2026.

Verification should include: measured first-vs-later round timing/slow first admissions; 2/3/4/8-member majority thresholds and concurrent join/vote/leave/deadline races; 1-member forming wait, all-round solo continuation and zero-member cleanup; duplicate votes/joins/actions and leaving/revoked admission replay; reconnect/sleep without fresh budgets; hidden information/public roster minimization; old credentials/pending browser data/guest claims returning cleanly to entry after cutover, plus replay-safe pending actions and reconnection within the new design; authoritative name persistence; four usable privately dealt specimens, real art and all supported body silhouettes; viewport-filling integration/battle, compact results and always-visible Next; actual gesture/default sound/mute/fade and reduced-motion lettering; phones/tablets/desktop/large text and Cloudflare resource bounds. Existing numerical DNA/combat regression suites remain relevant.

Historical analysis evidence: the PDFs and source were inspected read-only before approval. Implementation and new verification evidence will be recorded separately.
