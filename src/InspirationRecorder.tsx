import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { AudioTrack, clockTime } from './audioData';
import { useRecorder } from './useRecorder';
import { useTrackPlayback } from './Audio';
import { useSheetEscape } from './useSheetEscape';
import { Icon, IconButton, Label } from './ui';
export function InspirationRecorder({ onClose, onUse }: {
    onClose: () => void;
    onUse: (track: AudioTrack) => void;
}) {
    const recorder = useRecorder();
    const insets = useSafeAreaInsets();
    const [height, setHeight] = useState(0);
    const root = useRef<View>(null);
    const held = useRef(false);
    const starting = useRef<Promise<void> | null>(null);
    const current = useRef(recorder);
    current.current = recorder;
    const track = useMemo<AudioTrack | null>(() => recorder.file ? { id: `recording-${Date.now()}`, title: 'Bedtime recording', styles: '', lyrics: '', source: { uri: recorder.file.uri }, duration: recorder.file.duration } : null, [recorder.file]);
    const playback = useTrackPlayback(track);
    useSheetEscape(onClose, root);
    const begin = () => {
        held.current = true;
        if (starting.current || current.current.recording || current.current.file)
            return;
        starting.current = (async () => {
            await current.current.start();
            starting.current = null;
            if (!held.current)
                await current.current.stop();
        })();
    };
    const end = () => { held.current = false; void current.current.stop(); };
    return <Modal visible animationType="slide" onRequestClose={onClose}><StatusBar style="dark"/>
    <View style={S.outer}><SafeAreaView ref={root} edges={['top', 'bottom']} style={S.page} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
      <View style={S.header}><Pressable accessibilityRole="button" accessibilityLabel="Back from Audio to Song" onPress={onClose} style={S.back}><View style={S.backCircle}><ChevronLeft color="#101012" size={28} strokeWidth={2}/></View></Pressable><Label accessibilityLabel="Recording duration" style={S.time}>{clockTime(recorder.seconds)}</Label></View>
      <View style={[S.message, height > 0 && { top: insets.top + (height - insets.top - insets.bottom) * 0.3125 }]}>
        <View style={S.badge}><Icon name="microphone" color="#6A6A72" size={14}/><Label style={S.badgeText}>AUDIO TO SONG</Label></View>
        <Label style={S.title}>Wind down with a bedtime song</Label>
        <Label style={S.subtitle}>Record how today felt and turn it into a song</Label>
      </View>
      <View style={S.footer}>
        {!!recorder.error && <Label accessibilityRole="alert" style={S.error}>{recorder.error}</Label>}
        {!!playback.error && <Label accessibilityRole="alert" style={S.error}>{playback.error}</Label>}
        {track ? <View style={S.review}>
          <Label style={S.disclosure}>Local recording · Continue to Create to use your audio with an example song.</Label>
          <View style={S.reviewActions}><IconButton name={playback.status.playing ? 'pause' : 'play'} label={playback.status.playing ? 'Pause recording preview' : 'Play recording preview'} onPress={() => void playback.play()} style={S.preview}/><Pressable accessibilityRole="button" accessibilityLabel="Record again" onPress={() => { playback.player.pause(); recorder.discard(); }} style={S.again}><Label>Record again</Label></Pressable></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Use bedtime recording" style={S.use} onPress={() => { playback.player.pause(); if (recorder.take())
            onUse(track); }}><Label style={S.useText}>Continue to Create</Label></Pressable>
        </View> : <Pressable accessibilityRole="button" accessibilityLabel="Hold to record" accessibilityHint="Hold for at least six seconds. Release to review your local recording." onPressIn={begin} onPressOut={end} accessibilityActions={[{ name: 'start', label: 'Start recording' }, { name: 'stop', label: 'Stop recording' }]} onAccessibilityAction={event => event.nativeEvent.actionName === 'start' ? begin() : end()} testID="inspiration-record-target" style={S.record}>{recorder.busy ? <ActivityIndicator color="#C32906"/> : <View style={[S.dot, recorder.recording && S.recording]}/>}</Pressable>}
      </View>
    </SafeAreaView></View>
  </Modal>;
}
const S = StyleSheet.create({
    outer: { flex: 1, alignItems: 'center', backgroundColor: '#EDEAE4' },
    page: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: '#EDEAE4' },
    header: { height: 64, justifyContent: 'center', alignItems: 'center' },
    back: { position: 'absolute', left: 16, top: 8, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    backCircle: { width: 40, height: 40, borderRadius: 99, backgroundColor: '#E5E2DC', alignItems: 'center', justifyContent: 'center' },
    time: { fontSize: 16, lineHeight: 20, fontFamily: 'RobotoRegular', fontVariant: ['tabular-nums'], color: '#101012' },
    message: { position: 'absolute', top: '31.25%', left: 16, right: 16, alignItems: 'center' },
    badge: { height: 32, paddingHorizontal: 14, gap: 6, borderRadius: 99, backgroundColor: '#E5E2DC', flexDirection: 'row', alignItems: 'center' },
    badgeText: { fontSize: 10, lineHeight: 12, fontFamily: 'RobotoBold', letterSpacing: 1, color: '#101012' },
    title: { fontSize: 18, lineHeight: 22, fontFamily: 'RobotoBold', textAlign: 'center', marginTop: 12, color: '#101012' },
    subtitle: { fontSize: 14, lineHeight: 16, textAlign: 'center', marginTop: 4, color: '#101012' },
    footer: { marginTop: 'auto', paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center', gap: 12 },
    record: { width: 100, height: 100, borderRadius: 99, backgroundColor: '#D7D4CF', alignItems: 'center', justifyContent: 'center' },
    dot: { width: 72, height: 72, borderRadius: 99, backgroundColor: '#C32906' },
    recording: { width: 40, height: 40, borderRadius: 8 },
    error: { color: '#9D280A', textAlign: 'center', fontSize: 13, lineHeight: 18 },
    review: { alignSelf: 'stretch', gap: 12 },
    disclosure: { fontSize: 13, lineHeight: 18, textAlign: 'center', color: '#626168' },
    reviewActions: { flexDirection: 'row', justifyContent: 'center', gap: 16, alignItems: 'center' },
    preview: { width: 56, height: 56, borderRadius: 99, backgroundColor: '#D7D4CF' },
    again: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
    use: { height: 56, borderRadius: 99, backgroundColor: '#101012', alignItems: 'center', justifyContent: 'center' },
    useText: { color: '#F7F4EF', fontSize: 18, fontFamily: 'RobotoMedium' },
});
