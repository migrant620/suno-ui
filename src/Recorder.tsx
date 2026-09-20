import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AudioTrack, clockTime } from './audioData';
import { useRecorder } from './useRecorder';
import { useTrackPlayback } from './Audio';
import { C, Icon, IconButton, Label, Sheet } from './ui';
export function Recorder({ onClose, onUse }: {
    onClose: () => void;
    onUse: (track: AudioTrack) => void;
}) {
    const recorder = useRecorder();
    const track = useMemo<AudioTrack | null>(() => recorder.file ? { id: `recording-${Date.now()}`, title: 'Audio recording', styles: '', lyrics: '', source: { uri: recorder.file.uri }, duration: recorder.file.duration } : null, [recorder.file]);
    const playback = useTrackPlayback(track);
    return <Sheet onClose={onClose} backgroundColor="#E0DEDA">
    <View style={R.content}><Label style={R.title}>Record Audio</Label><Label style={R.subtitle}>Your recording stays on this device.</Label>
      <View style={R.center}><View style={R.line}/><Icon name={recorder.recording ? 'microphone' : recorder.file ? 'waveform' : 'microphone-outline'} size={52} color={recorder.recording ? '#C32906' : C.muted}/><View style={R.line}/></View>
      <Label accessibilityLabel="Recording duration" style={R.time}>{clockTime(recorder.seconds)}</Label>
      <Label style={R.hint}>{recorder.file ? 'Listen back or attach your recording.' : recorder.recording ? 'Recording… Tap to stop.' : 'Tap to record at least 6 seconds.'}</Label>
      {!!recorder.error && <Label accessibilityRole="alert" accessibilityLiveRegion="polite" style={R.error}>{recorder.error}</Label>}
      {!!playback.error && <Label accessibilityRole="alert" style={R.error}>{playback.error}</Label>}
      <View style={R.actions}>{recorder.file ? <><IconButton name={playback.status.playing ? 'pause' : 'play'} label={playback.status.playing ? 'Pause recording preview' : 'Play recording preview'} onPress={() => void playback.play()} style={R.preview}/><Pressable accessibilityRole="button" accessibilityLabel="Record again" onPress={() => { playback.player.pause(); recorder.discard(); }} style={R.again}><Label>Record again</Label></Pressable></> : <Pressable accessibilityRole="button" accessibilityLabel={recorder.recording ? 'Stop recording' : 'Start recording'} disabled={recorder.busy} accessibilityState={{ disabled: recorder.busy }} onPress={() => recorder.recording ? void recorder.stop() : void recorder.start()} style={R.record}>{recorder.busy ? <ActivityIndicator color={C.white}/> : recorder.recording ? <View style={R.stop}/> : <View style={R.dot}/>}</Pressable>}</View>
      {track && <Pressable accessibilityRole="button" accessibilityLabel="Use recording" onPress={() => { playback.player.pause(); if (recorder.take())
        onUse(track); }} style={R.use}><Label style={{ color: C.white, fontFamily: 'RobotoMedium', fontSize: 18 }}>Use recording</Label></Pressable>}
    </View>
  </Sheet>;
}
const R = StyleSheet.create({ content: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 8 }, title: { fontSize: 24, lineHeight: 30, fontFamily: 'RobotoMedium' }, subtitle: { fontSize: 13, color: C.muted, marginTop: 10 }, center: { flex: 1, minHeight: 80, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 20 }, line: { flex: 1, height: 1, backgroundColor: '#A8A6A2' }, time: { fontFamily: 'RobotoRegular', fontSize: 38, lineHeight: 46, fontVariant: ['tabular-nums'] }, hint: { fontSize: 14, color: C.muted, marginTop: 12, textAlign: 'center' }, error: { marginTop: 16, color: '#9D280A', fontSize: 13, lineHeight: 19, textAlign: 'center' }, actions: { minHeight: 150, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 16 }, record: { width: 96, height: 96, borderRadius: 99, borderWidth: 2, borderColor: '#C32906', justifyContent: 'center', alignItems: 'center' }, dot: { width: 80, height: 80, borderRadius: 99, backgroundColor: '#C32906' }, stop: { width: 42, height: 42, borderRadius: 6, backgroundColor: '#C32906' }, preview: { width: 64, height: 64, borderRadius: 99, backgroundColor: '#C9C7C4' }, again: { minHeight: 48, paddingHorizontal: 20, justifyContent: 'center' }, use: { alignSelf: 'stretch', height: 56, borderRadius: 99, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 16 } });
