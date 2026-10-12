import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Storage from './accountStorage';

export const SEARCH_HISTORY_KEY = 'suno-ui:search-history:v1';
export type RecentSearch = { kind: 'creator' | 'song' | 'playlist'; id: string };
type Change = { type: 'visit'; item: RecentSearch } | { type: 'remove'; items: RecentSearch[] } | { type: 'clear' };
export const recentKey = (item: RecentSearch) => `${item.kind}:${item.id}`;
function read(raw: string | null): RecentSearch[] {
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !Array.isArray(value.entries) || !value.entries.every((item: RecentSearch) => item && ['creator', 'song', 'playlist'].includes(item.kind) && typeof item.id === 'string' && item.id.length > 0)) throw new Error('Invalid search history');
  const seen = new Set<string>();
  return value.entries.filter((item: RecentSearch) => { const key = recentKey(item); if (seen.has(key)) return false; seen.add(key); return true; });
}
function apply(raw: string | null, change: Change): string {
  const entries = change.type === 'clear' ? [] : read(raw);
  const next = change.type === 'visit' ? [change.item, ...entries.filter(item => recentKey(item) !== recentKey(change.item))] : change.type === 'remove' ? entries.filter(item => !change.items.some(remove => recentKey(remove) === recentKey(item))) : [];
  return JSON.stringify({ version: 1, entries: next });
}

export function useSearchHistory() {
  const [entries, setEntries] = useState<RecentSearch[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const loaded = useRef(false);
  const loading = useRef(false);
  const running = useRef(false);
  const refreshPending = useRef(false);
  const pending = useRef<Change[]>([]);
  async function drain() {
    if (!mounted.current || !loaded.current || running.current) return;
    running.current = true; setBusy(true);
    try {
      while (mounted.current && pending.current.length) {
        const change = pending.current[0];
        // Read/modify/write under the existing account lock, including other Web tabs.
        const raw = await Storage.updateItem(SEARCH_HISTORY_KEY, current => apply(current, change));
        pending.current.shift();
        if (mounted.current) { setEntries(read(raw)); setError(''); }
      }
    } catch { if (mounted.current) setError('Search history could not be saved. Retry to keep your changes.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); if (refreshPending.current) void refresh(); }
  }
  async function refresh() {
    if (!mounted.current) return;
    if (loading.current || running.current) { refreshPending.current = true; return; }
    refreshPending.current = false; loading.current = true;
    try {
      const saved = read(await Storage.getItem(SEARCH_HISTORY_KEY));
      if (mounted.current) { setEntries(saved); loaded.current = true; setReady(true); setError(''); }
    } catch { if (mounted.current) { loaded.current = false; setReady(false); setError('Search history could not be loaded. Retry or clear this local history.'); } }
    finally { loading.current = false; }
    if (loaded.current) void drain();
  }
  function enqueue(change: Change) { pending.current.push(change); void drain(); }
  useEffect(() => {
    mounted.current = true; void refresh();
    const subscription = AppState.addEventListener('change', value => { if (value === 'active') void refresh(); });
    const storageChanged = (event: StorageEvent) => { if (event.key === SEARCH_HISTORY_KEY) void refresh(); };
    if (Platform.OS === 'web') window.addEventListener('storage', storageChanged);
    return () => { mounted.current = false; subscription.remove(); if (Platform.OS === 'web') window.removeEventListener('storage', storageChanged); };
  }, []);
  return {
    entries, ready, busy, error,
    visit: (item: RecentSearch) => enqueue({ type: 'visit', item }),
    remove: (items: RecentSearch[]) => enqueue({ type: 'remove', items }),
    clear: () => { if (!loaded.current) { pending.current = []; loaded.current = true; setReady(true); } enqueue({ type: 'clear' }); },
    retry: () => { if (loaded.current) void drain(); else void refresh(); },
    refresh,
  };
}
