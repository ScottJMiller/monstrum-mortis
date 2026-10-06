import { GAME_RULES } from '../shared/rules.ts';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { ControllerSnapshot, PresentationMode, RoomPhase, RoomSnapshot } from '../shared/types.ts';
import { ServiceError } from './validation.ts';

export interface Seat {
  id: string;
  guestId: string | null;
  alias: string;
  symbol: string;
  role: 'player' | 'display';
  operationHash: string;
  entryFingerprint: string;
  tokenHash: string;
  joinedAtMs: number;
  connectedAtMs: number | null;
  connected: boolean;
  disconnectDeadlineMs: number | null;
  eligible: boolean;
  finished: boolean;
  departed: boolean;
  // Mechanics remain empty until step 5. Never project this record wholesale.
  remainingDoses: number;
  nextInjectionAtMs: number;
}
export interface AdmissionReservation {
  id: string;
  guestId: string;
  alias: string;
  tokenHash: string;
  expiresAtMs: number;
  cancelled: boolean;
  consumedByOperationHash: string | null;
}
export interface StoredRoom {
  schemaVersion: 2;
  id: string;
  visibility: 'private' | 'public';
  presentation: PresentationMode;
  secret: string;
  creationHash: string;
  creationFingerprint: string;
  createdAtMs: number;
  lastActivityAtMs: number;
  revision: number;
  phase: RoomPhase;
  round: 1 | 2 | 3 | null;
  phaseDeadlineMs: number | null;
  hostId: string | null;
  seats: Seat[];
  reservations: AdmissionReservation[];
  lockedPlayerIds: string[];
  playerCountAtExperimentStart: number | null;
  recovery: { remainingMs: number; deadlineMs: number } | null;
}
export function newRoom(id: string, visibility: StoredRoom['visibility'], presentation: PresentationMode, secret: string, creationHash: string, creationFingerprint: string, now: number): StoredRoom {
  return { schemaVersion: 2, id, visibility, presentation, secret, creationHash, creationFingerprint, createdAtMs: now, lastActivityAtMs: now, revision: 0, phase: 'lobby', round: null, phaseDeadlineMs: null, hostId: null, seats: [], reservations: [], lockedPlayerIds: [], playerCountAtExperimentStart: null, recovery: null };
}
export const livePlayers = (r: StoredRoom) => r.seats.filter(s => s.role === 'player' && !s.departed);
export const connectedPlayers = (r: StoredRoom) => livePlayers(r).filter(s => s.connected);
export const expiresAt = (r: StoredRoom) => Math.min(r.createdAtMs + GAME_RULES.roomMaxLifetimeMs, r.lastActivityAtMs + GAME_RULES.roomIdleExpiryMs);
export function requireLive(r: StoredRoom, now: number) {
  if (r.phase === 'closed' || now >= expiresAt(r)) throw new ServiceError('room-expired', 'This laboratory has expired.', 410);
}
export function snapshot(r: StoredRoom, now: number): RoomSnapshot {
  return {
    protocolVersion: PROTOCOL_VERSION, rulesVersion: GAME_RULES.rulesVersion, revision: r.revision, serverTimeMs: now,
    roomId: r.id, visibility: r.visibility, presentation: r.presentation, phase: r.phase, round: r.round,
    phaseDeadlineMs: r.phaseDeadlineMs, hostPlayerId: r.hostId,
    players: livePlayers(r).map(s => ({ playerId: s.id, alias: s.alias, symbol: s.symbol, connected: s.connected, finishedThisRound: s.finished, injectionsThisRound: 0, waitingForNextRound: !s.eligible && r.phase !== 'lobby' })),
    creature: null, teamScore: 0,
    recoveryDeadlineMs: r.recovery?.deadlineMs ?? null,
    playerCountAtExperimentStart: r.playerCountAtExperimentStart,
    mechanicsAvailable: false,
  };
}
export function controller(s: Seat): ControllerSnapshot | null {
  return s.role === 'display' ? null : { playerId: s.id, tray: [], remainingDoses: s.remainingDoses, nextInjectionAtMs: s.nextInjectionAtMs, switchPulled: s.finished };
}
export function touch(r: StoredRoom, now: number) { r.lastActivityAtMs = now; }
export function setPhase(r: StoredRoom, phase: RoomPhase, deadline: number | null) { r.phase = phase; r.phaseDeadlineMs = deadline; r.revision++; }
export function startRound(r: StoredRoom, now: number) {
  const players = connectedPlayers(r);
  if (players.length < GAME_RULES.minPlayers) throw new ServiceError('not-enough-players', 'At least two connected players are required.', 409);
  r.round = r.phase === 'lobby' ? 1 : ((r.round ?? 0) + 1) as 1 | 2 | 3;
  r.lockedPlayerIds = players.map(s => s.id);
  r.playerCountAtExperimentStart = null;
  r.recovery = null;
  for (const seat of livePlayers(r)) { seat.eligible = players.includes(seat); seat.finished = false; seat.remainingDoses = 0; }
  setPhase(r, 'briefing', now + GAME_RULES.briefingDurationMs);
}
export function connect(r: StoredRoom, seat: Seat, now: number) {
  requireLive(r, now);
  seat.connected = true; seat.connectedAtMs = now; seat.disconnectDeadlineMs = null;
  if (r.visibility === 'private' && !r.hostId && seat.role === 'player') r.hostId = seat.id;
  // A return after grace does not undo finished for this attempt.
  if (r.recovery && connectedPlayers(r).filter(s => s.eligible).length >= GAME_RULES.minPlayers) {
    const remaining = r.recovery.remainingMs; r.recovery = null;
    r.phaseDeadlineMs = now + remaining;
  }
  touch(r, now); r.revision++;
}
export function disconnect(r: StoredRoom, seat: Seat, now: number, explicit = false) {
  if (seat.departed) return;
  seat.connected = false; seat.connectedAtMs = null;
  seat.disconnectDeadlineMs = explicit ? now : now + GAME_RULES.reconnectGraceMs;
  if (explicit) { seat.departed = true; seat.finished = true; }
  r.revision++;
}
function transferHost(r: StoredRoom) {
  if (r.visibility !== 'private') { r.hostId = null; return; }
  r.hostId = connectedPlayers(r).sort((a, b) => (a.connectedAtMs! - b.connectedAtMs!) || (a.joinedAtMs - b.joinedAtMs) || a.id.localeCompare(b.id))[0]?.id ?? null;
}
/** Catch up persisted deadlines in chronological order, including delayed alarms. */
export function settle(r: StoredRoom, now: number): boolean {
  const revision = r.revision;
  if (now >= expiresAt(r)) { if (r.phase !== 'closed') setPhase(r, 'closed', null); return r.revision !== revision; }
  for (let i = 0; i < 64; i++) {
    const grace = r.seats.filter(s => s.disconnectDeadlineMs !== null).reduce((min, s) => Math.min(min, s.disconnectDeadlineMs!), Infinity);
    const phase = r.phaseDeadlineMs ?? Infinity;
    const recovery = r.recovery?.deadlineMs ?? Infinity;
    const next = Math.min(grace, phase, recovery);
    if (next > now || !Number.isFinite(next)) break;
    if (grace === next) {
      let hostLost = false;
      for (const s of r.seats) {
        if (s.disconnectDeadlineMs !== null && s.disconnectDeadlineMs <= next) {
          s.disconnectDeadlineMs = null; s.finished = true;
          if (s.id === r.hostId) hostLost = true;
          r.revision++;
        }
      }
      if (hostLost) transferHost(r);
      if (r.phase === 'experiment' && !r.recovery) {
        if (connectedPlayers(r).filter(s => s.eligible).length < GAME_RULES.minPlayers) {
          r.recovery = { remainingMs: Math.max(0, (r.phaseDeadlineMs ?? next) - next), deadlineMs: next + GAME_RULES.experimentRecoveryPauseMs };
          r.phaseDeadlineMs = null; r.revision++;
        } else if (r.lockedPlayerIds.every(id => r.seats.find(s => s.id === id)?.finished)) {
          setPhase(r, 'release', next + GAME_RULES.releaseDurationMs);
        }
      }
    } else if (recovery === next) {
      r.recovery = null; r.lockedPlayerIds = []; r.playerCountAtExperimentStart = null;
      for (const s of livePlayers(r)) { s.eligible = false; s.finished = false; }
      if (r.visibility === 'private') { r.round = null; setPhase(r, 'lobby', null); }
      else setPhase(r, 'recovery-lobby', null); // Step 3 owns replacement queue and its 60-second timeout.
    } else if (r.phase === 'briefing') {
      const connected = connectedPlayers(r).filter(s => r.lockedPlayerIds.includes(s.id));
      if (connected.length < GAME_RULES.minPlayers) {
        r.round = null; r.lockedPlayerIds = []; r.playerCountAtExperimentStart = null;
        setPhase(r, r.visibility === 'private' ? 'lobby' : 'recovery-lobby', null);
      } else {
        r.lockedPlayerIds = connected.map(s => s.id);
        for (const s of livePlayers(r)) s.eligible = connected.includes(s);
        r.playerCountAtExperimentStart = connected.length;
        setPhase(r, 'experiment', next + GAME_RULES.experimentDurationMs);
      }
    } else if (r.phase === 'experiment') {
      for (const s of r.seats) if (s.eligible) s.finished = true;
      setPhase(r, 'release', next + GAME_RULES.releaseDurationMs);
    } else if (r.phase === 'release') {
      setPhase(r, 'battle', null); // No fabricated battle, score, cards, or outcomes in step 2.
    } else { r.phaseDeadlineMs = null; r.revision++; }
  }
  return revision !== r.revision;
}
export function nextAlarm(r: StoredRoom): number {
  return Math.min(expiresAt(r), r.phaseDeadlineMs ?? Infinity, r.recovery?.deadlineMs ?? Infinity, ...r.seats.map(s => s.disconnectDeadlineMs ?? Infinity), ...r.reservations.filter(s => !s.cancelled && !s.consumedByOperationHash).map(s => s.expiresAtMs));
}
