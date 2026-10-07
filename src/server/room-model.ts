import type { MatchmakingRegion } from '../shared/rules.ts';
import { GAME_RULES } from '../shared/rules.ts';
import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { ControllerSnapshot, PresentationMode, RoomPhase, RoomSnapshot } from '../shared/types.ts';
import { beginRelease, initializeExperiment, newExperiment, privateSpecimens, publicCreature, publicHistory, readings } from './dna-mechanics.ts';
import type { Experiment, Specimen, DrawPacket } from './dna-mechanics.ts';
import { ServiceError } from './validation.ts';

export interface Seat {
  id: string;
  guestId: string | null;
  reservationId?: string;
  leaseRenewAtMs?: number;
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
  tray?: Specimen[];
  drawPlan?: DrawPacket[];
  drawCursor?: number;
  switchPulled?: boolean;
  finishReason?: 'switch' | 'grace' | 'deadline' | 'left' | 'legacy' | null;
  /** Step 5 initializes these counters; undefined means mechanics unavailable. */
  injectionsThisRound?: number;
  interactedThisRound?: boolean;
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
  allocationId?: string;
  purpose?: 'fresh' | 'replacement';
}
export interface StoredRoom {
  schemaVersion: 4;
  experiment: Experiment | null;
  legacyRulesVersion?: string;
  publicState: PublicState | null;
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
export interface PublicState {
  region: MatchmakingRegion;
  sessionId: string;
  teamScore: number;
  completed: { completionId: string; round: number; outcome: 'victory' | 'draw' | 'defeat' }[];
  ready: string[];
  replay: string[];
  resultsStartedAtMs: number | null;
  notice?: { revision: number; signature: string; pending: boolean };
}
export function newRoom(id: string, visibility: StoredRoom['visibility'], presentation: PresentationMode, secret: string, creationHash: string, creationFingerprint: string, now: number): StoredRoom {
  return { schemaVersion: 4, experiment: null, publicState: null, id, visibility, presentation, secret, creationHash, creationFingerprint, createdAtMs: now, lastActivityAtMs: now, revision: 0, phase: 'lobby', round: null, phaseDeadlineMs: null, hostId: null, seats: [], reservations: [], lockedPlayerIds: [], playerCountAtExperimentStart: null, recovery: null };
}
export const livePlayers = (r: StoredRoom) => r.seats.filter(s => s.role === 'player' && !s.departed);
export const connectedPlayers = (r: StoredRoom) => livePlayers(r).filter(s => s.connected);
export const expiresAt = (r: StoredRoom) => Math.min(r.createdAtMs + GAME_RULES.roomMaxLifetimeMs, r.lastActivityAtMs + GAME_RULES.roomIdleExpiryMs);
export function requireLive(r: StoredRoom, now: number) {
  if (r.phase === 'closed' || now >= expiresAt(r)) throw new ServiceError('room-expired', 'This laboratory has expired.', 410);
}
export function snapshot(r: StoredRoom, now: number): RoomSnapshot {
  return {
    protocolVersion: PROTOCOL_VERSION, rulesVersion: r.experiment?.rulesVersion ?? r.legacyRulesVersion ?? GAME_RULES.rulesVersion, revision: r.revision, serverTimeMs: now,
    roomId: r.id, visibility: r.visibility, presentation: r.presentation, phase: r.phase, round: r.round,
    phaseDeadlineMs: r.phaseDeadlineMs, hostPlayerId: r.hostId,
    players: livePlayers(r).map(s => ({ playerId: s.id, alias: s.alias, symbol: s.symbol, connected: s.connected, finishedThisRound: s.finished, injectionsThisRound: s.injectionsThisRound ?? 0, cooldownUntilMs: s.nextInjectionAtMs, completionReason: s.finishReason ?? null, inactivityPrompt: r.phase === 'autopsy' && s.injectionsThisRound === 0, waitingForNextRound: !s.eligible && r.phase !== 'lobby' })),
    creature: r.experiment ? publicCreature(r.experiment) : null, teamScore: r.publicState?.teamScore ?? 0,
    publicSession: r.publicState ? { sessionId: r.publicState.sessionId, region: r.publicState.region, readyPlayerIds: [...r.publicState.ready], replayPlayerIds: [...r.publicState.replay], resultsStartedAtMs: r.publicState.resultsStartedAtMs, completedRounds: r.publicState.completed.length } : null,
    recoveryDeadlineMs: r.recovery?.deadlineMs ?? null,
    playerCountAtExperimentStart: r.playerCountAtExperimentStart,
    mechanicsAvailable: r.experiment !== null,
    attemptId: r.experiment?.id ?? null, mutations: r.experiment ? publicHistory(r.experiment) : [],
    readings: r.experiment ? readings(r.experiment) : null, releasedAtMs: r.experiment?.frozen?.releasedAtMs ?? null,
  };
}
export function controller(s: Seat, r: StoredRoom): ControllerSnapshot | null {
  return s.role === 'display' ? null : { revision: r.revision, attemptId: r.experiment?.id ?? null, playerId: s.id, tray: privateSpecimens(s), remainingDoses: s.remainingDoses, nextInjectionAtMs: s.nextInjectionAtMs, switchPulled: s.switchPulled ?? false };
}
export function touch(r: StoredRoom, now: number) { r.lastActivityAtMs = now; }
export function setPhase(r: StoredRoom, phase: RoomPhase, deadline: number | null) { r.phase = phase; r.phaseDeadlineMs = deadline; r.revision++; }
export function startRound(r: StoredRoom, now: number) {
  const players = connectedPlayers(r);
  if (players.length < GAME_RULES.minPlayers) throw new ServiceError('not-enough-players', 'At least two connected players are required.', 409);
  r.round = r.phase === 'recovery-lobby' ? (r.round ?? 1) : r.phase === 'lobby' ? 1 : ((r.round ?? 0) + 1) as 1 | 2 | 3;
  r.lockedPlayerIds = players.map(s => s.id);
  r.playerCountAtExperimentStart = null;
  r.recovery = null;
  r.experiment = newExperiment();
  delete r.legacyRulesVersion;
  if (r.publicState) { r.publicState.ready = []; r.publicState.resultsStartedAtMs = null; }
  for (const seat of livePlayers(r)) { seat.eligible = players.includes(seat); seat.finished = false; seat.remainingDoses = 0; seat.tray = []; seat.drawPlan = []; seat.drawCursor = 0; seat.switchPulled = false; seat.finishReason = null; seat.nextInjectionAtMs = 0; if (seat.injectionsThisRound !== undefined) { seat.injectionsThisRound = 0; seat.interactedThisRound = false; } }
  setPhase(r, 'briefing', now + GAME_RULES.briefingDurationMs);
}
export function connect(r: StoredRoom, seat: Seat, now: number) {
  requireLive(r, now);
  seat.connected = true; seat.connectedAtMs = now; seat.disconnectDeadlineMs = null;
  // Admission can finish in the lobby before the first two sockets start briefing.
  // Include the remaining fresh cohort when its sockets arrive before the deadline.
  if (r.publicState && r.phase === 'briefing' && now < (r.phaseDeadlineMs ?? 0) && seat.role === 'player' && !seat.finished && !seat.departed) {
    const grant = r.reservations.find(g => g.id === seat.reservationId && g.guestId === seat.guestId && g.consumedByOperationHash === seat.operationHash && g.purpose === 'fresh' && !g.cancelled);
    if (grant) { seat.eligible = true; if (!r.lockedPlayerIds.includes(seat.id)) r.lockedPlayerIds.push(seat.id); }
  }
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
  if (explicit) { seat.departed = true; seat.finished = true; seat.finishReason ??= 'left'; }
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
          s.disconnectDeadlineMs = null; s.finished = true; s.finishReason ??= 'grace';
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
          beginRelease(r, next, 'unanimous');
        }
      }
    } else if (recovery === next) {
      r.recovery = null; r.lockedPlayerIds = []; r.playerCountAtExperimentStart = null; r.experiment = null;
      for (const seat of r.seats) { seat.tray = []; seat.drawPlan = []; seat.remainingDoses = 0; }
      for (const s of livePlayers(r)) { s.eligible = false; s.finished = false; }
      if (r.visibility === 'private') { r.round = null; setPhase(r, 'lobby', null); }
      else { if (r.publicState) r.publicState.ready = []; setPhase(r, 'recovery-lobby', next + GAME_RULES.matchmaking.recoveryLobbyMs); }
    } else if (r.phase === 'briefing') {
      const connected = connectedPlayers(r).filter(s => r.lockedPlayerIds.includes(s.id));
      if (connected.length < GAME_RULES.minPlayers) {
        if (r.visibility === 'private') r.round = null; r.lockedPlayerIds = []; r.playerCountAtExperimentStart = null;
        setPhase(r, r.visibility === 'private' ? 'lobby' : 'recovery-lobby', r.visibility === 'private' ? null : next + GAME_RULES.matchmaking.recoveryLobbyMs);
      } else {
        r.lockedPlayerIds = connected.map(s => s.id);
        for (const s of livePlayers(r)) s.eligible = connected.includes(s);
        r.playerCountAtExperimentStart = connected.length;
        initializeExperiment(r);
        setPhase(r, 'experiment', next + GAME_RULES.experimentDurationMs);
      }
    } else if (r.phase === 'experiment') {
      for (const s of r.seats) if (s.eligible) { s.finished = true; s.finishReason ??= 'deadline'; }
      beginRelease(r, next, 'deadline');
    } else if (r.phase === 'release') {
      setPhase(r, 'battle', null); // Frozen creature boundary; combat producer remains step 6.
    } else if (r.publicState) { publicDeadline(r, next); } else { r.phaseDeadlineMs = null; r.revision++; }
  }
  publicProgress(r, now);
  return revision !== r.revision;
}
export function nextAlarm(r: StoredRoom): number {
  return Math.min(expiresAt(r), r.phaseDeadlineMs ?? Infinity, r.phase === 'autopsy' && r.publicState && connectedPlayers(r).every(s => r.publicState!.ready.includes(s.id)) && Date.now() < (r.publicState.resultsStartedAtMs ?? 0) + GAME_RULES.publicEarlyAdvanceMinimumMs ? r.publicState.resultsStartedAtMs! + GAME_RULES.publicEarlyAdvanceMinimumMs : Infinity, r.recovery?.deadlineMs ?? Infinity, ...r.seats.map(s => s.disconnectDeadlineMs ?? Infinity), ...r.reservations.filter(s => !s.cancelled && !s.consumedByOperationHash).map(s => s.expiresAtMs));
}

