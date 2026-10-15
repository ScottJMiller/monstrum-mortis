import { INTEGRATED_RULES,VOTED_FAMILIES } from '../shared/integrated-form.ts';
import type { IntegratedForm, IntegratedModifiers, VotedFamily } from '../shared/integrated-form.ts';
import type { FrozenCreature } from './dna-mechanics.ts';
import { GAME_RULES } from '../shared/rules.ts';

/** Server entropy adapter. Current callers are development fixtures/tests; Phase C room integration remains unauthorized. */
export const serverUint32 = () => crypto.getRandomValues(new Uint32Array(1))[0]!;
export function uniformIndex(count: number, entropy: () => number): number {
 if (!Number.isInteger(count) || count < 1 || count > VOTED_FAMILIES.length) throw new RangeError('Invalid tie count');
 if (count === 1) return 0;
 const ceiling = Math.floor(0x1_0000_0000 / count) * count;
 for (let tries = 0; tries < 1024; tries++) {
  const value = entropy();
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) throw new RangeError('Entropy must be uint32');
  if (value < ceiling) return value % count;
 }
 throw new Error('Entropy source did not produce an accepted bucket');
}
/** Pure projection of logical survivors. Never use history, art slots or client entropy. */
export function selectIntegratedForm(frozen: Pick<FrozenCreature, 'active' | 'attemptId' | 'releasedAtMs'>, entropy = serverUint32): IntegratedForm {
 const ids = new Set(Object.values(frozen.active).map(part => part.dnaId));
 const votes: Record<VotedFamily, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, blob:0 };
 const modifiers = new Set<string>();
 for (const id of ids) {
  const rule = INTEGRATED_RULES[id];
  if (!rule) throw new Error(`Unsupported presentation DNA: ${id}`);
  if (rule.vote) votes[rule.vote]++;
  if (rule.modifier) modifiers.add(rule.modifier);
 }
 const maximum = Math.max(...Object.values(votes));
 const tied = VOTED_FAMILIES.filter(f => votes[f] === maximum);
 // Existing target competition makes multiple surface overlays impossible; fail closed on corrupt fixtures.
 const overlays = (['barbs', 'veins', 'mouths'] as const).filter(m => modifiers.has(m));
 if (overlays.length > 1) throw new Error('Conflicting active skin overlays');
 const m: IntegratedModifiers = {
  scale: modifiers.has('titan') ? 1.1 : 1,
  tint: modifiers.has('red') && modifiers.has('green') ? 'combined' : modifiers.has('red') ? 'red' : modifiers.has('green') ? 'green' : 'none',
  overlay: overlays[0] ?? 'none', growth: modifiers.has('growth'), tremor: modifiers.has('tremor'),
 };
 return { version: 'battle-v2-b2', attemptId: frozen.attemptId, family: maximum ? tied[uniformIndex(tied.length, entropy)]! : 'blob',
  votes, modifiers: m, integration: { startsAtMs: frozen.releasedAtMs, endsAtMs: frozen.releasedAtMs + GAME_RULES.releaseDurationMs } };
}
