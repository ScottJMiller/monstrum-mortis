import { GAME_RULES, dosePotency } from '../shared/rules.ts';
import type { BodySlot, CreatureStats, CreatureView, MutationView } from '../shared/types.ts';
import { DNA_CATALOGUE } from './catalogue/dna.ts';
import { ABILITY_BOUNDS, BASE_STATS, DNA_VERSION, PRODUCER_CONSTRAINTS, STAT_BOUNDS, clamp, diminishing } from './catalogue/mechanics.ts';
import type { AbilityDefinition } from './catalogue/mechanics.ts';
import clues from '../assets/specimen-clues.json' with { type: 'json' };
import type { Seat, StoredRoom } from './room-model.ts';
import { ServiceError } from './validation.ts';

export interface Specimen { specimenId: string; dnaId: string; accession: string }
export interface DrawPacket { primary: string; safe: string }
export interface Contribution { injectionId: string; playerId: string; units: number }
export interface ActivePart { dnaId: string; contributions: Contribution[] }
export interface MutationRecord { actionId: string; dnaId: string; playerId: string; alias: string; atMs: number; targets: BodySlot[] }
export interface FrozenAbility extends AbilityDefinition { sourceDnaIds: string[]; contributors: { playerId: string; weight: number }[] }
export interface FrozenCreature {
  attemptId: string; rulesVersion: string; catalogueVersion: string; playerCount: number; releasedAtMs: number;
  reason: 'unanimous' | 'deadline'; creature: CreatureView; stats: CreatureStats; abilities: FrozenAbility[];
  constraints: typeof PRODUCER_CONSTRAINTS; active: Partial<Record<BodySlot, ActivePart>>; history: MutationRecord[];
}
export interface Experiment {
  id: string; rulesVersion: string; catalogueVersion: string; compositionSeed: string;
  active: Partial<Record<BodySlot, ActivePart>>; history: MutationRecord[]; frozen: FrozenCreature | null;
}
export const dna = (id: string) => {
  const definition = DNA_CATALOGUE.find(d => d.id === id);
  if (!definition) throw new ServiceError('temporarily-unavailable', 'Unsupported stored DNA definition.', 503);
  return definition;
};
const entropy = () => crypto.getRandomValues(new Uint32Array(1))[0]! / 0x1_0000_0000;
export function newExperiment(): Experiment {
  return { id: crypto.randomUUID(), rulesVersion: GAME_RULES.rulesVersion, catalogueVersion: DNA_VERSION, compositionSeed: crypto.randomUUID(), active: {}, history: [], frozen: null };
}
export function draw(random = entropy, safe = false): string {
  const roll = random();
  const { tactical, cosmetic } = GAME_RULES.specimenDrawWeights;
  const family = safe ? (roll < tactical / (tactical + cosmetic) ? 'tactical' : 'cosmetic') : (roll < tactical ? 'tactical' : roll < tactical + cosmetic ? 'cosmetic' : 'liability');
  const choices = DNA_CATALOGUE.filter(d => d.family === family);
  return choices[Math.floor(random() * choices.length)]!.id;
}
export function prepareHand(random = entropy): { tray: Specimen[]; drawPlan: DrawPacket[] } {
  const initial = Array.from({ length: GAME_RULES.specimensPerTray }, () => draw(random));
  if (initial.every(id => dna(id).family === 'liability')) initial[3] = draw(random, true);
  return { tray: initial.map(specimen), drawPlan: Array.from({ length: GAME_RULES.dosesPerPlayerPerRound }, () => ({ primary: draw(random), safe: draw(random, true) })) };
}
function specimen(dnaId: string): Specimen {
  // Accession and ownership IDs deliberately contain no DNA/draw identifiers.
  return { dnaId, specimenId: crypto.randomUUID(), accession: `MM-${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
}
export function initializeExperiment(r: StoredRoom) {
  if (!r.experiment) return; // Legacy service-only experiment: do not retrofit a budget.
  for (const seat of r.seats) {
    seat.tray = []; seat.drawPlan = []; seat.drawCursor = 0; seat.switchPulled = false; seat.finishReason = null;
    seat.remainingDoses = 0; seat.nextInjectionAtMs = 0;
    if (seat.role === 'player' && seat.eligible && !seat.departed) {
      Object.assign(seat, prepareHand()); seat.remainingDoses = GAME_RULES.dosesPerPlayerPerRound;
      seat.injectionsThisRound = 0; seat.interactedThisRound = false;
    }
  }
}
export function privateSpecimens(seat: Seat) {
  return (seat.tray ?? []).map(s => {
    const clue = clues.find(c => c.id === dna(s.dnaId).clueId)!;
    return { specimenId: s.specimenId, accession: s.accession, clueAssetId: clue.id, accessibleClue: clue.description };
  });
}
function round6(n: number) { return Math.round(n * 1_000_000) / 1_000_000; }
function weights(contributions: Contribution[]) {
  const totals = new Map<string, number>();
  for (const c of contributions) totals.set(c.playerId, (totals.get(c.playerId) ?? 0) + c.units);
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([playerId, value]) => ({ playerId, weight: value / sum }));
}
export function effectiveCreature(e: Experiment): { stats: CreatureStats; abilities: FrozenAbility[] } {
  const stats = { ...BASE_STATS }; const byDna = new Map<string, { potency: number; contributions: Contribution[] }>();
  for (const part of Object.values(e.active)) {
    const definition = dna(part.dnaId); const share = 1 / definition.targets.length;
    const u = part.contributions.reduce((sum, c) => sum + c.units, 0);
    const own = byDna.get(part.dnaId) ?? { potency: 0, contributions: [] };
    own.potency += share * diminishing(u / share); own.contributions.push(...part.contributions); byDna.set(part.dnaId, own);
  }
  const byAbility = new Map<string, { definition: AbilityDefinition; magnitude: number; sources: string[]; contributions: Contribution[] }>();
  for (const [id, contribution] of byDna) {
    const definition = dna(id);
    for (const [key, value] of Object.entries(definition.deltas)) stats[key as keyof CreatureStats] += value * contribution.potency;
    for (const ability of definition.abilities) {
      const combined = byAbility.get(ability.kind) ?? { definition: ability, magnitude: 0, sources: [], contributions: [] };
      combined.magnitude += ability.magnitude * contribution.potency; combined.sources.push(id); combined.contributions.push(...contribution.contributions);
      byAbility.set(ability.kind, combined);
    }
  }
  for (const key of Object.keys(stats) as (keyof CreatureStats)[]) stats[key] = round6(clamp(stats[key], STAT_BOUNDS[key]));
  const abilities = [...byAbility.values()].map(a => ({ ...a.definition, magnitude: round6(clamp(a.magnitude, ABILITY_BOUNDS[a.definition.kind])), sourceDnaIds: a.sources, contributors: weights(a.contributions) }));
  return { stats, abilities };
}
export function publicCreature(e: Experiment): CreatureView {
  if (e.frozen) return structuredClone(e.frozen.creature);
  const parts: CreatureView['parts'] = [];
  const body = e.active.body; const skin = e.active.skin;
  const fullBody = body && dna(body.dnaId).renderSlot === 'body';
  const candle = skin?.dnaId === 'candle-flesh';
  const base = (slot: BodySlot, assetId: string) => parts.push({ instanceId: `base:${slot}`, slot, assetId, scale: 1, variant: 0, contributorIds: [] });
  if (!fullBody && !candle) base('body', 'creature.blob');
  if (!e.active.eyes) base('eyes', 'creature.eyes');
  if (!e.active.mouth) base('mouth', 'creature.mouth');
  for (const [slot, part] of Object.entries(e.active) as [BodySlot, ActivePart][]) {
    const definition = dna(part.dnaId);
    parts.push({ instanceId: `${e.id}:${slot}`, slot: slot === 'forelimb-right' ? slot : definition.renderSlot,
      assetId: `mutation.${part.dnaId}`, variant: part.contributions.length - 1, scale: Math.min(1.3, 1 + .075 * (part.contributions.length - 1)),
      contributorIds: [...new Set(part.contributions.map(c => c.playerId))].sort(),
      ...(candle && fullBody && slot === 'skin' ? { opacity: .45, layerOffset: 1 } : {}),
    });
  }
  return { compositionSeed: e.compositionSeed, parts, revealedMutationIds: [...new Set(e.history.map(h => h.dnaId))] };
}
export function publicHistory(e: Experiment): MutationView[] {
  const priorOwners: Partial<Record<BodySlot, string>> = {};
  return e.history.map((h, index) => {
    const surviving = Object.values(e.active).filter(p => p.contributions.some(c => c.injectionId === h.actionId)).length;
    const change = h.targets.some(slot => priorOwners[slot] && priorOwners[slot] !== h.dnaId) ? 'replaced' : h.targets.some(slot => priorOwners[slot] === h.dnaId) ? 'reinforced' : 'added';
    for (const slot of h.targets) priorOwners[slot] = h.dnaId;
    return { sequence: index + 1, injectionId: h.actionId, playerId: h.playerId, alias: h.alias, name: dna(h.dnaId).autopsyName,
      atMs: h.atMs, change, status: surviving === 0 ? 'replaced' : surviving < h.targets.length ? 'partial' : 'active' };
  });
}
export function readings(e: Experiment): Record<keyof CreatureStats, 'low' | 'moderate' | 'high'> {
  const stats = e.frozen?.stats ?? effectiveCreature(e).stats;
  return Object.fromEntries((Object.keys(stats) as (keyof CreatureStats)[]).map(key => {
    const range = STAT_BOUNDS[key]; const fraction = (stats[key] - range[0]) / (range[1] - range[0]);
    return [key, fraction < 1 / 3 ? 'low' : fraction < 2 / 3 ? 'moderate' : 'high'];
  })) as Record<keyof CreatureStats, 'low' | 'moderate' | 'high'>;
}
export function applyMutation(e: Experiment, id: string, playerId: string, alias: string, actionId: string, now: number, n: number) {
  if (e.frozen || e.history.length >= 48) throw new ServiceError('wrong-phase', 'This specimen is frozen.', 409);
  const definition = dna(id); const share = dosePotency(n) / definition.targets.length;
  for (const target of definition.targets) {
    const prior = e.active[target];
    const part = prior?.dnaId === id ? prior : { dnaId: id, contributions: [] };
    part.contributions.push({ injectionId: actionId, playerId, units: share }); e.active[target] = part;
  }
  e.history.push({ actionId, dnaId: id, playerId, alias, atMs: now, targets: [...definition.targets] });
}
function requireAction(r: StoredRoom, seat: Seat, attemptId: string, now: number) {
  if (!r.experiment || r.experiment.id !== attemptId) throw new ServiceError('stale-session', 'This experiment changed. Synchronize before acting.', 409);
  if (r.experiment.frozen) throw new ServiceError('wrong-phase', 'The released creature is frozen.', 409);
  if (r.phase === 'experiment' && r.phaseDeadlineMs !== null && now >= r.phaseDeadlineMs) throw new ServiceError('deadline-passed', 'The experiment deadline passed.', 409);
  if (r.phase !== 'experiment' || r.recovery || seat.role !== 'player' || !seat.connected || !seat.eligible || seat.finished || seat.departed) throw new ServiceError('wrong-phase', 'Your injections are locked in this phase.', 409);
  if (now < seat.nextInjectionAtMs) throw new ServiceError('cooldown', 'Wait for your current cooldown.', 409);
}
export function inject(r: StoredRoom, seat: Seat, attemptId: string, specimenId: string, actionId: string, now: number) {
  requireAction(r, seat, attemptId, now);
  if (seat.remainingDoses <= 0) throw new ServiceError('no-doses', 'Your six doses are spent. You may still pull the switch after cooldown.', 409);
  const index = seat.tray?.findIndex(s => s.specimenId === specimenId) ?? -1;
  if (index < 0) throw new ServiceError('invalid-action', 'Select a specimen from your own current tray.', 409);
  const packet = seat.drawPlan?.[seat.drawCursor ?? 0];
  if (!packet || !r.playerCountAtExperimentStart) throw new ServiceError('temporarily-unavailable', 'Stored specimen plan is unavailable.', 503);
  const allLiability = seat.tray!.filter((_, i) => i !== index).every(s => dna(s.dnaId).family === 'liability') && dna(packet.primary).family === 'liability';
  const replacement = specimen(allLiability ? packet.safe : packet.primary);
  applyMutation(r.experiment!, seat.tray![index]!.dnaId, seat.id, seat.alias, actionId, now, r.playerCountAtExperimentStart);
  seat.tray![index] = replacement; seat.drawCursor = (seat.drawCursor ?? 0) + 1;
  seat.remainingDoses--; seat.injectionsThisRound = (seat.injectionsThisRound ?? 0) + 1;
  seat.interactedThisRound = true; seat.nextInjectionAtMs = now + GAME_RULES.injectionCooldownMs;
  r.lastActivityAtMs = now; r.revision++;
}
export function beginRelease(r: StoredRoom, now: number, reason: FrozenCreature['reason']) {
  if (r.phase !== 'experiment') return;
  if (r.experiment && !r.experiment.frozen) {
    const e = r.experiment;
    e.frozen = { attemptId: e.id, rulesVersion: e.rulesVersion, catalogueVersion: e.catalogueVersion, playerCount: r.playerCountAtExperimentStart!,
      releasedAtMs: now, reason, creature: publicCreature(e), ...effectiveCreature(e), constraints: { ...PRODUCER_CONSTRAINTS }, active: structuredClone(e.active), history: structuredClone(e.history) };
  }
  r.phase = 'release'; r.phaseDeadlineMs = now + GAME_RULES.releaseDurationMs; r.revision++;
}
export function pullSwitch(r: StoredRoom, seat: Seat, attemptId: string, now: number) {
  requireAction(r, seat, attemptId, now);
  if ((seat.injectionsThisRound ?? 0) < GAME_RULES.switchMinimumInjections) throw new ServiceError('switch-locked', 'Inject at least once before pulling the switch.', 409);
  seat.switchPulled = true; seat.finished = true; seat.finishReason = 'switch'; seat.remainingDoses = 0;
  seat.interactedThisRound = true; r.lastActivityAtMs = now; r.revision++;
  if (r.lockedPlayerIds.every(id => r.seats.find(s => s.id === id)?.finished)) beginRelease(r, now, 'unanimous');
}
