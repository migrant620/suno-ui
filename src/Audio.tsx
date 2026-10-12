import { ThemeColors, useSurfaceColors } from './Theme';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { usePlayback } from './usePlayback';
import { useSheetEscape } from './useSheetEscape';
import { AudioTrack, clockTime, exampleTracks } from './audioData';
import { C, Icon, IconButton, Label, S, Sheet } from './ui';

export function AudioConfirm({ title, description, confirm, cancel, onConfirm, onCancel, destructive = false, busy = false }: {
  title: string; description: string; confirm: string; cancel: string; onConfirm: () => void; onCancel: () => void; destructive?: boolean; busy?: boolean;
}) {
  const C = useSurfaceColors(); const T = styles(C);
  const root = React.useRef<View>(null);
  useSheetEscape(onCancel, root);
  return <Modal transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
    <View style={T.dialogOuter}><View ref={root} style={T.dialog}>
      <Label style={[S.heading, { marginBottom: 16 }]}>{title}</Label>
      <Label style={{ color: C.muted, lineHeight: 24 }}>{description}</Label>
      <View style={[T.dialogActions, destructive && { flexDirection: 'row-reverse', justifyContent: 'flex-start' }]}>
        <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={onConfirm} style={[T.confirm, destructive && { backgroundColor: 'transparent' }]}><Label style={{ color: destructive ? '#BF300B' : C.surface, fontSize: 14 }}>{confirm}</Label></Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel} style={T.cancel}><Label style={{ color: C.muted, fontSize: 14 }}>{cancel}</Label></Pressable>
      </View>
    </View></View>
  </Modal>;
}

