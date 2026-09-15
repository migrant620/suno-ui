import Storage from './accountStorage';
import { DRAFT_CLEANUP_KEY } from './draftTransaction';
import { removeDraftAudioFile } from './draftAudioFiles';
import { removeMediaFile } from './mediaFiles';
import { MediaKind } from './mediaTypes';
import { withOfflineLock } from './offlineQueue';

export type AttachmentCleanup = { type: 'audio'; id: string } | { type: 'media'; id: string; kind: MediaKind };
const identity = (item: AttachmentCleanup) => `${item.type}:${item.id}:${item.type === 'media' ? item.kind : ''}`;
export function parseAttachmentCleanup(raw: string | null): AttachmentCleanup[] {
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !Array.isArray(value.items) || !value.items.every((item: AttachmentCleanup) => item && typeof item.id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,199}$/.test(item.id) && (item.type === 'audio' || (item.type === 'media' && ['images', 'videos'].includes(item.kind))))) throw new Error('Previous attachment cleanup could not be read. Try again.');
  return value.items;
}
export function serializeAttachmentCleanup(items: AttachmentCleanup[]) {
  const unique = [...new Map(items.map(item => [identity(item), item])).values()];
  return unique.length ? JSON.stringify({ version: 1, items: unique }) : null;
}
export async function readAttachmentCleanup() {
  return parseAttachmentCleanup(await Storage.getItem(DRAFT_CLEANUP_KEY));
}

// The caller owns account-media; reuse already holds it across preparation/commit.
export async function flushAttachmentCleanupLocked() {
  const items = await readAttachmentCleanup();
  if (!items.length) return 0;
  const mediaRaw = await Storage.getItem('suno-ui:media-draft:v1');
  const audioRaw = await Storage.getItem('suno-ui:audio-draft:v1');
  const activeMedia = mediaRaw ? JSON.parse(mediaRaw) : null;
  const activeAudio = audioRaw ? JSON.parse(audioRaw) : null;
  const remaining: AttachmentCleanup[] = [];
  for (const item of items) {
    // An attachment reselected since an earlier failed cleanup is retained.
    if (item.type === 'media' ? activeMedia?.id === item.id : activeAudio?.track?.id === item.id) continue;
    try {
      if (item.type === 'media') await removeMediaFile(item.id, item.kind);
      else await removeDraftAudioFile(item.id);
    } catch { remaining.push(item); }
  }
  const raw = serializeAttachmentCleanup(remaining);
  if (raw === null) await Storage.removeItem(DRAFT_CLEANUP_KEY);
  else await Storage.setItem(DRAFT_CLEANUP_KEY, raw);
  return remaining.length;
}
export const retryAttachmentCleanup = () => withOfflineLock('attachment-cleanup', flushAttachmentCleanupLocked);
