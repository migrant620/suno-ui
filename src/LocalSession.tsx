import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, StyleSheet, View } from 'react-native';
import Storage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Label } from './ui';
import accountStorage, { ACCOUNT_CONTROL, SESSION_KEY, accountEpoch, beginAccountDeletion, bindAccount, finishAccountDeletion, openLocalAccount, readAccountState } from './accountStorage';
type Session = {
    leave: () => Promise<void>;
    deleteAccount: () => Promise<void>;
};
const unavailable = async () => { throw new Error('Session unavailable'); };
const Context = createContext<Session>({ leave: unavailable, deleteAccount: unavailable });
export const useLocalSession = () => useContext(Context);
type Phase = 'loading' | 'active' | 'signed-out' | 'closing' | 'closed';
export function LocalSession({ children }: {
    children: React.ReactNode;
}) {
    const [phase, setPhase] = useState<Phase>('loading');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const changing = useRef(false);
    const reading = useRef(0);
    const load = async (initial = false) => {
        const request = ++reading.current;
        try {
            const state = await readAccountState();
            const saved = await Storage.getItem(SESSION_KEY);
            if (saved !== null && !['active', 'signed-out'].includes(saved))
                throw new Error('Invalid session');
            if (initial)
                bindAccount(state);
            if (state.phase === 'active' && saved !== 'signed-out' && state.epoch === accountEpoch())
                await accountStorage.recoverDraft();
            if (request !== reading.current)
                return;
            setPhase(state.phase !== 'active' ? state.phase : saved === 'signed-out' || state.epoch !== accountEpoch() ? 'signed-out' : 'active');
            setError('');
        }
        catch {
            if (request === reading.current) {
                setPhase('loading');
                setError('Your local session could not be loaded. Try again.');
            }
        }
    };
    useEffect(() => {
        void load(true);
        const changed = (event: StorageEvent) => { if ([ACCOUNT_CONTROL, SESSION_KEY].includes(event.key || ''))
            void load(); };
        if (Platform.OS === 'web')
            window.addEventListener('storage', changed);
        const subscription = AppState.addEventListener('change', state => { if (state === 'active')
            void load(); });
        return () => { reading.current += 1; subscription.remove(); if (Platform.OS === 'web')
            window.removeEventListener('storage', changed); };
    }, []);
    const finish = async () => {
        if (changing.current)
            return;
        changing.current = true;
        setBusy(true);
        setError('');
        try {
            await finishAccountDeletion();
            setPhase('closed');
        }
        catch {
            setError('Some local data could not be removed. Retry to finish deleting this local account.');
        }
        finally {
            changing.current = false;
            setBusy(false);
        }
    };
    useEffect(() => { if (phase === 'closing')
        void finish(); }, [phase]);
    const leave = async () => {
        if (changing.current)
            return;
        changing.current = true;
        try {
            await accountStorage.setItem(SESSION_KEY, 'signed-out');
            setPhase('signed-out');
        }
        finally {
            changing.current = false;
        }
    };
    const remove = async () => {
        if (changing.current)
            return;
        changing.current = true;
        try {
            await beginAccountDeletion();
            setError('');
            setPhase('closing');
        }
        finally {
            changing.current = false;
        }
    };
    const open = async () => {
        if (changing.current)
            return;
        changing.current = true;
        setBusy(true);
        try {
            await openLocalAccount();
            setError('');
            setPhase('active');
        }
        catch {
            setError('The local session could not be saved. Try again.');
        }
        finally {
            changing.current = false;
            setBusy(false);
        }
    };
    if (phase === 'active')
        return <Context.Provider value={{ leave, deleteAccount: remove }}>{children}</Context.Provider>;
    const label = phase === 'loading' ? 'Retry local session' : phase === 'closing' ? 'Retry account deletion' : 'Continue local demo';
    return <SafeAreaView style={S.page}><StatusBar style="light"/><View style={S.content}><Label style={S.brand}>suno</Label>
    {phase === 'loading' && !error ? <ActivityIndicator color="#FFF" accessibilityLabel="Loading local session"/> : <>
      <Label style={S.title}>{phase === 'closing' ? 'Deleting local account…' : phase === 'closed' ? 'Local account deleted' : phase === 'loading' ? 'Your local session' : 'Music starts here.'}</Label>
      <Label style={S.description}>{phase === 'closing' ? 'Removing saved demo songs, playlists, profile, drafts and downloaded audio from this device.' : phase === 'closed' ? 'Your saved demo data has been removed. Continue to start a fresh local demo. Device appearance and system permissions are kept.' : 'Explore this local interface demo. Your saved examples, playlists and profile remain on this device.'}</Label>
      {phase === 'closing' && busy ? <ActivityIndicator color="#FFF" accessibilityLabel="Deleting local data"/> : <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy} onPress={() => phase === 'loading' ? void load(true) : phase === 'closing' ? void finish() : void open()} style={S.button}><Label style={S.buttonText}>{phase === 'loading' ? 'Try Again' : phase === 'closing' ? 'Retry deletion' : busy ? 'Opening…' : 'Continue local demo'}</Label></Pressable>}
    </>}{!!error && <Label accessibilityRole="alert" style={S.error}>{error}</Label>}<Label style={S.local}>Local demo · No Suno account login</Label>
  </View></SafeAreaView>;
}
const S = StyleSheet.create({ page: { flex: 1, backgroundColor: '#101012', justifyContent: 'center', alignItems: 'center' }, content: { width: '100%', maxWidth: 480, padding: 28, alignItems: 'center', gap: 24 }, brand: { fontFamily: 'InstrumentSerif', color: '#F7F4EF', fontSize: 72, lineHeight: 84 }, title: { fontSize: 32, lineHeight: 40, color: '#F7F4EF', textAlign: 'center' }, description: { color: '#C7C6CD', lineHeight: 24, textAlign: 'center' }, button: { backgroundColor: '#F7F4EF', minHeight: 52, borderRadius: 99, paddingHorizontal: 28, justifyContent: 'center' }, buttonText: { color: '#101012', fontFamily: 'RobotoMedium' }, error: { color: '#FFB1A3', lineHeight: 22 }, local: { color: '#96959D', fontSize: 12, textAlign: 'center' } });
