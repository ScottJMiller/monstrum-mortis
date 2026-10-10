import type { BattleTimeline } from '../shared/types.ts';
/** Seek the authoritative timeline directly. Reconnect and dropped frames never enqueue animations. */
export function battleFrame(timeline: BattleTimeline, serverNowMs: number) {
 const elapsed=Math.max(0,Math.min(timeline.durationMs,serverNowMs-timeline.startsAtMs));
 const visible=timeline.events.filter(event=>event.offsetMs<=elapsed);
 const last=visible.at(-1);
 return {elapsed,teamHealth:last?.teamHealth??100,rivalHealth:last?.rivalHealth??100,
  creature:visible.findLast(event=>event.creature)?.creature??timeline.initialCreature,
  recent:visible.filter(event=>elapsed-event.offsetMs<=800).slice(-6), captions:visible.slice(-3), visible};
}
