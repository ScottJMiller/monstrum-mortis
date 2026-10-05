import type {
  BattleTimeline, CardRecord, ControllerSnapshot, PlayerId, QueueMode,
  QueueStatus, RoomSnapshot, SpecimenId, TeamSignal,
} from './types.ts';
import type { MatchmakingRegion } from './rules.ts';

export const PROTOCOL_VERSION = 1 as const;

interface ClientEnvelope {
  protocolVersion: typeof PROTOCOL_VERSION;
  actionId: string;
}

/** Intent only. Authentication is server-issued session context, never playerId supplied by a client. */
export type ClientAction = ClientEnvelope & (
  | { kind: 'inject'; specimenId: SpecimenId }
  | { kind: 'pull-switch' }
  | { kind: 'team-signal'; signal: TeamSignal }
  | { kind: 'start-private-session' }
  | { kind: 'advance-private-round' }
  | { kind: 'next-round-ready' }
  | { kind: 'vote-specimen-name'; suggestionId: string }
  | { kind: 'rename-private-specimen'; title: string }
  | { kind: 'queue-enter'; region: MatchmakingRegion; mode: QueueMode }
  | { kind: 'queue-cancel'; ticketId: string }
  | { kind: 'match-ready'; readyCheckId: string }
  | { kind: 'public-replay-opt-in' }
  | { kind: 'leave' }
  | { kind: 'sync-request'; afterRevision: number }
);

interface ServerEnvelope {
  protocolVersion: typeof PROTOCOL_VERSION;
  serverTimeMs: number;
}

export type ActionErrorCode = 'not-implemented' | 'unauthorized' | 'invalid-action'
  | 'room-full' | 'room-expired' | 'wrong-phase' | 'cooldown'
  | 'no-doses' | 'switch-locked' | 'deadline-passed' | 'stale-session';

/** Runtime validation, session verification, and replay-safe dispatch arrive in steps 2–3. */
export type ServerMessage = ServerEnvelope & (
  | { kind: 'room-snapshot'; snapshot: RoomSnapshot }
  | { kind: 'controller-snapshot'; snapshot: ControllerSnapshot }
  | { kind: 'action-accepted'; actionId: string; revision: number }
  | { kind: 'action-rejected'; actionId: string; code: ActionErrorCode; message: string }
  | { kind: 'queue-status'; status: QueueStatus }
  | { kind: 'team-signal'; playerId: PlayerId; signal: TeamSignal }
  | { kind: 'battle-timeline'; timeline: BattleTimeline }
  | { kind: 'card-record'; card: CardRecord }
);
