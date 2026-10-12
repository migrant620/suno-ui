import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { DRAFT_CLEANUP_KEY } from './draftTransaction';
import { readAttachmentCleanup, retryAttachmentCleanup } from './draftCleanup';

export function useAttachmentCleanup() {
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(true); const working = useRef(false);
  const refresh = async () => {
    try {
      const items = await readAttachmentCleanup();
      if (alive.current) { setPending(items.length); setError(items.length ? 'Some previous attachments still need cleanup.' : ''); }
    } catch { if (alive.current) setError('Attachment cleanup could not be checked. Try again.'); }
  };
  const retry = async () => {
    if (working.current) return;
    working.current = true; if (alive.current) setBusy(true);
    try {
      const count = await retryAttachmentCleanup();
      if (alive.current) { setPending(count); setError(count ? 'Some previous attachments could not be removed. Try again.' : ''); }
    } catch { if (alive.current) setError('Previous attachments could not be cleaned up. Try again.'); }
    finally { working.current = false; if (alive.current) setBusy(false); }
  };
  useEffect(() => {
    alive.current = true; void retry();
    const changed = (event: StorageEvent) => { if (event.key === DRAFT_CLEANUP_KEY || event.key === null) void refresh(); };
    if (Platform.OS === 'web') window.addEventListener('storage', changed);
    const state = AppState.addEventListener('change', value => { if (value === 'active') void refresh(); });
    return () => { alive.current = false; state.remove(); if (Platform.OS === 'web') window.removeEventListener('storage', changed); };
  }, []);
  return { pending, busy, error, refresh, retry };
}
