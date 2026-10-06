import type { ControllerSnapshot, PresentationMode, RoomSnapshot } from './types.ts';

/** Creation/join keys are private, random UUIDs. Keep them out of invitation URLs. */
export interface PrivateEntryRequest {
  operationId: string;
  alias: string;
  role: 'player' | 'display';
}
export interface CreatePrivateRequest extends Omit<PrivateEntryRequest, 'role'> {
  presentation: PresentationMode;
}
export interface RoomCredentials {
  roomId: string;
  sessionId: string;
  role: 'player' | 'display';
  reconnectToken: string;
}
export interface RoomEntryResponse {
  credentials: RoomCredentials;
  snapshot: RoomSnapshot;
  controller: ControllerSnapshot | null;
}
