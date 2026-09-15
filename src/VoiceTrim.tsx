import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTrackPlayback } from './Audio';
import { AudioTrack, clockTime } from './audioData';
import { Icon, Label } from './ui';

export type VoiceRange = { start: number; end: number };
export function VoiceTrim({ track, peaks, duration, name, placeholder, range, onName, onRange, onStartOver, onNext, bottom }: {
  track: AudioTrack; peaks: number[]; duration: number; name: string; placeholder: string; range: VoiceRange;
  onName: (value: string) => void; onRange: (value: VoiceRange) => void; onStartOver: () => void; onNext: () => void; bottom: number;
}) {
  const playback = useTrackPlayback(track);
  const input = useRef<TextInput>(null);
  const [width, setWidth] = useState(1);
  const drag = useRef<{ kind: 'start' | 'end' | 'move'; x: number; initial: VoiceRange } | null>(null);
  const span = range.end - range.start;
  const stopping = useRef(false);
  useEffect(() => {
    if (playback.status.playing && playback.current >= range.end && !stopping.current) {
      stopping.current = true; playback.player.pause(); void playback.seek(range.end).finally(() => { stopping.current = false; });
    }
  }, [playback.current, playback.status.playing, range.end]);
  const play = async () => {
    if (playback.status.playing) { playback.player.pause(); return; }
    if (playback.current < range.start || playback.current >= range.end) await playback.seek(range.start);
    await playback.player.play();
  };
  const change = (kind: 'start' | 'end' | 'move', delta: number, initial = range) => {
    playback.player.pause();
    if (kind === 'start') onRange({ start: Math.max(0, Math.min(initial.end - 15, initial.start + delta)), end: initial.end });
    else if (kind === 'end') onRange({ start: initial.start, end: Math.min(duration, Math.max(initial.start + 15, initial.end + delta)) });
    else { const length = initial.end - initial.start; const start = Math.max(0, Math.min(duration - length, initial.start + delta)); onRange({ start, end: start + length }); }
  };
  const slider = (kind: 'start' | 'end' | 'move') => ({
    accessible: true,
    accessibilityRole: 'adjustable' as const,
    'aria-valuemin': 0, 'aria-valuemax': duration, 'aria-valuenow': kind === 'end' ? range.end : range.start,
    'aria-valuetext': kind === 'move' ? `${clockTime(range.start)} to ${clockTime(range.end)}` : clockTime(kind === 'end' ? range.end : range.start),
    accessibilityLabel: kind === 'start' ? 'Adjust start time' : kind === 'end' ? 'Adjust end time' : 'Move selection',
    accessibilityValue: { min: 0, max: duration, now: kind === 'end' ? range.end : range.start, text: kind === 'move' ? `${clockTime(range.start)} to ${clockTime(range.end)}` : clockTime(kind === 'end' ? range.end : range.start) },
    accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }],
    onAccessibilityAction: (event: any) => change(kind, event.nativeEvent.actionName === 'increment' ? 1 : -1),
    ...(Platform.OS === 'web' ? { tabIndex: 0 as const, onKeyDown: (event: any) => { if (['ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); change(kind, event.key === 'ArrowRight' ? 1 : -1); } } } : {}),
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (event: any) => { playback.player.pause(); drag.current = { kind, x: event.nativeEvent.pageX, initial: range }; },
    onResponderMove: (event: any) => { if (drag.current) change(kind, (event.nativeEvent.pageX - drag.current.x) / width * duration, drag.current.initial); },
    onResponderRelease: () => { drag.current = null; },
    onResponderTerminate: () => { drag.current = null; },
  });
  const left = range.start / duration * width;
  const right = range.end / duration * width;
  const count = Math.max(1, Math.ceil(width / 6));
  const bars = Array.from({ length: count }, (_, index) => Math.max(0, ...peaks.slice(
    Math.floor(index / count * peaks.length), Math.max(Math.floor(index / count * peaks.length) + 1, Math.ceil((index + 1) / count * peaks.length)),
  )));
  const playhead = Math.max(range.start, Math.min(range.end, playback.current)) / duration * width;
  return <View style={[T.page, { paddingBottom: bottom + 24 }]}>
    <View style={T.center}><View style={T.editor}>
      <View style={T.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={playback.status.playing ? 'Pause voice preview' : 'Play voice preview'} onPress={() => void play()} style={T.art}>
          <Image source={require('../assets/voice-hero.png')} style={T.artImage} accessible={false} />
          <Icon name={playback.status.playing ? 'pause' : 'play'} size={32} color="#FFFFFF" />
        </Pressable>
        <View style={T.nameRow}><TextInput ref={input} accessibilityLabel="Voice name" value={name} onChangeText={onName} placeholder={placeholder} placeholderTextColor="#65636A" selectionColor="#FD429C" returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} style={T.input} />
          <Pressable accessibilityRole="button" accessibilityLabel="Edit voice name" onPress={() => input.current?.focus()} style={T.edit}><Icon name="pencil" size={14} color="#65636A" /></Pressable>
        </View>
      </View>
      <View style={T.wave} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        <View pointerEvents="none" style={T.bars}>{bars.map((value, index) => <View key={index} style={{ position: 'absolute', left: index * 6 + 1.5, width: 3, top: (80 - Math.max(1, value * 80)) / 2, height: Math.max(1, value * 80), backgroundColor: '#101012' }} />)}</View>
        <View pointerEvents="none" style={[T.shade, { left: 0, width: left }]} /><View pointerEvents="none" style={[T.shade, { left: right, right: 0 }]} />
        <View {...slider('move')} style={[T.selection, { left: left + 12, width: Math.max(0, right - left - 24) }]} />
        <View {...slider('start')} style={[T.handle, { left }]} />
        <View {...slider('end')} style={[T.handle, { left: Math.max(left, right - 12), borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
        <View pointerEvents="none" style={[T.playhead, { left: Math.min(width - 2, Math.max(0, playhead - 2)) }]} />
      </View>
      <Label style={T.hint}>Select the part that sounds most like you</Label>
      {!!(playback.error || playback.status.error) && <Label accessibilityRole="alert" style={T.error}>{playback.error || 'This audio could not play. Try again.'}</Label>}
    </View></View>
    <View style={T.actions}><Pressable accessibilityRole="button" accessibilityLabel="Start over voice" onPress={() => { playback.player.pause(); onStartOver(); }} style={[T.button, T.secondary]}><Label style={T.buttonLabel}>Start over</Label></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Next voice step" accessibilityState={{ disabled: span < 15 }} disabled={span < 15} onPress={() => { playback.player.pause(); Keyboard.dismiss(); onNext(); }} style={[T.button, T.primary]}><Label style={[T.buttonLabel, { color: '#F7F4EF' }]}>Next</Label></Pressable>
    </View>
  </View>;
}
const T = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24 }, center: { flex: 1, justifyContent: 'center', minHeight: 208 }, editor: { gap: 16 },
  row: { height: 80, flexDirection: 'row', alignItems: 'center', gap: 11 }, art: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }, artImage: { position: 'absolute', width: 80, height: 80 }, nameRow: { flex: 1, flexDirection: 'row', alignItems: 'center' }, input: { minWidth: 0, flexShrink: 1, maxWidth: '100%', fontFamily: 'RobotoRegular', fontSize: 16, lineHeight: 20, height: 48, color: '#101012', padding: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }, edit: { width: 36, height: 48, alignItems: 'center', justifyContent: 'center' },
  wave: { height: 80, overflow: 'hidden', borderRadius: 4 }, bars: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }, shade: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#EDEAE4B3' }, selection: { position: 'absolute', top: 0, bottom: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FD429C' }, handle: { position: 'absolute', top: 0, bottom: 0, width: 12, backgroundColor: '#FD429C' }, playhead: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#101012' },
  hint: { color: '#65636A', fontSize: 12, lineHeight: 16, textAlign: 'center' }, error: { fontSize: 12, color: '#9D280A', textAlign: 'center' }, actions: { flexDirection: 'row', gap: 8 }, button: { flex: 1, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }, secondary: { backgroundColor: '#DEDBD5' }, primary: { backgroundColor: '#101012' }, buttonLabel: { fontSize: 16, lineHeight: 20, color: '#101012' },
});
