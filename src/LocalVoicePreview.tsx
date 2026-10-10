import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { OwnVoice } from './useOwnVoices';
import { AudioTrack, clockTime, exampleTracks } from './audioData';
import { readDraftAudioFile } from './draftAudioFiles';
import { useTrackPlayback } from './Audio';
import { IconButton, Label } from './ui';
export function LocalVoicePreview({ voice, onPlay, libraryPlaying }: {
    voice: OwnVoice;
    onPlay: () => void;
    libraryPlaying: boolean;
}) {
    const [track, setTrack] = useState<AudioTrack | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const playback = useTrackPlayback(track);
    useEffect(() => { if (libraryPlaying)
        playback.player.pause(); }, [libraryPlaying]);
    useEffect(() => {
        let alive = true;
        let release = () => { };
        setLoading(true);
        setError('');
        setTrack(null);
        void (async () => {
            const example = exampleTracks.find(t => t.id === voice.sample.templateId);
            const file = example ? null : await readDraftAudioFile(voice.id);
            if (!alive) {
                file?.release();
                return;
            }
            release = file?.release || (() => { });
            setTrack({ id: voice.id, title: voice.name, styles: '', lyrics: '', source: example?.source || file!.source, clip: voice.sample.clip });
        })().catch(() => { if (alive)
            setError('Your saved Voice sample could not be opened. Try again.'); }).finally(() => { if (alive)
            setLoading(false); });
        return () => { alive = false; release(); };
    }, [voice.id, attempt]);
    return <View style={{ marginHorizontal: 16, marginTop: 20, gap: 8, alignItems: 'center' }}>
    <Label style={{ fontSize: 12, color: '#65636A', textAlign: 'center' }}>Your local audio sample · No voice model</Label>
    {loading ? <ActivityIndicator /> : error || playback.error || playback.status.error ? <><Label accessibilityRole="alert" style={{ color: '#9D280A', textAlign: 'center' }}>{error || playback.error || 'This sample could not load.'}</Label><Pressable accessibilityRole="button" accessibilityLabel="Retry saved Voice sample" onPress={() => setAttempt(value => value + 1)} style={{ minHeight: 44, justifyContent: 'center' }}><Label>Retry</Label></Pressable></> : <><IconButton name={playback.status.playing ? 'pause' : 'play'} label={playback.status.playing ? 'Pause saved Voice sample' : 'Play saved Voice sample'} disabled={!playback.status.isLoaded} onPress={() => { onPlay(); void playback.play(); }}/><Label accessibilityLabel="Saved Voice sample time" style={{ fontSize: 12, color: '#65636A' }}>{clockTime(playback.current)} / {clockTime(playback.duration)}</Label></>}
  </View>;
}
