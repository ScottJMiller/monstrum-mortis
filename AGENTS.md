# Monstrum Mortis project instructions

- Read `docs/APPROVED-PLAN.md` and `docs/IMPLEMENTATION-STATUS.md` before changing game behavior.
- Current authorization (10 October 2026): implement Battle v2 Phase A, the development-only animation/audio review slice in `docs/BATTLE-V2-SPEC.md` and `docs/BATTLE-V2-PLAN.md`. Complete the sample without a second planning approval. Preserve step 5/6 mechanics and experimental anatomy; do not replace production presentation, produce remaining Phase B sets, implement Phase C UI/admission changes, cards/cabinet/naming or deploy before the required new instruction. The older step-only authorizations are historical. Uniform tie selection is server-only and eventually persisted once per frozen attempt; Phase A tests it without wiring production.
- Phase A refinement authorized 13 October 2026: integrate the user-supplied sounds/effect SVGs, New Rocker lettering with the approved randomized word lists, remove battle shadow disks, and add the family-1 bite-lunge variant. Effect placement clarification: block/retaliation stay on their defender; offensive effects stay on the attacked creature. Effect orientation follows the acting creature independently of placement: left attacks and left defenses retain the original SVG; right attacks and right defenses mirror it. Strike, guard, recoil and defeat playback gain is increased by 15%. The user selected textured anatomical grafts for the next non-tint overlay pass; those samples remain under discussion, not accepted as final production art.
- Preserve current remote-first matchmaking/private play and legacy display permissions. Battle v2 supersedes future region/Same-Room/display entry guidance: Americas-only new entry and UI removal belong to Phase C, with no forced migration.
- Shared rules live in `src/shared/rules.ts`; bump rulesVersion for changed defaults, and protocolVersion for breaking wire changes.
- Server owns hidden DNA, doses, timers, switch state, outcomes, admission, and attribution. Clients send intentions only.
- Do not import anything from `src/server` into the client, including the hidden catalogue.
- Public snapshots must exclude secret tokens, private hands, unrevealed DNA outcomes, and battle seeds.
- `LaboratoryRoom`, `MatchmakingPool`, and `GuestLease` are durable infrastructure identities. Renames require an explicit Cloudflare lifecycle plan.
- Use SQLite-backed Durable Objects on the Workers Free plan. Do not add paid services without discussion.
- Keep `scottjmiller.com` and `www.scottjmiller.com` on their existing self-hosted setup. Initial deployment is workers.dev only. Discuss custom-domain configuration before adding routes.
- Assets in the manifest remain planned until real files, origin/licensing, and attachment points are supplied. Do not manufacture playable art with placeholders and claim it finished.
- Never add credentials to the repository or ask the user to paste tokens into chat. Cloudflare login runs locally through Wrangler.
- Use the committed npm lockfile. Run `npm run check` and `npm run build` for relevant changes; Worker changes also need a deploy dry run and appropriate local runtime verification.
- Do not imply that health or a dry-run bundle validates real multiplayer or deployed account access.
- Update implementation status with the actual checks completed and outstanding work.
