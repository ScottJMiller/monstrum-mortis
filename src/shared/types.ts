import type { PROTOCOL_VERSION } from './protocol.ts';
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
  cooldownUntilMs?: EpochMs;
  completionReason?: 'switch' | 'grace' | 'deadline' | 'left' | 'legacy' | null;
  inactivityPrompt?: boolean;
}

export interface MorphologyPart {
  instanceId: string;
  slot: BodySlot;
  assetId: AssetId;
  variant: number;
  scale: number;
  contributorIds: PlayerId[];
  opacity?: number;
  layerOffset?: number;
}

export interface CreatureView {
  compositionSeed: string;
  parts: MorphologyPart[];
  revealedMutationIds: MutationId[];
}

export interface MutationView { sequence: number; injectionId: string; playerId: string; alias: string; name: string; atMs: EpochMs; change: 'added' | 'reinforced' | 'replaced'; status: 'active' | 'partial' | 'replaced' }

/** Shared state excludes hands, reconnect tokens, internal seeds, and DNA effects. */
export interface RoomSnapshot {
  protocolVersion: typeof PROTOCOL_VERSION;
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
  attemptId?: string | null;
  mutations?: MutationView[];
  readings?: Record<keyof CreatureStats, 'low' | 'moderate' | 'high'> | null;
  releasedAtMs?: EpochMs | null;
  combatAvailable?: boolean;
  rival?: RivalView | null;
  battle?: BattleTimeline | null;
  result?: RoundResult | null;
  session?: SessionView | null;
  publicSession?: { sessionId: string; readyPlayerIds: string[]; replayPlayerIds: string[]; resultsStartedAtMs: number | null; completedRounds: number; region: MatchmakingRegion } | null;
}

/** Only sent to the owner. Display sessions cannot request a controller snapshot. */
export interface ControllerSnapshot {
  revision: number;
  attemptId: string | null;
  playerId: PlayerId;
  tray: SpecimenView[];
  remainingDoses: number;
  nextInjectionAtMs: EpochMs;
  switchPulled: boolean;
}

export type QueueStatus = import('./matchmaking.ts').PublicQueueStatus;

export type BattleEventKind = 'attack' | 'block' | 'dodge' | 'poison'
  | 'restraint' | 'regeneration' | 'malfunction' | 'detach' | 'knockout' | 'electric' | 'corrosion' | 'slowing' | 'bleed' | 'recover' | 'timeout';

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
  teamHealth: number;
  rivalHealth: number;
  creature?: CreatureView;
  durationMs?: number;
}

export interface BattleTimeline {
  battleId: string;
  startsAtMs: EpochMs;
  durationMs: number;
  events: BattleEvent[];
  initialCreature: CreatureView;
  rival: RivalView;
}

export interface RivalView { id: string; name: string; assetId: string; strength: string; weakness: string }
export interface ContributionSummary { playerId: string; alias: string; damage: number; protection: number; healing: number; inconvenience: number; liabilityDoses: number; malfunction: number; cosmeticDoses: number }
export interface RoundResult { battleId: string; round: RoundNumber; rival: RivalView; outcome: RoundOutcome; completedAtMs: number; stats: CreatureStats; traits: { name: string; status: string; description: string }[]; awards: AwardSummary[]; contributions: ContributionSummary[]; finalTeamHealth: number; finalRivalHealth: number }
export interface SessionView { sessionId: string; completed: RoundResult[]; awards: AwardSummary[]; contributions: ContributionSummary[] }

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
  stage: 'foundation' | 'room-service' | 'public-matchmaking' | 'dna-mechanics' | 'automatic-combat';
  protocolVersion: typeof PROTOCOL_VERSION;
  rulesVersion: string;
  configuredBindings: { assets: boolean; rooms: boolean; matchmaking: boolean; guestLeases: boolean };
  gameplayAvailable: boolean;
  fullReleaseAvailable?: boolean;
  roomServiceAvailable?: boolean;
  matchmakingAvailable?: boolean;
  mechanicsAvailable?: boolean;
  combatAvailable?: boolean;
}
