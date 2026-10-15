# Battle v2 family/blob refinement — 14 October 2026

The user approved the proposal exactly as presented: transfer Razor Talons and Counterweight Tail votes to the blob, redesign Family 1 as a gaunt armored executioner, and make Family 3 subtly fluffier/cuter with a bobtail. This is implemented in the **Phase B development preview**. It does not authorize Phase C production integration, deployment or later features. Existing experimental DNA artwork and all combat/DNA mechanics remain unchanged.

## Selection and compatibility

The sole operative mapping is [integrated-form.ts](../src/shared/integrated-form.ts), with the complete catalogue table in [the canonical specification](BATTLE-V2-SPEC.md). Razor Talons now votes for `blob` instead of Family 1; Counterweight Tail votes for `blob` instead of Family 3. There are six voted identifiers: 1–5 and `blob`. The existing blob artwork is reused; no seventh body or duplicate numbered blob is introduced. Blob also remains the zero-positive-vote fallback, with no entropy call in that case.

One distinct surviving DNA ID contributes one vote. Paired targets, reinforcement, potency and contributors never multiply it. A partially surviving talon still contributes one blob vote; fully replaced talons/tail contribute none. Only the highest positive total participates in uniform server-only ties, now with unbiased bucket/rejection support through six candidates. A blob vote does not guarantee the blob wins. Its stats, slashing/bleeding and restraint resistance come from actual surviving DNA; no bonus, ability or physical overlay is inferred from the body shape.

The development presentation descriptor is now **`battle-v2-b2`**, because its mapping and vote record include the blob. Protocol/schema **5**, rules **0.3.0**, DNA calibration and production room state are unchanged: there is still no room-service caller or production wire field for this selector. Phase C must explicitly handle stored descriptor versions, persist one selection before broadcast and preserve legacy attempts/recovery; that work remains unauthorized. Current previews regenerated from real producers use b2 rather than pretending old fixture votes remain current.

## Produced artwork

**Family 1:** retained the long bent legs, narrow stitched torso, antique machinery and huge guillotine jaw. Irregular dirty ivory bone plates emphasize shoulders, spine and shins, with exposed flesh between them. Long arms end in oversized blunt hands with thick knuckles and short uneven fingers; toes are also blunt. The old long razor talons are removed. Six independent poses cover idle, blunt hand/body strike, recoil, defense, collapsed defeat and a distinct forward bite lunge.

**Family 3:** removed the articulated heavy counterweight tail and replaced it with a small fluffy bobtail. Fuller cheek/body fur, softer muzzle and rounded kitten paws make the resting expression less threatening; bright green eyes, cathedral horns, sparse blood marks, stitched/brass details and frightening attack teeth preserve sinister humor. Five independent poses cover idle, attack, recoil, defense and defeat. “10–20% cuter” is the approved qualitative art direction, not a measured perceptual score.

Used the built-in imagegen tool under the imagegen skill. Versioned transparent originals are in [source/family-refinement](../assets/battle-v2/source/family-refinement); old masters remain untouched. [Generation provenance](../assets/battle-v2/family-refinement-generation.json) retains exact prompts, edit-reference paths, source hashes, tool, date and applicable generated-output origin without an invented stock/exclusive license. [Registration](../assets/battle-v2/family-refinement-registration.json) contains authored pose-specific grounded pivots, torso/shoulder and eye anchors, including both kitten eyes. [Offline extractor](../scripts/battle_v2_family_art.py) isolates actual complete figure components, expands the mask one pixel, preserves original alpha and uses one uniform scale per sheet. Core/Phase B derivative ledgers record helper/registration hashes and exact runtime crops/hashes. Existing mutation grafts, eye-protected tint, defender shields and Titan scaling use the same real registered poses.

Current Family 1 six-pose download: **339,164 bytes**. Family 3 five-pose download: **375,190 bytes**. Both meet the 600 KB target; current selected-pair images are **941,670–1,290,624 bytes**. The library remains twelve body sets, sixty ordinary pose roles plus the bite variant, three arenas, twenty event treatments and twenty-four audio cues. No runtime generation, new paid dependency or hosting/binding change.

## Actual verification

Passed:

