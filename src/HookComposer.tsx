import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AudioTrack } from './audioData';
import { HookVideo } from './HookVideo';
import { exampleHooks } from './hookData';
import { useHookPreferences } from './useHookPreferences';
import { useLibrary } from './useLibrary';
import { HookVideoControl } from './hookVideoTypes';
import { IconButton, Label, Sheet } from './ui';
export function HookComposer({ library, preferences, onClose, onCreated }: { library: ReturnType<typeof useLibrary>; preferences: ReturnType<typeof useHookPreferences>; onClose: () => void; onCreated: (id: string) => void }) {
  const [tab, setTab] = useState('Recents'); const [selected, setSelected] = useState<AudioTrack | null>(null); const [caption, setCaption] = useState(''); const [busy, setBusy] = useState(false); const [playing, setPlaying] = useState(false); const [mediaError, setMediaError] = useState('');
  const video = useRef<HookVideoControl>(null); const alive = useRef(true);
  React.useEffect(() => () => { alive.current = false; }, []);
  const tracks = tab === 'Recents' ? library.songs : tab === 'Public' ? library.songs.filter(track => library.data.songs?.find(song => song.id === track.id)?.isPublic) : library.tracks.filter(track => library.data.likedIds?.includes(track.id));
  const template = selected && exampleHooks.find(clip => clip.track.id === (selected.templateId || selected.id));
  const save = async () => {
    if (!selected || !template || busy) return;
    setBusy(true); video.current?.pause();
    const id = `local-hook-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const ok = await preferences.create({ id, templateId: template.track.id, songId: selected.id, title: selected.title, caption: caption.trim() || 'An original local example Hook.', createdAt: Date.now() });
    if (alive.current) { setBusy(false); if (ok) onCreated(id); }
  };
  return <Sheet onClose={onClose} backgroundColor="#1C1C1F" handleColor="#C2C2C1" keyboardAvoiding>
    <Label style={S.heading}>Create a Hook</Label><Label style={S.subtitle}>{selected ? 'Review your local example video' : 'Select a song to get started'}</Label>
    {!selected ? <><View style={S.tabs}>{['Recents', 'Public', 'Liked'].map(value => <Pressable accessibilityRole="tab" accessibilityLabel={value} accessibilityState={{ selected: tab === value }} key={value} onPress={() => setTab(value)} style={[S.tab, tab === value && { borderBottomColor: '#FFFFFF' }]}><Label style={{ color: tab === value ? '#FFFFFF' : '#99999F', fontSize: 16 }}>{value}</Label></Pressable>)}</View><ScrollView contentContainerStyle={{ paddingBottom: 24 }}>{tracks.map(track => <Pressable accessibilityRole="button" accessibilityLabel={`Use ${track.title} for a Hook`} key={track.id} onPress={() => { setSelected(track); setCaption(''); }} style={S.row}><Image source={track.cover} style={S.cover} /><Label style={{ color: '#FFFFFF', flex: 1 }}>{track.title}</Label></Pressable>)}{!tracks.length && <Label style={S.empty}>No {tab.toLowerCase()} songs on this device.</Label>}</ScrollView></> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12 }}>{template && <View style={S.preview}><HookVideo ref={video} source={template.video} active={false} onState={state => { setPlaying(state.playing); setMediaError(state.error); }} /><IconButton name={playing ? 'pause' : 'play'} label={playing ? 'Pause new Hook preview' : 'Play new Hook preview'} color="#FFFFFF" onPress={() => playing ? video.current?.pause() : video.current?.play()} style={S.play} /></View>}
      <Label style={S.disclosure}>This local Hook uses the original example video and music. It is saved on this device and is not posted to Suno.</Label>
      <TextInput accessibilityLabel="Hook caption" value={caption} onChangeText={setCaption} maxLength={500} multiline placeholder="Add a caption…" placeholderTextColor="#99999F" style={S.caption} />
      {!!(preferences.error || mediaError) && <Label accessibilityRole="alert" style={{ color: '#FF6CAA' }}>{preferences.error || mediaError}</Label>}
      <Pressable accessibilityRole="button" accessibilityLabel="Save local Hook" disabled={busy || !preferences.ready || !template} onPress={() => void save()} style={[S.save, (busy || !preferences.ready || !template) && { opacity: .4 }]}><Label style={{ color: '#101012', fontSize: 16 }}>{busy ? 'Saving…' : 'Save local Hook'}</Label></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose another Hook song" disabled={busy} onPress={() => { video.current?.pause(); setSelected(null); }} style={S.another}><Label style={{ color: '#FFFFFF' }}>Choose another song</Label></Pressable>
    </ScrollView>}
  </Sheet>;
}
const S = StyleSheet.create({ heading: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, textAlign: 'center' }, subtitle: { color: '#99999F', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 4, marginBottom: 12 }, tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#77777E', marginTop: 0 }, tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' }, row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }, cover: { width: 48, height: 48, borderRadius: 8 }, empty: { color: '#99999F', fontSize: 14, padding: 32, textAlign: 'center' }, preview: { width: 190, height: 270, alignSelf: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: '#000000' }, play: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#00000080', borderRadius: 99 }, disclosure: { color: '#99999F', fontSize: 12, lineHeight: 18, textAlign: 'center' }, caption: { minHeight: 72, backgroundColor: '#252529', borderRadius: 12, color: '#FFFFFF', fontFamily: 'RobotoRegular', fontSize: 16, padding: 12, textAlignVertical: 'top' }, save: { height: 48, borderRadius: 99, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, another: { minHeight: 44, alignItems: 'center', justifyContent: 'center' } });
