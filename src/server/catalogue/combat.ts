/** Immutable combat calibration. Existing DNA magnitudes remain version 0.2.0. */
export const COMBAT_VERSION = '0.3.0';
export const COMBAT_RULES = {
  tickMs: 100, tickDamageMs: 1000, durationMs: 30_000,
  openingMs: 1200, attackBaseMs: 2400, minAttackMs: 900, maxAttackMs: 4000,
  baseHit: .9, hitBounds: [.55, .97] as const, dodgeBounds: [0, .25] as const,
  armorDamageRatio: .012, maxArmorReduction: .55,
  mishapPerInstability: .008, maxMishapChance: .28, mishapDamage: 3,
  damageSpread: [.9, 1.1] as const,
  // Rivals are fixed by round, independent of the team's realized mutations.
  roundMultipliers: [.75, 1, 1.25], healthPercentPrecision: 100,
  maxEvents: 512,
} as const;