- `npm run check`: config guard, both TypeScript projects and all fourteen test files. Individual enumeration passed **216 tests**, including all thirty mappings, six-candidate uniform buckets, blob positive/fallback distinction, replacement/partial survival/reinforcement and unchanged mechanical effects.
- `node tests/battle-v2.browser.mjs`: **10 scenarios / 72 presentations**, all 22 real core eye/torso alpha registrations, injection/integration feedback, sound, contact, seeking, direction, responsive/reduced/static and WCAG checks.
- `node tests/battle-v2-phase-b.browser.mjs`: **8 scenarios**, all 60 body roles/120 graft treatments/60 text-damage pose studies, 36 actual family/rival producer recordings, timers/loss feedback, sound, loading retry and phone/reduced WCAG.
- `node tests/battle-v2-refinement.browser.mjs`: **5 scenarios**, all 30 rival alpha silhouettes, actual onset-only sound, final-word/countdown/defender shields across twelve bodies, exact recoil gain and phone centering/fit.
- `node tests/battle-v2-family.browser.mjs`: **3 scenarios**, eleven redesigned roles including bite, tint/mirroring, real motion/audio from all three relevant bodies, actual voted-blob talon slash, phone static/reduced presentation and WCAG checks.
- `npm run deploy:dry`: check/build/bundle passed with the same three SQLite-backed class identities and bindings. The first sandbox attempt could not write Wrangler's external log; an authorized rerun completed without that error. No deployment or deployed-account/storage claim.
- `node tests/combat.runtime.mjs`: **6 runtime scenarios**, independent sockets, accepted timers, privacy/authorization, eviction/full runtime restart, real first battle completion alarm, three-round private/public progression and all eight clients/48 doses per round. Later-round deadlines were advanced only inside isolated SQLite fixtures. This verifies preserved production mechanics, not v2 persistence or Phase C rollout.
- Build and `node scripts/check-battle-v2-build.mjs`: **93 production files**, v2 code/media/fixtures excluded; existing production JS/CSS hashes unchanged. Asset preparation, inventory, survey, review generation and whitespace checks passed.

An initial provenance assertion needed the new versioned master ledger; it now validates both retained historical and current generation sources. No failed check remains. Existing source/dependency/lockfile/infrastructure/domain work was preserved.

The reproducible [vote survey](battle-v2-family-review/vote-survey.json) runs 20,000 simulated rounds for each of 2/4/6/8 players using current weighted draws, tray safeguards, uniform tray choices and all six doses. It credits the actual selector's highest-vote candidates with their expected uniform tie shares. Blob frequencies are **11.47%, 10.62%, 10.10%, 9.83%** respectively. These are a model, not human telemetry or guaranteed appearance rates; deliberate selections and early switching may differ.

## Review and local use

- [Before/after](battle-v2-family-review/before-after.png), [eleven pose roles](battle-v2-family-review/poses-contact-sheet.png), [battle/phone contact sheet](battle-v2-family-review/contact-sheet.png).
- [Actual motion/audio recording](battle-v2-family-review/family-recording.mp4), [motion frames](battle-v2-family-review/motion-frames.png), [voted blob slash](battle-v2-family-review/voting-blob-slash.png).
- [Browser evidence](battle-v2-family-review/browser-evidence.json), [artifact hashes](battle-v2-family-review/review-evidence.json), [exact image prompts/source hashes](../assets/battle-v2/family-refinement-generation.json).

Run `npm run dev`, then open `/battle-v2` on its reported address. Choose Family 1/3 in the pose study, or legal `blob / …` battle fixtures to see the voted blob with real surviving abilities. The separate **No-vote blob** modifier fixture still demonstrates fallback. Controls/manual art overrides remain labeled development studies. `npm run survey:battle-v2-families` reproduces the frequency model; `npm run review:battle-v2-families` assembles the captured comparison/recording. The broader Phase B test command now includes the family browser check; its constituent checks above were run separately.

Inspected actual rendered poses, before/after, phone and motion sheets. The dedicated recording contains 302 browser frames with actual captured audio. Human aesthetic/cuteness and sound acceptance, physical phones/Safari/Firefox/manual accessibility and real-device performance remain separate outstanding checks. Stop at Phase B review: Phase C persisted production selection/playback/UI/admission, deployment and cards/cabinet/naming remain outside scope.
