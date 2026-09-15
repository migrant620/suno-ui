import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Upload from 'lucide-react-native/icons/upload';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { AudioConfirm, useTrackPlayback } from './Audio';
import { AudioTrack, clockTime } from './audioData';
import { useRecorder } from './useRecorder';
import { useVoiceWaveform } from './useVoiceWaveform';
import { VoiceRange, VoiceTrim } from './VoiceTrim';
import { Icon, IconButton, Label, Sheet } from './ui';

type Props = { ownerName: string; songs: AudioTrack[]; publicSongs: AudioTrack[]; likedSongs: AudioTrack[]; onClose: () => void; onUse: (track: AudioTrack) => void; onCreate: (track: AudioTrack, isActive: () => boolean) => Promise<void>; canCreate: boolean };
type Route = 'main' | 'library' | 'loading' | 'trim' | 'sample';

export function Voice({ ownerName, songs, publicSongs, likedSongs, onClose, onUse, onCreate, canCreate }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === 'android' ? insets.bottom : 0;
  const [route, setRoute] = useState<Route>('main');
  const [tab, setTab] = useState('Recents');
  const [selected, setSelected] = useState<AudioTrack | null>(null);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState(false);
  const [explained, setExplained] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const savePending = useRef(false);
  const saveVersion = useRef(0);
  const pickerPending = useRef(false);
  const alive = useRef(true);
  const recorder = useRecorder(15);
  const waveform = useVoiceWaveform(selected);
  const [voiceName, setVoiceName] = useState('');
  const [range, setRange] = useState<VoiceRange>({ start: 0, end: 0 });
  const [consent, setConsent] = useState(false);
  const playback = useTrackPlayback(route === 'sample' && selected ? { ...selected, clip: range } : selected);
  const hold = useRef(false);
  const starting = useRef(false);
  const stopAfterStart = useRef(false);
  const lastTap = useRef(0);
  const lastRecording = useRef('');
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!recorder.file || recorder.file.uri === lastRecording.current) return;
    lastRecording.current = recorder.file.uri;
    setSelected({ id: `voice-recording-${Date.now()}`, title: 'Voice recording', styles: '', lyrics: '', source: { uri: recorder.file.uri }, duration: recorder.file.duration });
    setRoute('loading');
  }, [recorder.file]);
  useEffect(() => {
    if (route !== 'loading' || !selected || waveform.loading) return;
    if (waveform.error) { setError(waveform.error); setSelected(null); setRoute('main'); }
    else if (waveform.duration > 0) {
      if (waveform.duration < 15) { setError('This audio is too short. Audio must be at least 15 seconds.'); setSelected(null); recorder.discard(); setRoute('main'); }
      else { setRange({ start: 0, end: waveform.duration }); setRoute('trim'); }
    }
  }, [route, selected, waveform]);
  // Native recording state arrives asynchronously after prepareToRecordAsync.
  useEffect(() => { if (recorder.recording && stopAfterStart.current) { stopAfterStart.current = false; void recorder.stop(); } }, [recorder.recording]);
  const start = async () => {
    if (starting.current || recorder.busy) return;
    if (!explained) { setPermission(true); hold.current = false; return; }
    starting.current = true; playback.player.pause(); setError('');
    await recorder.start(); starting.current = false;
  };
  const resetSample = () => { playback.player.pause(); setSelected(null); recorder.discard(); setVoiceName(''); setConsent(false); setRoute('main'); setError(''); };
  const back = () => {
    saveVersion.current += 1;
    playback.player.pause();
    if (permission) { setPermission(false); return; }
    if (consent) { setConsent(false); return; }
    if (route === 'sample') { setRoute('trim'); return; }
    if (route === 'trim' || route === 'loading') { resetSample(); return; }
    if (route === 'library') { setSelected(null); setRoute('main'); return; }
    onClose();
  };
  const upload = async () => {
    if (pickerPending.current) return;
    pickerPending.current = true; setPicking(true); setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (!alive.current || result.canceled) return;
      const asset = result.assets[0];
      if (!asset) throw new Error('Choose an audio file that is not empty.');
      // Document providers may return stale size metadata. Inspect the copied file.
      const info = Platform.OS === 'web' ? null : await FileSystem.getInfoAsync(asset.uri);
      if (!alive.current) return;
      if (info && !info.exists) throw new Error('The audio file could not be opened. Try again.');
      const size = info?.exists ? info.size : asset.size;
      if (size === 0) throw new Error('Choose an audio file that is not empty.');
      setSelected({ id: `voice-upload-${Date.now()}`, title: asset.name, styles: '', lyrics: '', source: { uri: asset.uri } });
      setVoiceName(''); setRoute('loading');
    } catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'The audio file could not be opened. Try again.'); }
    finally { pickerPending.current = false; if (alive.current) setPicking(false); }
  };
  const choose = (track: AudioTrack) => { playback.player.pause(); setSelected(track); setVoiceName(''); setRoute('loading'); setError(''); };
  const usable = playback.status.isLoaded && !playback.status.error && playback.duration > 0;
  const createVoice = async () => {
    if (!selected || !usable || !canCreate || savePending.current) return;
    savePending.current = true; setSaving(true); setError(''); playback.player.pause();
    const version = ++saveVersion.current;
    const isActive = () => alive.current && version === saveVersion.current;
    try {
      await onCreate({ ...selected, title: voiceName.trim() || `${ownerName}'s voice`, clip: range }, isActive);
    } catch (cause) { if (isActive()) setError(cause instanceof Error ? cause.message : 'Your Voice could not be saved. Try again.'); }
    finally { savePending.current = false; if (alive.current) setSaving(false); }
  };
  const finish = () => { if (!selected || !usable) return; playback.player.pause(); if (selected.id.startsWith('voice-recording-')) recorder.take(); onUse({ ...selected, title: voiceName.trim() || `${ownerName}'s voice`, clip: range, waveform: waveform.peaks.slice(Math.floor(range.start / waveform.duration * waveform.peaks.length), Math.ceil(range.end / waveform.duration * waveform.peaks.length)) }); };
  const choices = tab === 'Public' ? publicSongs : tab === 'Liked' ? likedSongs : songs;
  return <Sheet onClose={back} backgroundColor="#EDEAE4" handleHeight={44} handlePaddingTop={16} keyboardAvoiding handleColor="#7F7D83">
    {route === 'main' || route === 'loading' ? <View style={[V.main, { paddingBottom: bottom }]}>
      <Label style={V.title}>Create a Voice</Label>
      <View style={V.center}><View style={V.heroGroup}>
        <Image source={require('../assets/voice-hero.png')} style={V.hero} accessible={false} />
        <Label style={V.sing}>{route === 'loading' ? 'Opening audio…' : recorder.recording ? 'Recording your voice…' : 'Sing or rap your favorite song'}</Label>
        {(recorder.recording || recorder.busy) && <Label accessibilityLabel="Voice recording duration" style={V.duration}>{clockTime(recorder.seconds)}</Label>}
      </View></View>
      {!!(error || recorder.error) && <Label accessibilityRole="alert" accessibilityLiveRegion="polite" style={V.error}>{error || recorder.error}</Label>}
      <View style={V.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Upload voice audio" disabled={route === 'loading' || picking || recorder.recording || recorder.busy} accessibilityState={{ disabled: route === 'loading' || picking || recorder.recording || recorder.busy }} onPress={() => void upload()} style={({ pressed }) => [V.side, pressed && V.pressed]}>
          <View style={V.sideCircle}>{picking ? <ActivityIndicator color="#101012" /> : <Upload color="#101012" size={24} strokeWidth={2.5} accessible={false} aria-hidden />}</View><Label style={V.sideLabel}>Upload</Label>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={recorder.recording ? 'Stop voice recording' : 'Hold to record, or double-tap to start'} accessibilityHint="Hold to record, release to stop. Double-tap to start hands-free recording." accessibilityState={{ disabled: recorder.busy || route === 'loading' }} disabled={recorder.busy || route === 'loading'}
          delayLongPress={350} onLongPress={() => { if (!recorder.recording) { hold.current = true; stopAfterStart.current = false; void start(); } }}
          onPressOut={() => { if (hold.current) { hold.current = false; stopAfterStart.current = true; if (recorder.recording) { stopAfterStart.current = false; void recorder.stop(); } } }}
          onPress={() => { if (starting.current || stopAfterStart.current) return; if (recorder.recording) { void recorder.stop(); return; } const now = Date.now(); if (now - lastTap.current < 350) { lastTap.current = 0; void start(); } else lastTap.current = now; }}
          onAccessibilityTap={() => recorder.recording ? void recorder.stop() : void start()}
          style={({ pressed }) => [V.record, pressed && V.pressed]}>
          {recorder.busy ? <ActivityIndicator color="#C32906" /> : <View style={recorder.recording ? V.stop : V.recordCore} />}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Voice Library" disabled={route === 'loading' || recorder.recording || recorder.busy} accessibilityState={{ disabled: route === 'loading' || recorder.recording || recorder.busy }} onPress={() => { setTab('Recents'); setRoute('library'); setError(''); }} style={({ pressed }) => [V.side, pressed && V.pressed]}>
          <View style={V.sideCircle}><Icon name="bookshelf" size={24} color="#101012" /></View><Label style={V.sideLabel}>Library</Label>
        </Pressable>
      </View>
    </View> : route === 'library' ? <View style={[V.main, { paddingBottom: bottom }]}>
      <Label style={V.pickerTitle}>Select a song</Label>
      <Label style={V.subtitle}>This song will be used to create your voice</Label>
      <View style={V.tabs}>{['Recents', 'Public', 'Liked'].map(name => <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: tab === name }} aria-selected={tab === name} onPress={() => setTab(name)} style={[V.tab, tab === name && V.selectedTab]}><Label style={[V.tabLabel, tab !== name && { color: '#807D84' }]}>{name}</Label></Pressable>)}</View>
      <ScrollView contentContainerStyle={V.list}>
        {choices.map(track => <Pressable key={track.id} accessibilityRole="button" accessibilityLabel={`Select voice song ${track.title}`} onPress={() => choose(track)} style={({ pressed }) => [V.song, pressed && V.pressed]}>
          {track.cover ? <Image source={track.cover} style={V.cover} /> : <Icon name="music-note" color="#101012" />}
          <View style={{ flex: 1 }}><Label style={V.songTitle}>{track.title}</Label><Label numberOfLines={1} style={V.songDetail}>{track.styles}</Label></View><Icon name="chevron-right" color="#65636A" />
        </Pressable>)}
      </ScrollView>
    </View> : route === 'trim' && selected ? <VoiceTrim track={selected} peaks={waveform.peaks} duration={waveform.duration} name={voiceName} placeholder={`${ownerName}'s voice (optional)`} range={range} onName={setVoiceName} onRange={setRange} onStartOver={resetSample} onNext={() => setConsent(true)} bottom={bottom} /> : <View style={[V.sample, { paddingBottom: 24 + bottom }]}>
      <Label style={V.title}>Voice audio sample</Label>
      <Label style={V.disclosure}>Save a local Voice with this audio sample, then select it from your profile. No audio is sent and no voice model is trained. Example songs keep their original sound.</Label>
      <View style={V.sampleCenter}><Icon name="account-voice" size={64} color="#101012" /><Label numberOfLines={2} style={V.sampleName}>{voiceName.trim() || `${ownerName}'s voice`}</Label>
        <Label accessibilityLabel="Voice preview time" style={V.duration}>{clockTime(playback.current)} / {clockTime(playback.duration)}</Label>
        <IconButton name={playback.status.playing ? 'pause' : 'play'} label={playback.status.playing ? 'Pause voice preview' : 'Play voice preview'} onPress={() => void playback.play()} style={V.preview} color="#101012" />
      </View>
      {!!(playback.error || playback.status.error) && <Label accessibilityRole="alert" style={V.error}>{playback.error || 'This audio could not load. Choose another sample.'}</Label>}
      {!!error && <Label accessibilityRole="alert" style={V.error}>{error}</Label>}
      <Pressable accessibilityRole="button" accessibilityLabel="Choose another voice sample" disabled={saving} onPress={resetSample} style={V.another}><Label style={V.songTitle}>Choose another sample</Label></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Create local Voice" accessibilityState={{ disabled: !usable || !canCreate || saving }} disabled={!usable || !canCreate || saving} onPress={() => void createVoice()} style={[V.use, (!usable || !canCreate || saving) && { opacity: 0.4 }]}>{saving ? <ActivityIndicator color="#F7F4EF" /> : <Label style={{ color: '#F7F4EF', fontSize: 18 }}>Create local Voice</Label>}</Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Use voice sample as audio" accessibilityState={{ disabled: !usable || saving }} disabled={!usable || saving} onPress={finish} style={V.another}><Label style={V.songTitle}>Use as audio sample</Label></Pressable>
    </View>}
    {consent && <Sheet compact onClose={() => setConsent(false)} backgroundColor="#E0DEDA"><View style={{ paddingHorizontal: 16, paddingBottom: 24 + bottom, gap: 24 }}><Label style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', color: '#65636A' }}>In Suno, creating a Voice requires consent to processing voice-related data, which may be considered biometric information. This local demo does not send audio or create a biometric voice model. This confirmation only continues the local sample preview. It does not accept Suno’s Terms of Service or Privacy Policy.</Label><Pressable accessibilityRole="button" accessibilityLabel="Accept local Voice demo" onPress={() => { setConsent(false); setRoute('sample'); }} style={V.use}><Label style={{ color: '#F7F4EF', fontSize: 18 }}>I accept</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Cancel Voice consent" onPress={() => setConsent(false)} style={[V.use, { backgroundColor: '#D7D4CF', marginTop: -8 }]}><Label style={{ color: '#101012', fontSize: 18 }}>Cancel</Label></Pressable></View></Sheet>}
    {permission && <AudioConfirm title="Allow microphone access" description="Suno uses your microphone to record audio." confirm="Continue" cancel="Not Now" onCancel={() => setPermission(false)} onConfirm={() => { setPermission(false); setExplained(true); hold.current = false; stopAfterStart.current = false; playback.player.pause(); void recorder.start(); }} />}
  </Sheet>;
}

