import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { exampleTracks } from './audioData';
import { C, Icon, Label, Sheet } from './ui';

export function ExampleCreation({ title, ready, voiceName, mediaName, onClose, onCreate }: { title: string; ready: boolean; voiceName?: string; mediaName?: string; onClose: () => void; onCreate: (template: string, isActive: () => boolean) => Promise<void> }) {
  const [selected, setSelected] = useState(exampleTracks[0].id);
  const { height } = useWindowDimensions();
  const [contentHeight, setContentHeight] = useState(0);
  const maximumHeight = Math.max(120, height - 128);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(true);
  const pending = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const close = () => { alive.current = false; onClose(); };
  const save = async () => {
    if (!ready || pending.current || !alive.current) return;
    pending.current = true; setSaving(true); setError('');
    try { await onCreate(selected, () => alive.current); }
    catch { if (alive.current) setError('Your example song could not be saved. Your details are still here. Try again.'); }
    finally { pending.current = false; if (alive.current) setSaving(false); }
  };
  return <Sheet onClose={close} compact>
    <ScrollView onContentSizeChange={(_, value) => setContentHeight(value)} style={{ flexGrow: 0, flexShrink: 0, height: Math.min(contentHeight || maximumHeight, maximumHeight) }} contentContainerStyle={S.content}><Label style={S.title}>Create a local example</Label>
      <Label style={S.description}>Save your song details with one of these original sample recordings. Your lyrics and prompt do not change the prerecorded audio. No Suno generation or credits are used.</Label>
      {!!voiceName && <Label style={S.description}>{voiceName} will be linked to this local example. The sample recording keeps its original sound.</Label>}
      {!!mediaName && <Label style={S.description}>{mediaName} will be saved with your inputs on this device. Remix restores these inputs; the sample recording keeps its original sound and cover.</Label>}
      <Label style={S.songTitle}>{title || 'Untitled'}</Label>
      {exampleTracks.map(track => <Pressable key={track.id} accessibilityRole="radio" accessibilityLabel={`Example audio: ${track.title}`} accessibilityState={{ checked: selected === track.id, disabled: saving }} disabled={saving} aria-checked={selected === track.id} onPress={() => setSelected(track.id)} style={[S.option, selected === track.id && { borderColor: C.ink }]}><Image source={track.cover!} style={S.cover} /><View style={{ flex: 1 }}><Label>{track.title}</Label><Label style={S.caption}>{track.styles}</Label></View><Icon name={selected === track.id ? 'radiobox-marked' : 'radiobox-blank'} /></Pressable>)}
      {!!error && <Label accessibilityRole="alert" style={{ fontSize: 14, lineHeight: 20, color: '#B52B19' }}>{error}</Label>}
      {saving && <Label accessibilityLiveRegion="polite" style={S.description}>Saving your example…</Label>}
      <Pressable accessibilityRole="button" accessibilityLabel={error ? 'Retry saving example song' : 'Save example song'} disabled={!ready || saving} accessibilityState={{ disabled: !ready || saving }} onPress={() => void save()} style={S.create}>{saving ? <ActivityIndicator color={C.white} /> : <Icon name="music-note-plus" color={C.white} />}<Label style={S.createText}>{error ? 'Try again' : saving ? 'Saving…' : 'Save to Library'}</Label></Pressable>
      {saving && <Pressable accessibilityRole="button" accessibilityLabel="Cancel saving example song" onPress={close} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Label>Cancel</Label></Pressable>}
    </ScrollView>
  </Sheet>;
}
const S = StyleSheet.create({ content: { padding: 20, gap: 16 }, title: { fontSize: 24, lineHeight: 30, fontFamily: 'RobotoMedium' }, description: { fontSize: 14, lineHeight: 21, color: C.muted }, songTitle: { fontSize: 18, lineHeight: 24 }, option: { borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, cover: { width: 48, height: 48, borderRadius: 8 }, caption: { fontSize: 12, lineHeight: 17, color: C.muted }, create: { height: 56, borderRadius: 99, backgroundColor: C.ink, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 }, createText: { color: C.white, fontFamily: 'RobotoMedium', fontSize: 18 } });
