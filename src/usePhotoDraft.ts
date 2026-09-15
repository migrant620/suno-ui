import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Storage from './accountStorage';
import { withOfflineLock } from './offlineQueue';
import { readPhotoFile, removePhotoFile, removeAllPhotoFiles, savePhotoFile, releasePhotoSource } from './photoFiles';

export const PHOTO_DRAFT_KEY = 'suno-ui:photo-draft:v1';
export type PhotoDraft = { id: string; name: string; place: string; moment: string; style: string };
function parse(raw: string): PhotoDraft {
  let value: any;
  try { value = JSON.parse(raw); } catch { throw new Error('Your photo draft could not be opened. Retry or discard it to choose another photo.'); }
  if (value?.version !== 1 || !value.draft || !['id', 'name', 'place', 'moment', 'style'].every(k => typeof value.draft[k] === 'string') || !/^photo-[a-z0-9-]+$/.test(value.draft.id)) throw new Error('Your photo draft could not be opened.');
  return value.draft;
}
export function usePhotoDraft() {
  const [draft, setDraft] = useState<PhotoDraft | null>(null);
  const [uri, setUri] = useState(''); const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const release = useRef(() => {}); const active = useRef(true);
  const displayed = useRef<string | null>(null);
  const observed = useRef<string | null>(null);
  const pendingSources = useRef(new Map<string, string>());
  const latestJob = useRef<Promise<unknown>>(Promise.resolve());
  const finishSource = async (id: string) => {
    const source = pendingSources.current.get(id);
    if (source) { await releasePhotoSource(source); pendingSources.current.delete(id); }
  };
  const retryJob = useRef<null | (() => Promise<void>)>(null);
  const jobs = useRef(0); const refreshing = useRef(false); const refreshPending = useRef(false);
  const run = async (job: () => Promise<void>, retryable = true) => {
    jobs.current += 1;
    if (active.current) { setBusy(true); if (retryable) setError(''); }
    try {
      const task = withOfflineLock(PHOTO_DRAFT_KEY, job); latestJob.current = task;
      await task;
      if (retryable) retryJob.current = null;
      if (active.current && !retryJob.current) setError('');
      return true;
    } catch (cause) {
      if (retryable) retryJob.current = job;
      if (active.current && (retryable || !retryJob.current)) setError(cause instanceof Error ? cause.message : 'Your photo changes could not be saved. Try again.');
      return false;
    } finally { jobs.current -= 1; if (active.current) setBusy(jobs.current > 0); }
  };
  const load = async () => {
    const raw = await Storage.getItem(PHOTO_DRAFT_KEY); observed.current = raw;
    const saved = raw ? parse(raw) : null;
    if (saved && displayed.current === saved.id) { if (active.current) setDraft(saved); return; }
    const file = saved ? await readPhotoFile(saved.id) : null;
    if (!active.current) { file?.release(); return; }
    release.current(); release.current = file?.release || (() => {});
    displayed.current = saved?.id || null;
    setDraft(saved); setUri(file?.uri || '');
  };
  const refresh = async () => {
    if (!active.current) return;
    if (refreshing.current) { refreshPending.current = true; return; }
    refreshing.current = true;
    try {
      do { refreshPending.current = false; await run(load, false); }
      while (active.current && refreshPending.current);
    }
    finally { refreshing.current = false; if (active.current) setReady(true); }
  };
  useEffect(() => {
    active.current = true; void refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const changed = (event: StorageEvent) => { if (event.key === PHOTO_DRAFT_KEY || event.key === null) void refresh(); };
    if (Platform.OS === 'web') window.addEventListener('storage', changed);
    return () => {
      active.current = false; subscription.remove(); if (Platform.OS === 'web') window.removeEventListener('storage', changed); release.current();
      // Wait for copies/saves already in flight before releasing their exact inputs.
      void latestJob.current.catch(() => {}).then(async () => {
        for (const id of pendingSources.current.keys()) await finishSource(id);
      }).catch(() => {});
    };
  }, []);
  const select = (source: string, name: string) => {
    const next: PhotoDraft = { id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, place: '', moment: 'shadows stretch', style: 'cinematic ambient' };
    let initialId: string | null | undefined; let committed = false;
    pendingSources.current.set(next.id, source);
    return run(async () => {
      const raw = await Storage.getItem(PHOTO_DRAFT_KEY); const current = raw ? parse(raw) : null;
      if (initialId === undefined) initialId = current?.id || null;
      if (!committed && current?.id === next.id) committed = true;
      if (!committed) {
        if ((current?.id || null) !== initialId) {
          await removePhotoFile(next.id); await finishSource(next.id);
          throw new Error('This photo draft changed in another window. Choose your photo again to replace it.');
        }
        await savePhotoFile(next.id, source);
        if (!active.current) { await removePhotoFile(next.id); await finishSource(next.id); return; }
        try { await Storage.setItem(PHOTO_DRAFT_KEY, JSON.stringify({ version: 1, draft: next })); }
        catch (cause) {
          // Do not delete a file if the write completed before reporting failure.
          const saved = await Storage.getItem(PHOTO_DRAFT_KEY);
          if (!saved || parse(saved).id !== next.id) { await removePhotoFile(next.id); throw cause; }
        }
        committed = true;
      }
      // Retrying cleanup after a committed save must not recreate the photo or
      // reset fields another document has edited since that save.
      if (initialId && initialId !== next.id) await removePhotoFile(initialId);
      await finishSource(next.id);
      await load();
    });
  };
  const edit = (field: 'place' | 'moment' | 'style', value: string) => {
    if (!draft) return Promise.resolve(false);
    const id = draft.id;
    return run(async () => {
      await Storage.updateItem(PHOTO_DRAFT_KEY, raw => {
        const latest = raw ? parse(raw) : null;
        if (latest?.id !== id) throw new Error('This photo draft changed in another window. Reopen it before editing.');
        return JSON.stringify({ version: 1, draft: { ...latest, [field]: value.slice(0, 200) } });
      });
      await load();
    });
  };
  const discard = () => {
    const expected = observed.current; const expectedId = draft?.id;
    return run(async () => {
      const raw = await Storage.getItem(PHOTO_DRAFT_KEY);
      if (raw !== null && raw !== expected) {
        let currentId: string | undefined;
        try { currentId = parse(raw).id; } catch { /* A different unreadable record is not the selected draft. */ }
        if (!currentId || currentId !== expectedId) throw new Error('This photo draft changed in another window. Reopen it before discarding.');
      }
      // This namespace belongs only to the single photo draft, including orphaned
      // copies whose identifier was lost when its metadata became unreadable.
      for (const id of pendingSources.current.keys()) await finishSource(id);
      await removeAllPhotoFiles();
      await Storage.removeItem(PHOTO_DRAFT_KEY); await load();
    });
  };
  return { draft, uri, ready, busy, error, select, edit, discard, retry: () => run(retryJob.current || load) };
}
