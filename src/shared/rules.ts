/** Change rulesVersion when gameplay defaults change. Server is authoritative. */
export const GAME_RULES = {
  schemaVersion: 1,
  rulesVersion: '0.3.0',
  minPlayers: 2,
  maxPlayers: 8,
  roundsPerSession: 3,
  dosesPerPlayerPerRound: 6,
  specimensPerTray: 4,
  injectionCooldownMs: 6_000,
  experimentDurationMs: 75_000,
  briefingDurationMs: 8_000,
  releaseDurationMs: 5_000,
  maxBattleDurationMs: 30_000,
  switchLabel: 'Unleash the Creature!',
  switchMinimumInjections: 1,
  matchmaking: {
    targetMinPlayers: 4,
    targetMaxPlayers: 6,
    smallGroupWaitMs: 30_000,
    alternatePoolSuggestionMs: 60_000,
    readyCheckMs: 10_000,
    recoveryLobbyMs: 60_000,
    regions: ['americas', 'europe-africa', 'asia-pacific'],
  },
  publicResultsDurationMs: 25_000,
  publicEarlyAdvanceMinimumMs: 10_000,
  publicRegroupDurationMs: 30_000,
  reconnectGraceMs: 15_000,
  experimentRecoveryPauseMs: 30_000,
  teamSignalCooldownMs: 3_000,
  roomIdleExpiryMs: 2 * 60 * 60 * 1_000,
  roomMaxLifetimeMs: 24 * 60 * 60 * 1_000,
  score: { victory: 100, draw: 50, defeat: 0 },
  specimenCard: { width: 1080, height: 1800, localCabinetLimit: 20 },
  specimenDrawWeights: { tactical: 0.5, cosmetic: 0.25, liability: 0.25 },
} as const;

export type MatchmakingRegion = typeof GAME_RULES.matchmaking.regions[number];

/** N is locked at experiment start and never recalculated after departures. */
export function dosePotency(playerCountAtStart: number): number {
  if (!Number.isInteger(playerCountAtStart)
    || playerCountAtStart < GAME_RULES.minPlayers
    || playerCountAtStart > GAME_RULES.maxPlayers) {
    throw new RangeError('A round must start with 2–8 players.');
  }
  return GAME_RULES.minPlayers / playerCountAtStart;
}
