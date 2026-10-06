import { PROTOCOL_VERSION } from '../shared/protocol.ts';
import type { ClientAction } from '../shared/protocol.ts';

export class ServiceError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) { super(message); this.code = code; this.status = status; }
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PRIVATE_CODE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
export const PUBLIC_ID = /^p-[0-9a-f-]{36}$/;
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ServiceError('invalid-action', 'Expected an object.');
  return value as Record<string, unknown>;
}
export function exact(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new ServiceError('invalid-action', 'Unexpected fields.');
}
export function operationId(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) throw new ServiceError('invalid-action', 'Use a random UUID for operationId.');
  return value;
}
export function alias(value: unknown): string {
  if (typeof value !== 'string' || !/^[\p{L}\p{N} ._'’-]{1,24}$/u.test(value) || !value.trim()) {
    throw new ServiceError('invalid-action', 'Names must contain 1–24 letters, numbers, spaces, or simple punctuation.');
  }
  return value.trim();
}
export function parseAction(value: unknown): ClientAction {
  const v = object(value);
  if (v.protocolVersion !== PROTOCOL_VERSION) throw new ServiceError('stale-session', 'Reload to use the current protocol.');
  if (typeof v.actionId !== 'string' || !UUID.test(v.actionId)) throw new ServiceError('invalid-action', 'Use a random UUID for actionId.');
  const base = ['protocolVersion', 'actionId', 'kind'];
  switch (v.kind) {
    case 'sync-request':
      exact(v, [...base, 'afterRevision']);
      if (!Number.isSafeInteger(v.afterRevision) || (v.afterRevision as number) < 0) throw new ServiceError('invalid-action', 'Invalid revision.');
      break;
    case 'start-private-session': case 'advance-private-round': case 'leave': case 'pull-switch': case 'next-round-ready':
      exact(v, base); break;
    case 'inject':
      exact(v, [...base, 'specimenId']);
      if (typeof v.specimenId !== 'string' || v.specimenId.length > 80 || !v.specimenId.length) throw new ServiceError('invalid-action', 'Invalid specimen.');
      break;
    default: throw new ServiceError('not-implemented', 'This intent belongs to a later milestone.');
  }
  return v as unknown as ClientAction;
}
export async function body(request: Pick<Request, 'headers' | 'body'>): Promise<Record<string, unknown>> {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new ServiceError('invalid-action', 'Send application/json.', 415);
  if (Number(request.headers.get('Content-Length') ?? 0) > 4096) throw new ServiceError('invalid-action', 'Request too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ServiceError('invalid-action', 'Body required.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > 4096) { await reader.cancel(); throw new ServiceError('invalid-action', 'Request too large.', 413); }
    chunks.push(result.value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return object(JSON.parse(new TextDecoder().decode(bytes))); }
  catch (error) { if (error instanceof ServiceError) throw error; throw new ServiceError('invalid-action', 'Invalid JSON.'); }
}
export function failure(error: unknown): Response {
  if (error instanceof ServiceError) return Response.json({ code: error.code, message: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
  console.error('Room service failed:', error instanceof Error ? error.message : 'unknown error');
  return Response.json({ code: 'temporarily-unavailable', message: 'The laboratory is temporarily unavailable. Retry shortly.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
