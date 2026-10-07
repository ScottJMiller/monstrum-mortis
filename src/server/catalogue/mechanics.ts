import type { CreatureStats } from '../../shared/types.ts';

/** Hidden calibration, frozen for the future producer; no battle execution here. */
export const DNA_VERSION = '0.2.0';
export const BASE_STATS: CreatureStats = { vitality: 100, power: 10, protection: 10, agility: 10, regeneration: 0, instability: 0 };
export const STAT_BOUNDS: Record<keyof CreatureStats, readonly [number, number]> = {
  vitality: [40, 240], power: [2, 40], protection: [0, 40], agility: [2, 24], regeneration: [0, 8], instability: [0, 40],
};
export type AbilityKind = 'cadence' | 'bleed' | 'miss-vulnerability' | 'restraint' | 'poison' | 'electric-strike' | 'armor-reduction' | 'contact-retaliation' | 'accuracy' | 'attack-delay' | 'restraint-resistance' | 'landing-recovery' | 'slowing-slick' | 'crawling-distraction' | 'accelerated-attack' | 'shard-retaliation' | 'lost-action';
export interface AbilityDefinition { kind: AbilityKind; magnitude: number; unit: 'ratio' | 'damage' | 'damage/second' | 'seconds' | 'protection'; lifetimeMs?: number }
export const ABILITY_BOUNDS: Record<AbilityKind, readonly [number, number]> = {
  cadence: [-.4, .5], bleed: [0, 4], 'miss-vulnerability': [0, .35], restraint: [0, 2], poison: [0, 4],
  'electric-strike': [0, 10], 'armor-reduction': [0, 6], 'contact-retaliation': [0, 4], accuracy: [-.25, .2],
  'attack-delay': [0, 2], 'restraint-resistance': [0, .5], 'landing-recovery': [0, .5], 'slowing-slick': [0, .3],
  'crawling-distraction': [0, 2], 'accelerated-attack': [0, .35], 'shard-retaliation': [0, 2], 'lost-action': [0, .35],
};
export const PRODUCER_CONSTRAINTS = { maxControlDuty: .35, sameControlImmunityMs: 5000, recursiveRetaliation: false } as const;
export function clamp(value: number, bounds: readonly [number, number]) { return Math.max(bounds[0], Math.min(bounds[1], value)); }
export function diminishing(u: number): number { return Math.min(u, 1) + .5 * Math.min(Math.max(u - 1, 0), 1) + .25 * Math.min(Math.max(u - 2, 0), 2); }