/** Step 3 orchestration; completion is supplied only by a trusted future battle producer. */
export function completePublicRound(r: StoredRoom, sessionId: string, completionId: string, outcome: 'victory' | 'draw' | 'defeat', now: number) {
  const p = r.publicState;
  if (!p || sessionId !== p.sessionId) throw new ServiceError('stale-session', 'Session mismatch.', 409);
  const prior = p.completed.find(c => c.completionId === completionId);
  if (prior) { if (prior.outcome !== outcome) throw new ServiceError('idempotency-conflict', 'Completion differs.', 409); return; }
  if (r.phase !== 'battle' || !r.round) throw new ServiceError('wrong-phase', 'Completion requires an unfinished battle.', 409);
  p.completed.push({ completionId, round: r.round, outcome }); p.teamScore += GAME_RULES.score[outcome];
  p.resultsStartedAtMs = now; p.ready = []; p.replay = [];
  for (const s of livePlayers(r)) if (!s.connected && s.disconnectDeadlineMs === null) disconnect(r, s, now, true);
  setPhase(r, r.round === 3 ? 'session-results' : 'autopsy', now + (r.round === 3 ? GAME_RULES.publicRegroupDurationMs : GAME_RULES.publicResultsDurationMs));
}
function nextPublicRound(r: StoredRoom, now: number) {
  for (const s of livePlayers(r)) if (!s.connected || (s.injectionsThisRound === 0 && !s.interactedThisRound)) disconnect(r, s, now, true);
  if (connectedPlayers(r).length >= 2) startRound(r, now);
  else { r.round = Math.min(3, (r.round ?? 0) + 1) as 1 | 2 | 3; r.publicState!.ready = []; setPhase(r, 'recovery-lobby', now + GAME_RULES.matchmaking.recoveryLobbyMs); }
}
function publicDeadline(r: StoredRoom, now: number) {
  if (r.phase === 'autopsy') nextPublicRound(r, now);
  else if (r.phase === 'lobby') { r.publicState!.ready = []; setPhase(r, 'recovery-lobby', now + GAME_RULES.matchmaking.recoveryLobbyMs); }
  else if (r.phase === 'recovery-lobby') setPhase(r, 'session-results', null);
  else if (r.phase === 'session-results') {
    const opted = connectedPlayers(r).filter(s => r.publicState!.replay.includes(s.id));
    if (opted.length >= 2) {
      for (const s of livePlayers(r)) if (!opted.includes(s)) disconnect(r, s, now, true);
      const p = r.publicState!; p.sessionId = crypto.randomUUID(); p.teamScore = 0; p.completed = []; p.ready = []; p.replay = []; p.resultsStartedAtMs = null;
      r.round = null; setPhase(r, 'lobby', null); startRound(r, now);
    } else { r.phaseDeadlineMs = null; r.revision++; }
  } else { r.phaseDeadlineMs = null; r.revision++; }
}
export function publicProgress(r: StoredRoom, now: number) {
  const p = r.publicState; if (!p) return;
  if (r.phase === 'lobby' && connectedPlayers(r).length >= 2) startRound(r, now);
  else if (r.phase === 'recovery-lobby' && connectedPlayers(r).filter(s => p.ready.includes(s.id)).length >= 2) {
    for (const s of livePlayers(r)) if (!s.connected) disconnect(r, s, now, true);
    startRound(r, now);
  } else if (r.phase === 'autopsy' && now >= (p.resultsStartedAtMs ?? now) + GAME_RULES.publicEarlyAdvanceMinimumMs) {
    const active = connectedPlayers(r);
    const pending = r.reservations.some(g => !g.cancelled && !g.consumedByOperationHash && g.expiresAtMs > now);
    if (!pending && active.length >= 2 && active.every(s => p.ready.includes(s.id))) nextPublicRound(r, now);
  }
}
export function publicIntent(r: StoredRoom, seat: Seat, kind: 'next-round-ready' | 'public-replay-opt-in', now: number) {
  const p = r.publicState; if (!p) throw new ServiceError('wrong-phase', 'Public session required.', 409);
  if (kind === 'next-round-ready') {
    if (!['autopsy', 'recovery-lobby'].includes(r.phase)) throw new ServiceError('wrong-phase', 'No next round ready check.', 409);
    if (!p.ready.includes(seat.id)) { p.ready.push(seat.id); r.revision++; }
  } else {
    if (r.phase !== 'session-results' || r.phaseDeadlineMs === null) throw new ServiceError('wrong-phase', 'Regroup has ended.', 409);
    if (!p.replay.includes(seat.id)) { p.replay.push(seat.id); r.revision++; }
  }
  seat.interactedThisRound = true;
  touch(r, now); publicProgress(r, now);
}
