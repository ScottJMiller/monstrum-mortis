import { GAME_RULES } from '../shared/rules.ts';
import type { HealthResponse } from '../shared/types.ts';

export function createHealth(bindings: {
  ASSETS?: unknown;
  ROOMS?: unknown;
  MATCHMAKING?: unknown;
  GUEST_LEASES?: unknown;
}): HealthResponse {
  return {
    service: 'monstrum-mortis',
    stage: 'foundation',
    protocolVersion: 1,
    rulesVersion: GAME_RULES.rulesVersion,
    configuredBindings: {
      assets: Boolean(bindings.ASSETS),
      rooms: Boolean(bindings.ROOMS),
      matchmaking: Boolean(bindings.MATCHMAKING),
      guestLeases: Boolean(bindings.GUEST_LEASES),
    },
    gameplayAvailable: false,
  };
}
