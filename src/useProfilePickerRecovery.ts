import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { ProfilePickerSession, recoverProfilePicker, clearProfilePicker } from './profilePickerSession';

export function useProfilePickerRecovery(accountReady: boolean, accountId: string | undefined, onRestore: () => void) {
  const [session, setSession] = useState<ProfilePickerSession | null>(null);
  const [ready, setReady] = useState(Platform.OS !== 'android');
  const [error, setError] = useState('');
  const mounted = useRef(true);
  const generation = useRef(0);
  const restore = useRef(onRestore); restore.current = onRestore;
  const retry = async () => {
    if (Platform.OS !== 'android' || !accountReady || !accountId) return;
    const attempt = ++generation.current;
    const active = () => mounted.current && generation.current === attempt;
    setReady(false); setError('');
    try {
      const value = await recoverProfilePicker(accountId, active);
      if (active()) { setSession(value); if (value) restore.current(); setReady(true); }
    } catch { if (active()) setError('Your saved profile changes could not be restored. Retry or discard these unsaved changes.'); }
  };
  const discard = async () => {
    setError('');
    try { await clearProfilePicker(); if (mounted.current) { setSession(null); setReady(true); } }
    catch { if (mounted.current) setError('Your saved changes could not be discarded. Please try again.'); }
  };
  useEffect(() => {
    mounted.current = true; void retry();
    return () => { mounted.current = false; generation.current += 1; };
  }, [accountReady, accountId]);
  return { session, ready, error, retry, discard, clear: () => setSession(null) };
}
