import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from './accountStorage';
export type NotificationAccess = 'checking' | 'default' | 'granted' | 'denied' | 'unsupported';
type Preferences = { dismissed: boolean; readIds: string[] };
const KEY = 'suno-ui:notifications:v1';
const initial: Preferences = { dismissed: false, readIds: [] };
export function useNotificationAccess() {
  const [access, setAccess] = useState<NotificationAccess>('checking');
  const [preferences, setPreferences] = useState(initial);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<'load' | 'save' | 'request' | 'settings' | 'refresh'>('load');
  const failedPatch = useRef<Partial<Preferences> | ((value: Preferences) => Partial<Preferences>) | null>(null);
  const [notice, setNotice] = useState('');
  const current = useRef(initial);
  const requests = useRef(false);
  const writes = useRef(Promise.resolve());
  const mounted = useRef(true);
  const refresh = useCallback(async () => {
    try {
      let next: NotificationAccess = 'unsupported';
      if (Platform.OS === 'web' && typeof Notification !== 'undefined') next = Notification.permission;
      else if (Platform.OS === 'android' && Number(Platform.Version) >= 33) next = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) ? 'granted' : 'default';
      if (mounted.current) setAccess(next);
    } catch { if (mounted.current) { setErrorAction('refresh'); setError('Notification permission could not be checked. Try again.'); } }
  }, []);
  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY); const value = raw ? JSON.parse(raw) : initial;
      if (typeof value.dismissed !== 'boolean' || !Array.isArray(value.readIds) || !value.readIds.every((id: unknown) => typeof id === 'string')) throw new Error('Invalid preferences');
      if (mounted.current) { current.current = value; setPreferences(value); setReady(true); setError(''); }
    } catch { if (mounted.current) { setErrorAction('load'); setError('Your notification preferences could not be loaded. Try again.'); } }
  }, []);
  useEffect(() => {
    mounted.current = true; void load(); void refresh();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const focus = () => { void refresh(); };
    if (Platform.OS === 'web') window.addEventListener('focus', focus);
    return () => { mounted.current = false; sub.remove(); if (Platform.OS === 'web') window.removeEventListener('focus', focus); };
  }, [load, refresh]);
  const save = useCallback((patch: Partial<Preferences> | ((value: Preferences) => Partial<Preferences>)) => {
    if (!ready) return Promise.resolve(false);
    let saved = false;
    const job = writes.current.catch(() => {}).then(async () => {
      const next = { ...current.current, ...(typeof patch === 'function' ? patch(current.current) : patch) };
      try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); current.current = next; failedPatch.current = null; saved = true; if (mounted.current) { setPreferences(next); setError(''); } }
      catch { failedPatch.current = patch; if (mounted.current) { setErrorAction('save'); setError('Notification preferences could not be saved. Try again.'); } }
    });
    writes.current = job; return job.then(() => saved);
  }, [ready]);
  const request = async () => {
    if (requests.current) return;
    requests.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (Platform.OS === 'web' && typeof Notification !== 'undefined') {
        const result = await Notification.requestPermission(); setAccess(result);
        if (result !== 'granted') setNotice(result === 'denied' ? 'Notifications are blocked. Allow them in this site’s browser settings, then try again.' : 'Permission was not granted. You can try again when you are ready.');
      } else if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        setAccess(granted ? 'granted' : 'denied');
        if (!granted) setNotice(result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'Permission was not granted. Try again or allow notifications in device settings.' : 'Permission was not granted. You can try again when you are ready.');
      } else setNotice('Notification permission controls are unavailable here. You can still open your local activity.');
    } catch { setErrorAction('request'); setError('Notification permission could not be requested. Try again.'); }
    finally { requests.current = false; if (mounted.current) setBusy(false); }
  };
  const openSettings = async () => {
    try { if (Platform.OS === 'web') setNotice('Open this site’s browser permissions, allow Notifications, and return here.'); else await Linking.openSettings(); }
    catch { setErrorAction('settings'); setError('Device settings could not be opened. Try again.'); }
  };
  return { access, preferences, ready, busy, error, errorAction, notice, retryError: async () => { if (errorAction === 'request') await request(); else if (errorAction === 'settings') await openSettings(); else if (errorAction === 'save' && failedPatch.current) await save(failedPatch.current); else { await load(); await refresh(); } }, request, openSettings, refresh, retry: async () => { await load(); await refresh(); }, dismiss: () => save({ dismissed: true }), showBanner: () => save({ dismissed: false }), markRead: (id: string) => save(value => ({ readIds: [...new Set([...value.readIds, id])] })) };
}
