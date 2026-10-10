import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Storage from './accountStorage';
import { AudioTrack } from './audioData';
import { Icon, Label, Sheet } from './ui';
export const SONG_REPORTS_KEY = 'suno-ui:song-reports:v1';
export function SongReport({ track, onClose, onSaved }: {
    track: AudioTrack;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const working = useRef(false);
    const active = useRef(true);
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    const close = () => { active.current = false; onClose(); };
    const save = async () => {
        if (working.current)
            return;
        working.current = true;
        setBusy(true);
        setError('');
        try {
            await Storage.updateItem(SONG_REPORTS_KEY, raw => {
                if (!active.current)
                    throw new Error('Cancelled');
                const data = raw ? JSON.parse(raw) : { version: 1, reports: [] };
                if (data?.version !== 1 || !Array.isArray(data.reports) || !data.reports.every((item: any) => item && typeof item.trackId === 'string' && Number.isFinite(item.createdAt)))
                    throw new Error('Invalid reports');
                if (!data.reports.some((item: any) => item.trackId === track.id))
                    data.reports.push({ trackId: track.id, createdAt: Date.now() });
                return JSON.stringify(data);
            });
            if (active.current)
                onSaved();
        }
        catch {
            if (active.current)
                setError('This local report could not be saved. Try again.');
        }
        finally {
            working.current = false;
            if (active.current)
                setBusy(false);
        }
    };
    return <Sheet compact onClose={close} backgroundColor="#1C1C1F">
    <View style={S.confirm}><Label style={S.heading}>Report this song?</Label><Label style={S.description}>Save a report in this local demo. Nothing is sent to Suno or the song's artist.</Label><Label numberOfLines={3} style={S.quote}>{track.title}</Label>
      {!!error && <Label accessibilityRole="alert" style={S.error}>{error}</Label>}
      <Pressable accessibilityRole="button" accessibilityLabel="Save local song report" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void save()} style={[S.save, busy && { opacity: 0.6 }]}><Label style={S.reportText}>{busy ? 'Saving…' : 'Save local report'}</Label></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel song report" onPress={close} style={S.cancel}><Label style={S.description}>Cancel</Label></Pressable>
    </View>
  </Sheet>;
}
const S = StyleSheet.create({
    confirm: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
    heading: { color: '#F7F4EF', fontSize: 20, lineHeight: 28 },
    description: { color: '#C2C2C1', fontSize: 14, lineHeight: 20 },
    quote: { color: '#929297', fontSize: 14, lineHeight: 20 },
    error: { color: '#FD429C', fontSize: 14, lineHeight: 20 },
    save: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: '#252529' },
    cancel: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
    reportText: { color: '#FD429C', fontSize: 16, lineHeight: 24 },
});
