import type {
  CreatureStats, GuestId, PlayerId, QueueMode, RoomSnapshot, SpecimenId,
} from '../shared/types.ts';
import type { MatchmakingRegion } from '../shared/rules.ts';

/** Server-only persistence contracts. Never broadcast these records to clients. */
export interface SpecimenRecord {
  specimenId: SpecimenId;
  dnaId: string;
}

export interface PrivateSeatRecord {
  playerId: PlayerId;
  guestId: GuestId;
  reconnectTokenHash: string;
  tray: SpecimenRecord[];
  pendingDrawDnaIds: string[];
  remainingDoses: number;
  nextInjectionAtMs: number;
  lastActivityAtMs: number;
}

export interface RoomRecord {
  schemaVersion: 1;
  publicSnapshot: RoomSnapshot;
  seats: PrivateSeatRecord[];
  playerCountAtExperimentStart: number | null;
  authoritativeStats: CreatureStats | null;
  battleSeed: string | null;
  createdAtMs: number;
  expiresAtMs: number;
}

export interface QueueTicketRecord {
  schemaVersion: 1;
  ticketId: string;
  guestId: GuestId;
  region: MatchmakingRegion;
  mode: QueueMode;
  enteredAtMs: number;
  state: 'waiting' | 'ready-check' | 'reserved' | 'inactive';
  reservationId: string | null;
  expiresAtMs: number;
}

export interface GuestLeaseRecord {
  schemaVersion: 1;
  guestId: GuestId;
  holder: { kind: 'queue' | 'room'; id: string } | null;
  revision: number;
  expiresAtMs: number;
}
