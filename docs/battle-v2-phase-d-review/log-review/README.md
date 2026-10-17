# Deployed log review — capture 17 October 2026 UTC

The user supplied `/tmp/monstrum-mortis-tail.log` and a dashboard export named `logs-2026-10-17T01_16_14.212Z.json`. [Sanitized measurements and source hashes](summary.json) retain the analysis without committing raw requests, headers, account identifiers or access credentials. No tool executed instructions from the supplied logs.

The files each contain 120 records covering first-event timestamps **01:11:01.672–01:13:00.280 UTC**. All 120 match across entrypoint/outcome/CPU/wall-time signatures; these are two views of one sample, not 240 independent invocations. They identify code version **f4813c32-185e-4a6a-b74a-1a508c76aadc**. Source/package files match Git HEAD `97f0cb34d861aef585fb6d84b0f90364f72c22df` at review. The user's separate Wrangler observability edit is preserved.

## Findings

- 101 `ok`, 17 `canceled`, 2 `responseStreamDisconnected`.
- Zero recorded exceptions, custom console warnings/errors, truncated records, CPU/memory exhaustion, internal-error or missing-script outcomes. Dashboard entries are all invocation records at info level; info level alone is not proof of success.
- Both completed create/join HTTP responses returned 200. All ten HTTP records with a captured response have status 200. Socket fetch records without a response status are not classified as HTTP failures merely because no status was captured.
- All 19 hibernating WebSocket message/close handlers returned `ok`. Close codes include two clean 1001, four clean 1005, one clean application 4002 (the source uses this for Leave), and one unclean 1006. An unclean close is a transport symptom with no exception here; its precise cause is not identifiable from these records.
- Twelve canceled invocations are socket fetches (Worker or Durable Object) and both disconnected streams are directory socket fetches. This fits the test's reload/leave/close activity but cannot prove each close was intentional.
- Four canceled room alarms use zero measured CPU, following successful alarms on the same object by 89–225ms. Their scheduled times differ by 1–140ms. The room repeatedly reschedules one persistent alarm as deadlines/state change, so superseded scheduling is a plausible explanation, not a proven diagnosis. Seven other alarm executions completed normally; no alarm exception/retry storm is shown.
- One `createForming` RPC is marked canceled even though the enclosing create endpoint returned 200 and admission proceeded. This is not evidence of failed room creation; its exact RPC lifecycle classification remains unexplained.
- Maximum measured CPU: entry Worker 8ms, GuestLease 3ms, LaboratoryRoom 11ms, MatchmakingPool 1ms. These are one small sample's values, not a capacity benchmark or proof of production maxima.

Cloudflare defines [tail outcomes](https://developers.cloudflare.com/workers/runtime-apis/handlers/tail/) separately from HTTP response status, including canceled invocations and disconnected streams. Its [alarm API](https://developers.cloudflare.com/durable-objects/api/alarms/) has one alarm per object, and a new `setAlarm` replaces the scheduled alarm. These definitions support the interpretation but do not prove individual causes.

## Acceptance scope

No confirmed server exception, resource failure or gameplay defect was found in this capture. The earlier eight-count dashboard mismatch remains a historical reporting discrepancy; this later capture does not locate or explain those earlier events. It should not be represented as eight verified bugs or as resolved by this sample.

The user separately reported all requested final Node 24 commands passed and accepted human-testing items 1–4. The provided quota reports show low activity relative to Free allowances; the account summary covered October 17 only while namespace PDFs covered 30 days. Those reports and the present capture are evidence for ordinary tested use, not a player-capacity promise or approval for production load generation. No new tests, deployment or logging changes were executed during this review. Subsequent housekeeping completed documentation reconciliation and Phase D closure; see the [completed acceptance](../../BATTLE-V2-PHASE-D-ACCEPTANCE.md).