const V = StyleSheet.create({
  main: { flex: 1 }, title: { fontFamily: 'RobotoBold', fontSize: 18, lineHeight: 22, textAlign: 'center', color: '#101012' },
  center: { flex: 1, minHeight: 170, justifyContent: 'center' }, heroGroup: { alignItems: 'center', transform: [{ translateY: -20 }] }, hero: { width: 196, height: 196 },
  sing: { fontSize: 18, lineHeight: 22, color: '#101012', textAlign: 'center', marginTop: 18, paddingHorizontal: 12 },
  controls: { height: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 24, marginBottom: 24 },
  side: { width: 56, alignItems: 'center', marginBottom: 2 }, sideCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E2DC', alignItems: 'center', justifyContent: 'center' }, sideLabel: { fontSize: 12, lineHeight: 16, marginTop: 4, color: '#65636A' },
  record: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#D7D4CF', alignItems: 'center', justifyContent: 'center' }, recordCore: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#C32906' }, stop: { width: 38, height: 38, borderRadius: 6, backgroundColor: '#C32906' }, pressed: { opacity: 0.65 },
  pickerTitle: { color: '#101012', fontFamily: 'RobotoRegular', fontSize: 16, lineHeight: 20, marginTop: -8, textAlign: 'center' }, subtitle: { color: '#65636A', fontSize: 12, lineHeight: 16, marginTop: 4, textAlign: 'center' },
  tabs: { flexDirection: 'row', marginTop: 6, borderBottomWidth: 1, borderBottomColor: '#969398' }, tab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' }, selectedTab: { borderBottomColor: '#101012' }, tabLabel: { color: '#101012', fontSize: 14 },
  list: { padding: 16, gap: 12 }, song: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 }, cover: { width: 48, height: 48, borderRadius: 8 }, songTitle: { color: '#101012', fontSize: 14 }, songDetail: { color: '#65636A', fontSize: 12 },
  sample: { flex: 1, padding: 24, paddingTop: 0 }, disclosure: { color: '#65636A', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 16 }, sampleCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }, sampleName: { color: '#101012', fontSize: 20, lineHeight: 26, textAlign: 'center' }, duration: { color: '#65636A', fontSize: 16, marginTop: 12, fontVariant: ['tabular-nums'] }, preview: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#D7D4CF' }, another: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, use: { height: 56, borderRadius: 28, backgroundColor: '#101012', alignItems: 'center', justifyContent: 'center', marginTop: 8 }, error: { color: '#9D280A', fontSize: 13, lineHeight: 19, textAlign: 'center', padding: 12 },
});
