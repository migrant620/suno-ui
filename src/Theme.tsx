import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from './accountStorage';
import { tokens } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColors = { [K in keyof typeof tokens.colors]: string } & { field: string; control: string; divider: string; secondary: string };
const light: ThemeColors = { ...tokens.colors, field: '#EEEBE7', control: '#E5E2DD', divider: '#DDDAD5', secondary: '#626168' };
const dark: ThemeColors = { ...tokens.colors, surface: '#101012', ink: '#F7F4EF', toolbar: '#28282A', muted: '#B8B7BC', border: '#28282A', handle: '#C3C2C7', field: '#19191B', control: '#28282A', divider: '#28282A', secondary: '#BFBEC4' };
type ThemeValue = { mode: ThemeMode; dark: boolean; colors: ThemeColors; ready: boolean; error: string; select: (mode: ThemeMode) => Promise<boolean>; retry: () => void };
const Theme = createContext<ThemeValue>({ mode: 'system', dark: false, colors: light, ready: false, error: '', select: async () => false, retry: () => {} });
const Surface = createContext(light);
export const useTheme = () => useContext(Theme);
export const useSurfaceColors = () => useContext(Surface);
export function ThemedSurface({ children }: { children: React.ReactNode }) { const theme = useTheme(); return <Surface.Provider value={theme.colors}>{children}</Surface.Provider>; }
export function LightSurface({ children }: { children: React.ReactNode }) { return <Surface.Provider value={light}>{children}</Surface.Provider>; }
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const failedMode = useRef<ThemeMode | null>(null);
  const writes = useRef(Promise.resolve());
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    let current = true;
    AsyncStorage.getItem('suno-ui:theme:v1').then(value => {
      if (value && !['light', 'dark', 'system'].includes(value)) throw new Error('Invalid theme');
      if (current) { setMode((value as ThemeMode) || 'system'); setReady(true); setError(''); }
    }).catch(() => { if (current) setError('Your theme could not be loaded. Try again.'); });
    return () => { current = false; };
  }, [loadAttempt]);
  const select = (next: ThemeMode) => {
    let saved = false;
    const job = writes.current.catch(() => {}).then(async () => {
      if (!ready) return;
      try { await AsyncStorage.setItem('suno-ui:theme:v1', next); saved = true; failedMode.current = null; if (active.current) { setMode(next); setError(''); } }
      catch { failedMode.current = next; if (active.current) setError('The theme could not be saved. Try again.'); }
    });
    writes.current = job;
    return job.then(() => saved);
  };
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return <Theme.Provider value={{ mode, dark: isDark, colors: isDark ? dark : light, ready, error, select, retry: () => { if (failedMode.current) void select(failedMode.current); else setLoadAttempt(value => value + 1); } }}>{children}</Theme.Provider>;
}
