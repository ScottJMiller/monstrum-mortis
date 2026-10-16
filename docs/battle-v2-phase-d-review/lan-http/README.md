# LAN HTTP startup fix — 15 October 2026

User report: iPhone Chrome connects to port 8787 but shows a blank screen; Safari searches the entered address. A separate local browser reproduction confirmed an empty body and `crypto.randomUUID is not a function` at startup when using an ordinary HTTP hostname. On the same browser, `isSecureContext` was false, `crypto.randomUUID` absent and `crypto.getRandomValues` available. Previous localhost checks used a potentially trustworthy origin and missed this boundary. This is the first reported physical-device symptom, not a completed iPhone acceptance run.

## Fix

`src/client/random-id.ts` retains native `crypto.randomUUID()` when available and otherwise constructs a UUID v4 from 16 `crypto.getRandomValues()` bytes. All private/Quick Play operation, action and admission IDs use this helper. No `Math.random`, timestamp IDs, global crypto patch, new credential or client-side gameplay entropy. Existing retry IDs, storage keys, protocol, rules, server choices and session recovery are unchanged. The helper follows the [Web Crypto API](https://w3c.github.io/webcrypto/#Crypto-interface) secure-context distinction and UUID algorithm.

Rebuild/restart the local Worker, refresh the phone tab and paste the full `http://<numeric-Linux-IP>:8787/` into Safari's address bar, then Go. Use the same numeric IP Chrome reaches. LAN clipboard manual-copy fallback remains expected. No deployment, DNS, TLS-service or paid-service change.

## Actual validation

- Check/config/types and 17 unit files passed; separately enumerated **228 individual tests**, including native crypto receiver binding, fallback UUID formatting with secure byte preservation and failure propagation without weak entropy.
- Build and production asset/hash/exclusion guard passed.
- `node tests/lan.browser.mjs`: **three scenarios passed** using the real production build, isolated SQLite and native browser API availability on `http://mm-lan.test:<ephemeral-port>` mapped to loopback. No secure-context bypass flag or crypto mocking. Private create/join/socket synchronization, clipboard fallback, reload/credential retention and leave→create; four independent public guests/tickets/readiness/admission; trusted-loopback native UUID path.
- Existing refinement browser suite: **five scenarios passed**, including pending/recovery/leave, timing, assets and accessibility. Its current sheets were regenerated; the earlier production battle recording was not rerun as new evidence.
- The new browser harness initially attempted create after reload without filling the now-empty name input. The test was corrected and rerun successfully; no product alias-preservation change was made.

[Browser evidence](browser-evidence.json), [private phone viewport](private-phone.png), [public phone viewport](public-phone.png). These are Chromium viewport/local-origin evidence, **not physical Safari/iPhone verification**. User must retest the corrected build on the actual devices.

Repeat with `npm run test:lan`; this aggregate was added for reproducibility, while its constituents ran separately. `test:phase-d-local` now includes the LAN regression after its capacity baseline. These aggregates are not retroactively claimed as executed.

Current built-output fingerprint: `87e184188a1a27872806578129dad73ba61a3ef2453a5adfaad1ff513f38251b`. Updated [offline inventory](../assets.json); [pre-fix inventory](../pre-lan-fix-assets.json) retains the initial baseline's hashes. Earlier local backend load remains separately dated and does not validate the new client startup. No Worker behavior changed, so no new Worker dry-run/backend load rerun is claimed for this fix.