type SongPickerProps = { onClose: () => void; songs?: AudioTrack[]; likedSongs?: AudioTrack[]; publicSongs?: AudioTrack[] } & (
  { onSelect: (track: AudioTrack) => void; playlist?: never } |
  { onSelect?: never; playlist: { onAdd: (track: AudioTrack) => void; onRemove: (track: AudioTrack) => void } }
);
export function SongPicker({ onClose, onSelect, playlist, songs = [], likedSongs = [], publicSongs = [] }: SongPickerProps) {
  const C = useSurfaceColors(); const T = styles(C);
  const [tab, setTab] = useState('My Songs');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AudioTrack | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const togglePlaylistSong = (song: AudioTrack) => {
    if (!playlist) return;
    if (added.includes(song.id)) {
      playlist.onRemove(song);
      setAdded(current => current.filter(id => id !== song.id));
    } else {
      playlist.onAdd(song);
      setAdded(current => [...current, song.id]);
    }
  };
  const { player: preview, status: previewStatus } = usePlayback(null, 250);
  const [previewError, setPreviewError] = useState('');
  const previewSong = (song: AudioTrack, fromRow = false) => {
    try {
      if (selected?.id === song.id && playlist && fromRow) { preview.pause(); setSelected(null); }
      else if (selected?.id === song.id) { if (previewStatus.playing) preview.pause(); else { if (previewStatus.didJustFinish) void preview.seekTo(0); preview.play(); } }
      else { setSelected(song); preview.replace(song.source); preview.play(); }
      setPreviewError('');
    } catch { setPreviewError('Unable to preview this audio. You can retry or select another song.'); }
  };
  const choices = tab === 'My Songs' ? (filter === 'All' ? songs : filter === 'Liked' ? likedSongs : publicSongs) : exampleTracks;
  const matches = choices.filter(song => `${song.title} ${song.styles}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <Sheet onClose={onClose} backgroundColor={C.toolbar} handleHeight={48}>
    <Label style={T.pickerTitle}>{playlist ? (added.length ? `${added.length} ${added.length === 1 ? 'Song' : 'Songs'} Added` : 'Select Songs') : 'Select a song'}</Label>
    <View style={T.search}><View pointerEvents="none" style={T.searchIcon}><Icon name="magnify" color={C.surface === '#101012' ? C.muted : '#5B5B62'} size={24} /></View><TextInput accessibilityLabel="Search songs" placeholder="Search songs" placeholderTextColor={C.surface === '#101012' ? C.muted : '#5B5B62'} value={query} onChangeText={setQuery} style={T.searchInput} />{!!query && <IconButton name="close" label="Clear song search" onPress={() => setQuery('')} style={{ width: 32, height: 40 }} />}</View>
    <View style={T.tabs}>{['My Songs', 'For you', 'Staff Picks'].map(name => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === name }} aria-selected={tab === name} key={name} onPress={() => setTab(name)} style={[T.tab, tab === name && { borderBottomColor: C.ink }]}><Label style={{ fontSize: 14, lineHeight: 17, color: tab === name ? C.ink : C.surface === '#101012' ? C.muted : '#7D7C83' }}>{name}</Label></Pressable>)}</View>
    {tab === 'My Songs' && <View style={T.filters}>{['All', 'Liked', 'Public'].map(name => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: filter === name }} aria-selected={filter === name} onPress={() => setFilter(name)} style={T.filterTarget}><View style={[T.filter, filter === name && { backgroundColor: C.ink }]}><Label style={{ fontSize: 12, lineHeight: 15, color: filter === name ? C.surface : C.ink }}>{name}</Label></View></Pressable>)}</View>}
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
      {matches.map(song => <View key={song.id} style={T.song}><Pressable accessibilityRole="button" accessibilityLabel={`Select ${song.title}`} onPress={() => previewSong(song, true)} accessibilityState={{ selected: selected?.id === song.id }} style={[T.song, { flex: 1 }]}>
        <View style={T.cover}>{song.cover ? <Image source={song.cover} style={{ width: 56, height: 56 }} /> : <Icon name="music-note" />}<Label style={T.duration}>{clockTime(song.duration || 0).replace(/^0/, '')}</Label></View>
        <View style={{ flex: 1 }}><View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>{selected?.id === song.id && previewStatus.playing && <Icon name="waveform" size={14} color={C.primary} />}<Label numberOfLines={1} style={{ fontSize: 14, flexShrink: 1, color: selected?.id === song.id ? C.primary : C.ink }}>{song.title}</Label></View><Label numberOfLines={1} style={{ fontSize: 14, color: C.muted }}>{song.styles}</Label></View>
      </Pressable>{playlist && <IconButton name={added.includes(song.id) ? 'check' : 'plus'} label={`${added.includes(song.id) ? 'Remove' : 'Add'} ${song.title} ${added.includes(song.id) ? 'from' : 'to'} Playlist`} onPress={() => togglePlaylistSong(song)} color={added.includes(song.id) ? C.primary : C.muted} size={26} style={{ width: 32, height: 48 }} />}</View>)}
      {!matches.length && <Label style={T.empty}>{query ? 'No matching songs' : filter === 'Liked' ? 'No liked songs yet' : filter === 'Public' ? 'No public songs yet' : 'Create a local example to add your first song'}</Label>}
    </ScrollView>
    {selected && <View style={T.selectionFooter}>
      <Pressable accessibilityRole="button" accessibilityLabel={previewStatus.playing ? 'Pause preview' : 'Play preview'} onPress={() => previewSong(selected)} style={T.previewButton}>
        {selected.cover ? <Image source={selected.cover} style={T.previewCover} /> : <Icon name={previewStatus.playing ? 'pause' : 'play'} />}
      </Pressable>
      <View style={{ flex: 1 }}><Label numberOfLines={1}>{selected.title}</Label><Label accessibilityLabel="Preview playback time" style={{ fontSize: 11, color: C.muted }}>{clockTime(previewStatus.currentTime)}</Label></View>
      {onSelect && <IconButton name="arrow-right" label="Continue" onPress={() => { preview.pause(); onSelect(selected); }} color={C.surface} style={T.continue} />}
      {playlist && <IconButton name={added.includes(selected.id) ? 'check' : 'plus'} label={added.includes(selected.id) ? 'Remove preview from Playlist' : 'Add preview to Playlist'} onPress={() => togglePlaylistSong(selected)} color={added.includes(selected.id) ? C.primary : C.ink} style={{ ...T.continue, backgroundColor: '#F7F4EF66' }} />}
    </View>}
    {!!(previewError || previewStatus.error) && <Label style={T.error}>{previewError || 'This audio preview could not load.'}</Label>}
    {tab !== 'My Songs' && <Label style={T.example}>Local example music · No Suno service connection</Label>}
  </Sheet>;
}

export function useTrackPlayback(track: AudioTrack | null) {
  const { player, status } = usePlayback(track?.source ?? null);
  const [error, setError] = useState('');
  const start = track?.clip?.start || 0;
  const end = track?.clip?.end ?? (status.duration || track?.duration || 0);
  const duration = Math.max(0, end - start);
  const current = Math.max(0, Math.min((status.currentTime || 0) - start, duration));
  useEffect(() => { if (track?.clip && status.playing && status.currentTime >= end) { player.pause(); void player.seekTo(end).catch(() => setError('Unable to stop at the selected endpoint.')); } }, [track?.clip, status.playing, status.currentTime, end]);
  const seek = async (seconds: number) => {
    try { await player.seekTo(start + Math.max(0, Math.min(seconds, duration))); setError(''); }
    catch { setError('Unable to seek in this audio. Try playing it again.'); }
  };
  const play = async () => {
    try {
      if (status.playing) player.pause();
      else { if (status.didJustFinish || current >= duration || status.currentTime < start) await player.seekTo(start); await player.play(); }
      setError('');
    } catch { setError('This audio could not be played. Select another file or retry.'); }
  };
  return { player, status, duration, current, error, setError, seek, play };
}

export function AudioChip({ track, playback, onRemove }: { track: AudioTrack; playback: ReturnType<typeof useTrackPlayback>; onRemove: () => void }) {
  const C = useSurfaceColors(); const T = styles(C);
  return <View style={[S.pill, { backgroundColor: C.surface === '#101012' ? '#FFFFFF0D' : '#1010120A' }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={playback.status.playing ? 'Pause audio' : 'Play audio'} onPress={() => void playback.play()} style={[S.pillContent, { paddingLeft: 4, gap: 8 }]}>
      <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>{track.cover && <Image source={track.cover} style={{ position: 'absolute', width: 32, height: 32, borderRadius: 99 }} />}<Icon name={playback.status.playing ? 'pause' : 'play'} color={C.ink} size={24} /></View>
      <Label numberOfLines={1} style={[S.pillText, { maxWidth: 140 }]}>{track.title}</Label>
    </Pressable>
    <IconButton name="close" label="Remove audio" onPress={onRemove} style={{ width: 28, height: 38 }} color={C.disabled} />
  </View>;
}

export function AudioAttachment({ track, onRemove, onExtendChange, mode, start, playback }: {
  track: AudioTrack; playback: ReturnType<typeof useTrackPlayback>; onRemove: () => void; mode: 'Cover' | 'Extend'; start: number; onExtendChange: (mode: 'Cover' | 'Extend', start: number) => void;
}) {
  const C = useSurfaceColors(); const T = styles(C);
  const { player, status, duration, current, error, setError, seek, play } = playback;
  const [menu, setMenu] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [width, setWidth] = useState(1);
  const setPoint = (x: number) => { const point = Math.max(0, Math.min(x / width, 1)) * duration; if (mode === 'Extend') onExtendChange(mode, point); void seek(point); };
  return <View style={T.attachment}>
    <View style={T.attachmentHeader}>
      {status.isLoaded ? <IconButton name={status.playing ? 'pause' : 'play'} label={status.playing ? 'Pause audio' : 'Play audio'} onPress={() => void play()} color={C.surface} style={T.play} /> : <View style={T.play}><ActivityIndicator color={C.surface} size="small" /></View>}
      {track.cover ? <Image source={track.cover} style={T.smallCover} /> : <Icon name="file-music" />}
      <View style={{ flex: 1 }}><Label numberOfLines={1} style={{ fontSize: 14 }}>{track.title}</Label><Label accessibilityLabel="Audio playback time" style={{ fontSize: 14, color: C.muted }}>{clockTime(current)} / {clockTime(duration)}</Label></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Audio mode" onPress={() => setMenu(true)} style={T.mode}><Label style={{ color: C.surface, fontSize: 13 }}>{mode}</Label><Icon name="chevron-down" color={C.surface} size={22} /></Pressable>
      <IconButton name="close" label="Remove audio" onPress={() => setRemoving(true)} color={C.muted} style={{ width: 32, height: 40 }} />
    </View>
    <View style={T.waveArea}>
      <View accessible accessibilityRole="adjustable" accessibilityLabel={mode === 'Extend' ? 'Extend start' : 'Audio position'} accessibilityValue={{ min: 0, max: duration, now: mode === 'Extend' ? start : current, text: clockTime(mode === 'Extend' ? start : current) }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={event => setPoint(((mode === 'Extend' ? start : current) + (event.nativeEvent.actionName === 'increment' ? 1 : -1)) / (duration || 1) * width)}
        {...(Platform.OS === 'web' ? { tabIndex: 0, onKeyDown: (event: any) => { if (['ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); setPoint(((mode === 'Extend' ? start : current) + (event.key === 'ArrowRight' ? 1 : -1)) / (duration || 1) * width); } } } : {})}
        onLayout={event => setWidth(event.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
        onResponderGrant={event => setPoint(event.nativeEvent.locationX)} onResponderMove={event => setPoint(event.nativeEvent.locationX)} style={T.wave}>
        {mode === 'Extend' && <View pointerEvents="none" style={[T.selection, { left: `${duration ? start / duration * 100 : 0}%` }]} />}
        {track.waveform ? <View pointerEvents="none" style={T.bars}>{track.waveform.map((value, index) => <View key={index} style={{ width: 2, height: Math.max(2, value * 58), borderRadius: 1, backgroundColor: C.ink }} />)}</View> : <Label pointerEvents="none" style={{ color: C.muted, fontSize: 12 }}>Drag to seek</Label>}
        <View pointerEvents="none" style={[T.playhead, { left: `${duration ? current / duration * 100 : 0}%` }]} />
      </View>
      {mode === 'Extend' && <Label style={T.extendTime}>Extend from {clockTime(start)}</Label>}
    </View>
    {!!(error || status.error) && <Pressable accessibilityRole="button" accessibilityLabel="Retry audio" onPress={() => { player.replace(track.source); setError(''); }}><Label style={T.error}>{error || 'Audio could not load. Tap to retry.'}</Label></Pressable>}
    {menu && <Sheet onClose={() => setMenu(false)} compact backgroundColor={C.toolbar}>{(['Cover', 'Extend'] as const).map(value => <Pressable accessibilityRole="button" key={value} onPress={() => { onExtendChange(value, start); setMenu(false); }} style={T.modeRow}><Icon name={value === 'Cover' ? 'autorenew' : 'arrow-right'} /><Label>{value}</Label></Pressable>)}</Sheet>}
    {removing && <AudioConfirm title="Remove Audio?" description="Are you sure you want to remove and discard your audio?" confirm="Discard" cancel="Keep audio" onConfirm={onRemove} onCancel={() => setRemoving(false)} />}
  </View>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
  selectionFooter: { margin: 16, marginBottom: 8, borderRadius: 99, backgroundColor: C.toolbar, padding: 12, gap: 8, flexDirection: 'row', alignItems: 'center', boxShadow: C.surface === '#101012' ? '0px -12px 24px rgba(16,16,18,0.75)' : '0px -12px 24px rgba(247,244,239,0.75)' },
  previewButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  previewCover: { width: 48, height: 48, borderRadius: 99 },
  continue: { width: 48, height: 48, backgroundColor: C.ink, borderRadius: 99 },
  pickerTitle: { fontFamily: 'RobotoMedium', fontSize: 16, lineHeight: 20, letterSpacing: 0.15, textAlign: 'center', marginBottom: 14 },  // b43: title 48..68, search at 82
  search: { marginHorizontal: 16, borderRadius: 8, height: 46, backgroundColor: C.surface === '#101012' ? C.control : '#1010120A', flexDirection: 'row', alignItems: 'center' },  // b43: the field spans the whole box; icon sits inside its left padding
  searchIcon: { position: 'absolute', left: 8, top: 11 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'RobotoRegular', color: C.ink, height: 46, padding: 0, paddingLeft: 36, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.surface === '#101012' ? '#FFFFFF26' : '#7D7C83' },
  tab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 4, gap: 8 },
  filterTarget: { flex: 1, height: 48, justifyContent: 'center' },
  filter: { height: 32, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  song: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72 },
  cover: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  duration: { position: 'absolute', right: 2, bottom: 2, borderRadius: 8, paddingHorizontal: 4, fontSize: 12, lineHeight: 20, color: C.white, backgroundColor: '#101012AA' },
  empty: { textAlign: 'center', color: C.muted, marginTop: 32 },
  example: { fontSize: 11, color: C.muted, paddingHorizontal: 16, paddingVertical: 4 },
  attachment: { borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 16, gap: 16 },
  attachmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  play: { width: 40, height: 40, borderRadius: 99, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  smallCover: { width: 32, height: 32, borderRadius: 5 },
  mode: { flexDirection: 'row', alignItems: 'center', borderRadius: 99, backgroundColor: C.ink, height: 40, paddingHorizontal: 12 },
  extendTime: { position: 'absolute', bottom: -14, right: 0, fontSize: 10, lineHeight: 12, color: C.muted },
  waveArea: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 },
  wave: { height: 80, borderWidth: 1, borderColor: C.border, borderRadius: 7, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  bars: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  selection: { position: 'absolute', top: 0, bottom: 0, right: 0, backgroundColor: '#FF299766', borderLeftWidth: 10, borderColor: '#FF2997' },
  playhead: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: C.ink },
  modeRow: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  dialogOuter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 36, backgroundColor: '#00000055' },
  dialog: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 28, backgroundColor: C.surface },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 24 },
  confirm: { paddingHorizontal: 20, height: 48, backgroundColor: C.ink, borderRadius: 99, justifyContent: 'center' },
  cancel: { paddingHorizontal: 12, minHeight: 48, justifyContent: 'center' },
  error: { fontSize: 12, color: C.primary },
});
