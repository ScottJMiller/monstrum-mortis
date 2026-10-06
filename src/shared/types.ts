import type { MatchmakingRegion } from './rules.ts';

export type RoomId = string;
export type GuestId = string;
export type PlayerId = string;
export type SpecimenId = string;
export type MutationId = string;
export type AssetId = string;
export type EpochMs = number;
export type RoomVisibility = 'private' | 'public';
export type PresentationMode = 'remote' | 'same-room';
export type RoomPhase = 'lobby' | 'briefing' | 'experiment' | 'release'
  | 'battle' | 'autopsy' | 'session-results' | 'recovery-lobby' | 'closed';
export type RoundNumber = 1 | 2 | 3;
export type SeatRole = 'player' | 'display' | 'waiting-player';
export type RoundOutcome = 'victory' | 'draw' | 'defeat';
export type QueueMode = 'fresh-session' | 'fill-existing-laboratory';
export type TeamSignal = 'more-teeth' | 'more-armor' | 'enough-limbs'
  | 'unleash' | 'applause' | 'uh-oh';
export type BodySlot = 'body' | 'eyes' | 'mouth' | 'forelimb-left'
  | 'forelimb-right' | 'lower-limbs' | 'skin' | 'head-growth' | 'appendages';

export interface CreatureStats {
  vitality: number;
  power: number;
  protection: number;
  agility: number;
  regeneration: number;
  instability: number;
}

/** Public cards contain visual cues, not DNA outcomes or private catalogue IDs. */
export interface SpecimenView {
  specimenId: SpecimenId;
  accession: string;
  clueAssetId: AssetId;
  accessibleClue: string;
}

export interface PlayerView {
  playerId: PlayerId;
  alias: string;
  symbol: string;
  connected: boolean;
  finishedThisRound: boolean;
  injectionsThisRound: number;
  waitingForNextRound?: boolean;
}

export interface MorphologyPart {
  instanceId: string;
  slot: BodySlot;
  assetId: AssetId;
  variant: number;
  scale: number;
  contributorIds: PlayerId[];
}

export interface CreatureView {
  compositionSeed: string;
  parts: MorphologyPart[];
  revealedMutationIds: MutationId[];
}

/** Shared state excludes hands, reconnect tokens, internal seeds, and DNA effects. */
export interface RoomSnapshot {
  protocolVersion: 2;
  rulesVersion: string;
  revision: number;
  serverTimeMs: EpochMs;
  roomId: RoomId;
  visibility: RoomVisibility;
  presentation: PresentationMode;
  phase: RoomPhase;
  round: RoundNumber | null;
  phaseDeadlineMs: EpochMs | null;
  hostPlayerId: PlayerId | null;
  players: PlayerView[];
  creature: CreatureView | null;
  teamScore: number;
  recoveryDeadlineMs?: EpochMs | null;
  playerCountAtExperimentStart?: number | null;
  mechanicsAvailable?: boolean;
}

/** Only sent to the owner. Display sessions cannot request a controller snapshot. */
export interface ControllerSnapshot {
  playerId: PlayerId;
  tray: SpecimenView[];
  remainingDoses: number;
  nextInjectionAtMs: EpochMs;
  switchPulled: boolean;
}

export interface QueueStatus {
  ticketId: string;
  region: MatchmakingRegion;
  mode: QueueMode;
  enteredAtMs: EpochMs;
  state: 'waiting' | 'ready-check' | 'reserved' | 'inactive';
  readyDeadlineMs: EpochMs | null;
}

export type BattleEventKind = 'attack' | 'block' | 'dodge' | 'poison'
  | 'restraint' | 'regeneration' | 'malfunction' | 'detach' | 'knockout';

export interface BattleEvent {
  sequence: number;
  offsetMs: number;
  kind: BattleEventKind;
  actor: 'team' | 'rival';
  target: 'team' | 'rival';
  magnitude: number;
  caption: string;
  mutationId: MutationId | null;
  contributorWeights: { playerId: PlayerId; weight: number }[];
}

export interface BattleTimeline {
  battleId: string;
  startsAtMs: EpochMs;
  durationMs: number;
  events: BattleEvent[];
  outcome: RoundOutcome;
}

export type AwardId = 'instrument-of-ruin' | 'keeper-of-the-unkillable'
  | 'architect-of-inconvenience' | 'most-questionable-science'
  | 'anatomical-liability' | 'curator-of-the-unnecessary';

export interface AwardSummary {
  awardId: AwardId;
  recipientIds: PlayerId[];
  evidenceAmount: number;
}

export interface CardRecord {
  schemaVersion: 1;
  cardId: string;
  rulesVersion: string;
  assetManifestVersion: string;
  round: RoundNumber;
  title: string;
  titleFinalized: boolean;
  frozenAtRelease: CreatureView;
  stats: CreatureStats;
  dominantMutationIds: MutationId[];
  rivalId: string;
  outcome: RoundOutcome;
  contributors: { playerId: PlayerId; alias: string }[];
  completedAtMs: EpochMs;
}

export interface HealthResponse {
  service: 'monstrum-mortis';
  stage: 'foundation' | 'room-service';
  protocolVersion: 2;
  rulesVersion: string;
  configuredBindings: { assets: boolean; rooms: boolean; matchmaking: boolean; guestLeases: boolean };
  gameplayAvailable: false;
  roomServiceAvailable?: boolean;
}
