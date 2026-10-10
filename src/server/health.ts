import { GAME_RULES } from '../shared/rules.ts';
import type { HealthResponse } from '../shared/types.ts';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';

export function createHealth(bindings: {
  ASSETS?: unknown;
  ROOMS?: unknown;
  MATCHMAKING?: unknown;
  GUEST_LEASES?: unknown;
}): HealthResponse {
  return {
    service: 'monstrum-mortis',
    stage: 'automatic-combat',
    protocolVersion: PROTOCOL_VERSION,
    rulesVersion: GAME_RULES.rulesVersion,
    configuredBindings: {
      assets: Boolean(bindings.ASSETS),
      rooms: Boolean(bindings.ROOMS),
      matchmaking: Boolean(bindings.MATCHMAKING),
      guestLeases: Boolean(bindings.GUEST_LEASES),
    },
    gameplayAvailable: true,
    fullReleaseAvailable: false,
    mechanicsAvailable: true,
    combatAvailable: true,
    roomServiceAvailable: true,
    matchmakingAvailable: true,
  };
}
