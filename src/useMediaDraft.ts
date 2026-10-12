import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Storage from './accountStorage';
import { withOfflineLock } from './offlineQueue';
import { MediaDraft, MediaKind, MediaPreview } from './mediaTypes';
import { prepareMedia, readMediaFile, releaseMediaSource, removeMediaFile, saveMediaFile } from './mediaFiles';
export const MEDIA_DRAFT_KEY = 'suno-ui:media-draft:v1';
function parse(raw: string | null): MediaDraft | null {
  if (!raw) return null;
  let value: any;
  try { value = JSON.parse(raw); } catch { throw new Error('Your media draft could not be read. Retry or remove it.'); }
  if (!/^media-[a-z0-9-]+$/.test(value?.id) || typeof value.name !== 'string' || !['images', 'videos'].includes(value.kind)) throw new Error('Your media draft could not be read. Retry or remove it.');
  return { id: value.id, name: value.name, kind: value.kind };
}
class Cancelled extends Error {}
export function useMediaDraft() {
  const [draft, setDraft] = useState<MediaDraft | null>(null);
  const [preview, setPreview] = useState<MediaPreview['source']>(null);
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const alive = useRef(true); const observed = useRef<string | null>(null); const release = useRef(() => {});
  const retryJob = useRef<(() => Promise<void>) | null>(null); const pending = useRef(false); const epoch = useRef(0);
  const pickerOpen = useRef(false);
  const load = async () => {
    const raw = await Storage.getItem(MEDIA_DRAFT_KEY); observed.current = raw;
    let next: MediaDraft | null = null; let file: Awaited<ReturnType<typeof readMediaFile>> | null = null; let image: MediaPreview | null = null;
    try {
      next = parse(raw);
      if (next) { file = await readMediaFile(next.id, next.kind); image = await prepareMedia(file.uri, next.kind); }
      if (!alive.current) { image?.release(); file?.release(); return; }
      release.current(); release.current = () => { image?.release(); file?.release(); };
      setDraft(next); setPreview(image?.source || null);
    } catch (cause) {
      image?.release(); file?.release();
      if (alive.current) { release.current(); release.current = () => {}; setDraft(next); setPreview(null); }
      throw cause;
    }
  };
  const run = async (job: () => Promise<void>) => {
    if (pending.current) return false;
    pending.current = true; if (alive.current) { setBusy(true); setError(''); }
    try { await withOfflineLock(MEDIA_DRAFT_KEY, job); retryJob.current = null; return true; }
    catch (cause) {
      if (!(cause instanceof Cancelled)) { retryJob.current = job; if (alive.current) setError(cause instanceof Error ? cause.message : 'Your media changes could not be saved. Try again.'); }
      return false;
    } finally { pending.current = false; if (alive.current) setBusy(false); }
  };
  const refresh = async () => { if (pickerOpen.current || pending.current || retryJob.current) return; await run(load); if (alive.current) setReady(true); };
  useEffect(() => {
    alive.current = true; void refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const changed = (event: StorageEvent) => { if (event.key === MEDIA_DRAFT_KEY || event.key === null) void refresh(); };
    if (Platform.OS === 'web') window.addEventListener('storage', changed);
    return () => { alive.current = false; epoch.current++; subscription.remove(); if (Platform.OS === 'web') window.removeEventListener('storage', changed); release.current(); };
  }, []);
  const cancel = () => { epoch.current++; retryJob.current = null; };
  const select = (source: string | (() => Promise<{ uri: string; release: () => void }>), name: string, kind: MediaKind, isActive: () => boolean) => {
    if (!ready || pending.current) return Promise.resolve(false);
    const next: MediaDraft = { id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, kind };
    const expected = observed.current; const selectedEpoch = epoch.current; let committed = false;
    const active = () => alive.current && selectedEpoch === epoch.current && isActive();
    return run(async () => {
      let borrowed: { uri: string; release: () => void } | null = null;
      let uri = typeof source === 'string' ? source : '';
      let old: MediaDraft | null = null;
      try { old = parse(expected); } catch { /* An explicitly selected file may replace an unreadable draft record. */ }
      const check = () => { if (!active()) throw new Cancelled(); };
      try {
        if (!committed) {
          check();
          if (typeof source !== 'string') { borrowed = await source(); uri = borrowed.uri; }
          const decoded = await prepareMedia(uri, kind); decoded.release(); check();
          await saveMediaFile(next.id, uri, kind); check();
          const saved = await readMediaFile(next.id, kind);
          try { const decodedCopy = await prepareMedia(saved.uri, kind); decodedCopy.release(); } finally { saved.release(); }
          check();
          try {
            await Storage.updateItem(MEDIA_DRAFT_KEY, raw => { check(); if (raw !== expected) throw new Error('This media draft changed in another window. Choose your file again.'); return JSON.stringify(next); });
            committed = true;
          } catch (cause) {
            // A storage provider can report failure after completing its write.
            // Keep the file if its record was committed, so reload stays valid.
            if (await Storage.getItem(MEDIA_DRAFT_KEY) === JSON.stringify(next)) committed = true;
            else throw cause;
          }
          if (!active()) {
            if (expected === null) await Storage.removeItem(MEDIA_DRAFT_KEY); else await Storage.setItem(MEDIA_DRAFT_KEY, expected);
            committed = false; throw new Cancelled();
          }
        }
        await load();
        if (old && old.id !== next.id) await removeMediaFile(old.id, old.kind);
        await releaseMediaSource(uri);
      } catch (cause) {
        if (!committed) {
          // If the final storage read fails, retain the owned file until Retry
          // can determine whether it belongs to a completed commit.
          const actual = await Storage.getItem(MEDIA_DRAFT_KEY);
          if (actual === JSON.stringify(next)) committed = true;
          else {
            await removeMediaFile(next.id, kind);
            if (actual !== expected) await load();
          }
        }
        if (cause instanceof Cancelled) await releaseMediaSource(uri);
        throw cause;
      } finally { borrowed?.release(); }
    });
  };
  const discard = () => {
    const expected = observed.current;
    return run(async () => {
      const raw = await Storage.getItem(MEDIA_DRAFT_KEY);
      if (raw !== expected && raw !== null) throw new Error('This media draft changed in another window. Reopen it before removing it.');
      let old: MediaDraft | null = null; try { old = parse(expected); } catch { /* Remove only the invalid record; unknown file ownership is retained. */ }
      await Storage.removeItem(MEDIA_DRAFT_KEY);
      if (old) await removeMediaFile(old.id, old.kind);
      await load();
    });
  };
  return { draft, preview, ready, busy, error, snapshot: () => observed.current, refreshAfterReuse: () => run(load), select, cancel, discard, setPickerOpen: (value: boolean) => { pickerOpen.current = value; }, retry: () => run(retryJob.current || load) };
}
