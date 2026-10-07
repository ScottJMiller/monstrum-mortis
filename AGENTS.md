# Monstrum Mortis project instructions

- Read `docs/APPROVED-PLAN.md` and `docs/IMPLEMENTATION-STATUS.md` before changing game behavior.
- On 7 October 2026 the user confirmed steps 1–4 complete, pushed and deployed, steps 1–3 tested on multiple devices, and step 4 presentation reviewed. Step 5 only is authorized. The user approved docs/STEP-5-PLAN.md with the release message ‘Creature released. Prepare for combat!’ and authorized scripts needed to complete step 5. Implement only that approved scope. Do not implement step 6 or later stages, or deploy, without a new instruction.
- Preserve remote-first public cooperative matchmaking, private invitation play, and the optional shared display.
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
