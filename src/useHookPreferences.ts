import { useEffect, useRef, useState } from 'react';
import Storage from './accountStorage';
export type LocalHook = { id: string; templateId: string; songId: string; title: string; caption: string; createdAt: number };
type HookPreferences = { created: LocalHook[]; liked: string[]; hiddenCreators: string[]; skipped: string[]; reports: { clipId: string; reason: string; createdAt: number }[] };
const KEY = 'suno-ui:hooks:v1';
const initial = (): HookPreferences => ({ created: [], liked: [], hiddenCreators: [], skipped: [], reports: [] });
function read(raw: string | null): HookPreferences {
  if (!raw) return initial();
  const data = JSON.parse(raw);
  if (!data || !['liked', 'hiddenCreators', 'skipped'].every(key => Array.isArray(data[key]) && data[key].every((id: unknown) => typeof id === 'string')) || !Array.isArray(data.reports)) throw new Error('Invalid hook preferences');
  const created = data.created === undefined ? [] : data.created;
  if (!Array.isArray(created) || !created.every((item: any) => item && typeof item.id === 'string' && typeof item.templateId === 'string' && typeof item.songId === 'string' && typeof item.title === 'string' && typeof item.caption === 'string' && Number.isFinite(item.createdAt))) throw new Error('Invalid local Hooks');
  if (!data.reports.every((item: any) => item && typeof item.clipId === 'string' && typeof item.reason === 'string' && Number.isFinite(item.createdAt))) throw new Error('Invalid local reports');
  return { ...data, created };
}
export function useHookPreferences() {
  const [data, setData] = useState(initial); const [ready, setReady] = useState(false); const [error, setError] = useState(''); const pending = useRef(false);
  useEffect(() => { let alive = true; Storage.getItem(KEY).then(raw => { if (alive) { setData(read(raw)); setReady(true); } }).catch(() => { if (alive) setError('Hook preferences could not load. Reload to retry.'); }); return () => { alive = false; }; }, []);
  const change = async (update: (current: HookPreferences) => HookPreferences) => {
    if (!ready || pending.current) return false;
    pending.current = true; setError('');
    try { const saved = await Storage.updateItem(KEY, raw => JSON.stringify(update(read(raw)))); setData(read(saved)); return true; }
    catch { setError('Hook preferences could not be saved. Try again.'); return false; }
    finally { pending.current = false; }
  };
  return { data, ready, error, create: (item: LocalHook) => change(current => ({ ...current, created: [...current.created, item] })), toggleLike: (id: string) => change(current => ({ ...current, liked: current.liked.includes(id) ? current.liked.filter(value => value !== id) : [...current.liked, id] })), hideCreator: (id: string) => change(current => ({ ...current, hiddenCreators: [...new Set([...current.hiddenCreators, id])] })), skip: (id: string) => change(current => ({ ...current, skipped: [...new Set([...current.skipped, id])] })), resetHidden: () => change(current => ({ ...current, hiddenCreators: [], skipped: [] })), report: (clipId: string, reason: string) => change(current => ({ ...current, reports: [...current.reports, { clipId, reason, createdAt: Date.now() }] })) };
}
