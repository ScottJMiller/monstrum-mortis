import type { StoredRoom } from './room-model.ts';
import { dna, newExperiment } from './dna-mechanics.ts';
import { DNA_VERSION } from './catalogue/mechanics.ts';
import { GAME_RULES } from '../shared/rules.ts';
import { ServiceError, UUID } from './validation.ts';
import { STAT_BOUNDS } from './catalogue/mechanics.ts';

/** Application JSON migration only; preserve deployed class/namespace identities. */
export function migrateRoom(value: unknown): StoredRoom {
  if (!value || typeof value !== 'object') throw new ServiceError('temporarily-unavailable', 'Invalid stored room.', 503);
  const r = value as StoredRoom; const version = (value as { schemaVersion: number }).schemaVersion;
  if (![2, 3, 4].includes(version) || typeof r.id !== 'string' || typeof r.secret !== 'string' || !Array.isArray(r.seats) || !Array.isArray(r.lockedPlayerIds) || !Array.isArray(r.reservations) || !Number.isSafeInteger(r.revision)) throw new ServiceError('temporarily-unavailable', 'Unsupported or corrupt stored room schema.', 503);
  if (version === 2) r.publicState = null;
  if (version !== 4) {
    r.schemaVersion = 4; r.experiment = r.phase === 'briefing' ? newExperiment() : null; r.legacyRulesVersion = '0.1.0';
    for (const s of r.seats) { s.tray = []; s.drawPlan = []; s.drawCursor = 0; s.switchPulled = false; s.finishReason = s.finished ? 'legacy' : null; }
  }
  if (r.experiment) {
    const e = r.experiment;
    if (e.catalogueVersion !== DNA_VERSION || e.rulesVersion !== GAME_RULES.rulesVersion || !UUID.test(e.id) || !UUID.test(e.compositionSeed) || !e.active || Array.isArray(e.active) || !Array.isArray(e.history) || e.history.length > 48) throw new ServiceError('temporarily-unavailable', 'Unsupported stored mechanics version.', 503);
    for (const [slot, p] of Object.entries(e.active)) {
      const definition = dna(p.dnaId);
      if (!definition.targets.some(target => target === slot) || !Array.isArray(p.contributions) || !p.contributions.length || p.contributions.length > 48 || p.contributions.some(c => !UUID.test(c.injectionId) || typeof c.playerId !== 'string' || !Number.isFinite(c.units) || c.units <= 0 || c.units > 1)) throw new ServiceError('temporarily-unavailable', 'Invalid stored mutation contributions.', 503);
    }
    for (const h of e.history) dna(h.dnaId);
    for (const s of r.seats) {
      if ((s.tray !== undefined && (!Array.isArray(s.tray) || ![0, 4].includes(s.tray.length))) || (s.drawPlan !== undefined && (!Array.isArray(s.drawPlan) || ![0, 6].includes(s.drawPlan.length))) || !Number.isInteger(s.drawCursor ?? 0) || (s.drawCursor ?? 0) < 0 || (s.drawCursor ?? 0) > 6 || !Number.isInteger(s.remainingDoses) || s.remainingDoses < 0 || s.remainingDoses > 6 || !Number.isFinite(s.nextInjectionAtMs)) throw new ServiceError('temporarily-unavailable', 'Invalid stored specimen plan.', 503);
      for (const specimen of s.tray ?? []) { dna(specimen.dnaId); if (!UUID.test(specimen.specimenId) || typeof specimen.accession !== 'string') throw new ServiceError('temporarily-unavailable', 'Invalid stored specimen identity.', 503); }
      for (const packet of s.drawPlan ?? []) { dna(packet.primary); if (dna(packet.safe).family === 'liability') throw new ServiceError('temporarily-unavailable', 'Invalid stored safe draw.', 503); }
    }
    if (e.frozen) {
      const f = e.frozen;
      if (f.attemptId !== e.id || f.rulesVersion !== e.rulesVersion || f.catalogueVersion !== e.catalogueVersion || f.playerCount !== r.playerCountAtExperimentStart || !Number.isFinite(f.releasedAtMs) || !['deadline', 'unanimous'].includes(f.reason) || !f.creature || !Array.isArray(f.abilities) || !Array.isArray(f.history)) throw new ServiceError('temporarily-unavailable', 'Invalid frozen creature version.', 503);
      for (const [key, bounds] of Object.entries(STAT_BOUNDS)) { const value = f.stats?.[key as keyof typeof f.stats]; if (typeof value !== 'number' || !Number.isFinite(value) || value < bounds[0] || value > bounds[1]) throw new ServiceError('temporarily-unavailable', 'Invalid frozen creature stats.', 503); }
    }
  } else if (r.experiment !== null) throw new ServiceError('temporarily-unavailable', 'Invalid stored experiment.', 503);
  return r;
}
