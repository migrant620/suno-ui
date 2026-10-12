import { useEffect, useRef, useState } from 'react';
import AsyncStorage from './accountStorage';

export type LocalComment = { id: string; trackId: string; author: string; text: string; at: number | null; createdAt: number; parentId?: string; own: boolean; liked: boolean };
type Community = { comments: LocalComment[]; drafts: Record<string, string>; replyTargets?: Record<string, string> };
const KEY = 'suno-ui:community:v1';
const initial = (): Community => ({ comments: [
  { id: 'example-comment-morning-1', trackId: 'morning-light', author: 'Echo', text: 'The little piano phrase makes this feel like the start of a quiet morning. I keep coming back to the space between the notes and the way the last chord settles. A lovely moment to pause and listen.', at: 3, createdAt: 0, own: false, liked: false },
  { id: 'example-comment-morning-2', trackId: 'morning-light', author: 'Soft Signal', text: 'That warm ending is my favorite part.', at: 17, createdAt: 0, own: false, liked: false },
  { id: 'example-comment-evening-1', trackId: 'evening-drift', author: 'Echo', text: 'Soft keys and a little room to breathe.', at: 8, createdAt: 0, own: false, liked: false },
], drafts: {} });
function read(raw: string): Community {
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.comments) || !data.drafts || typeof data.drafts !== 'object' || Array.isArray(data.drafts)) throw new Error('Invalid comments');
  const ids = new Set<string>();
  for (const comment of data.comments) {
    if (!comment || typeof comment.id !== 'string' || ids.has(comment.id) || typeof comment.trackId !== 'string' || typeof comment.author !== 'string' || typeof comment.text !== 'string' || !comment.text.trim() || (comment.at !== null && (!Number.isFinite(comment.at) || comment.at < 0)) || !Number.isFinite(comment.createdAt) || typeof comment.own !== 'boolean' || typeof comment.liked !== 'boolean' || (comment.parentId !== undefined && typeof comment.parentId !== 'string')) throw new Error('Invalid comment');
    ids.add(comment.id);
  }
  if (!Object.values(data.drafts).every(value => typeof value === 'string')) throw new Error('Invalid draft');
  if (data.replyTargets !== undefined && (!data.replyTargets || typeof data.replyTargets !== 'object' || Array.isArray(data.replyTargets) || !Object.values(data.replyTargets).every(value => typeof value === 'string'))) throw new Error('Invalid reply target');
  return data;
}
type Edit = { value: string; revision: number };
const saveError = 'Your comment changes could not be saved. Try editing again.';
export function useCommunity() {
  const [data, setData] = useState<Community>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const base = useRef<Community>(initial());
  const draftEdits = useRef(new Map<string, Edit>());
  const replyEdits = useRef(new Map<string, Edit>());
  const revision = useRef(0);
  const active = useRef(false);
  const sending = useRef(false);
  const attempts = useRef(new Map<string, LocalComment>());
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const show = () => {
    if (!active.current) return;
    setData({ ...base.current,
      drafts: { ...base.current.drafts, ...Object.fromEntries([...draftEdits.current].map(([id, edit]) => [id, edit.value])) },
      replyTargets: { ...base.current.replyTargets, ...Object.fromEntries([...replyEdits.current].map(([id, edit]) => [id, edit.value])) },
    });
  };
  const enqueue = <T,>(job: () => Promise<T>): Promise<T> => {
    const next = writes.current.catch(() => {}).then(job);
    writes.current = next;
    return next;
  };
  useEffect(() => {
    active.current = true;
    void AsyncStorage.getItem(KEY).then(raw => raw ?? AsyncStorage.updateItem(KEY, latest => latest ?? JSON.stringify(initial()))).then(raw => {
      if (active.current) { base.current = read(raw); show(); setReady(true); }
    }).catch(() => { if (active.current) setError('Local comments could not be opened. Reload to retry.'); });
    return () => { active.current = false; };
  }, []);
  const edit = (kind: 'drafts' | 'replyTargets', trackId: string, value: string) => {
    if (!ready || sending.current) return;
    const overlays = kind === 'drafts' ? draftEdits : replyEdits;
    const item = { value, revision: ++revision.current };
    overlays.current.set(trackId, item); show();
    void enqueue(async () => {
      try {
        const raw = await AsyncStorage.updateItem(KEY, raw => {
          if (!active.current) throw new Error('Closed');
          const current = raw ? read(raw) : initial();
          return JSON.stringify({ ...current, [kind]: { ...current[kind], [trackId]: value } });
        });
        base.current = read(raw);
        if (overlays.current.get(trackId)?.revision === item.revision) overlays.current.delete(trackId);
        if (active.current) { setError(''); show(); }
      } catch { if (active.current) setError(saveError); }
    });
  };
  const draft = (trackId: string, text: string) => edit('drafts', trackId, text);
  const reply = (trackId: string, id: string | null) => edit('replyTargets', trackId, id || '');
  const add = async (trackId: string, author: string, text: string, at: number, parentId?: string, isActive: () => boolean = () => true): Promise<boolean> => {
    if (!ready || sending.current || !text.trim()) return false;
    sending.current = true; setPosting(true); setError('');
    const key = JSON.stringify([trackId, author, text, parentId || '']);
    const comment = attempts.current.get(key) || { id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, trackId, author, text: text.trim(), at: Math.max(0, at), createdAt: Date.now(), parentId, own: true, liked: false };
    attempts.current.set(key, comment);
    const draftRevision = draftEdits.current.get(trackId)?.revision;
    const replyRevision = replyEdits.current.get(trackId)?.revision;
    const priorDraft = base.current.drafts[trackId];
    const priorTarget = base.current.replyTargets?.[trackId] || '';
    let started = false;
    try {
      return await enqueue(async () => {
        let saved: Community;
        try {
          saved = read(await AsyncStorage.updateItem(KEY, raw => {
            if (!active.current || !isActive()) throw new Error('Cancelled');
            const current = raw ? read(raw) : initial();
            if (parentId && !current.comments.some(item => item.id === parentId && item.trackId === trackId)) throw new Error('Reply no longer exists');
            started = true;
            // Stable attempt IDs make retries safe even if storage wrote before rejecting its acknowledgement.
            if (current.comments.some(item => item.id === comment.id)) return JSON.stringify(current);
            const sameDraft = current.drafts[trackId] === text || (draftRevision !== undefined && current.drafts[trackId] === priorDraft);
            const sameTarget = (current.replyTargets?.[trackId] || '') === (parentId || '') || (replyRevision !== undefined && (current.replyTargets?.[trackId] || '') === priorTarget);
            return JSON.stringify({ ...current, comments: [...current.comments, comment],
              drafts: sameDraft && sameTarget ? { ...current.drafts, [trackId]: '' } : current.drafts,
              replyTargets: sameDraft && sameTarget ? { ...current.replyTargets, [trackId]: '' } : current.replyTargets,
            });
          }));
        } catch (cause) {
          if (!started) throw cause;
          const raw = await AsyncStorage.getItem(KEY);
          const recovered = raw ? read(raw) : null;
          if (!recovered?.comments.some(item => item.id === comment.id)) throw cause;
          saved = recovered;
        }
        base.current = saved;
        if (draftEdits.current.get(trackId)?.revision === draftRevision) draftEdits.current.delete(trackId);
        if (replyEdits.current.get(trackId)?.revision === replyRevision) replyEdits.current.delete(trackId);
        attempts.current.delete(key);
        if (active.current) { setError(''); show(); }
        return true;
      });
    } catch {
      if (active.current && isActive()) setError('Your comment could not be saved. Try posting again.');
      return false;
    } finally {
      sending.current = false;
      if (active.current) setPosting(false);
    }
  };
  const updateComments = (update: (current: Community) => Community, errorMessage = saveError, isActive: () => boolean = () => true): Promise<boolean> => {
    if (!ready) return Promise.resolve(false);
    return enqueue(async () => {
      try {
        const raw = await AsyncStorage.updateItem(KEY, raw => {
          if (!active.current || !isActive()) throw new Error('Cancelled');
          return JSON.stringify(update(raw ? read(raw) : initial()));
        });
        base.current = read(raw);
        if (active.current) { setError(''); show(); }
        return true;
      } catch { if (active.current && isActive()) setError(errorMessage); return false; }
    });
  };
  const toggleLike = (id: string) => updateComments(current => ({ ...current, comments: current.comments.map(comment => comment.id === id ? { ...comment, liked: !comment.liked } : comment) }));
  const remove = (id: string, isActive: () => boolean = () => true) => updateComments(current => {
    if (!current.comments.some(comment => comment.id === id && comment.own)) return current;
    const removed = new Set([id]);
    let changed = true;
    while (changed) { changed = false; for (const comment of current.comments) if (comment.parentId && removed.has(comment.parentId) && !removed.has(comment.id)) { removed.add(comment.id); changed = true; } }
    return { ...current, comments: current.comments.filter(comment => !removed.has(comment.id)), replyTargets: Object.fromEntries(Object.entries(current.replyTargets || {}).filter(([, target]) => !removed.has(target))) };
  }, 'This comment could not be deleted. Try again.', isActive);
  return { data, ready, error, posting, draft, reply, add, toggleLike, remove };
}
