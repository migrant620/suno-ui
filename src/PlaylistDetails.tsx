import { ThemeColors, LightSurface, useSurfaceColors } from './Theme';
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AudioConfirm } from './Audio';
import { AudioTrack } from './audioData';
import { Playlist } from './libraryState';
import { PlaylistShare } from './PlaylistShare';
import { playlistSorts, PlaylistSort, SortDirection, sortedPlaylistTracks } from './playlistView';
import { SongRow } from './SongRow';
import { useLibraryPlayback } from './useLibraryPlayback';
import { usePlaylistDownload } from './usePlaylistDownload';
import { C, Icon, IconButton, Label } from './ui';

export function PlaylistDetails({ item, liked, shared = false, tracks, player, onBack, onCreate, onAdd, onMenu, onSongOptions, backLabel = 'Back to Library', curated }: {
  curated?: { saved: boolean; busy: boolean; error: string; onToggle: () => void };
  backLabel?: string; item: Playlist; liked: boolean; shared?: boolean; tracks: AudioTrack[]; player: ReturnType<typeof useLibraryPlayback>;
  onBack: () => void; onCreate: () => void; onAdd: () => void; onMenu: () => void; onSongOptions: (track: AudioTrack) => void;
}) {
  const C = useSurfaceColors(); const D = styles(C);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<PlaylistSort>('Default');
  const [direction, setDirection] = useState<SortDirection>('Descending');
  const [sharing, setSharing] = useState(false);
  const [removingDownload, setRemovingDownload] = useState(false);
  const download = usePlaylistDownload(item.id, tracks);
  const populated = !!tracks.length;
  const sorted = sortedPlaylistTracks(tracks, sort, direction);
  const matches = sorted.filter(track => `${track.title} ${track.artist || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const cover = item.coverUri ? { uri: item.coverUri } : liked ? require('../assets/liked-texture.png') : require('../assets/playlist-default.png');
  const closeSearch = () => { Keyboard.dismiss(); setSearching(false); setQuery(''); };
  const root = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !curated) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing || document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (sortOpen) setSortOpen(false); else if (searching) closeSearch(); else onBack();
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [curated, sortOpen, searching, onBack]);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sortOpen) setSortOpen(false);
      else if (searching) closeSearch();
      else onBack();
      return true;
    });
    return () => listener.remove();
  }, [sortOpen, searching, onBack]);
  const songRows = (songs: AudioTrack[]) => songs.map(track => <SongRow key={track.id} track={track} playing={player.track?.id === track.id && player.status.playing} onPress={() => void player.playTrack(track, sorted, item.id)} onOptions={() => onSongOptions(track)} />);
  const addButton = (wide = false) => <Pressable accessibilityRole="button" onPress={() => { Keyboard.dismiss(); onAdd(); }} style={[D.actionPill, wide && { width: 244 }]}><Icon name="plus" size={24} /><Label>Add Songs</Label></Pressable>;
  const createButton = (title: string) => <Pressable accessibilityRole="button" onPress={() => { Keyboard.dismiss(); onCreate(); }} style={[D.actionPill, { width: 244 }]}><Icon name="music-note-plus" size={24} /><Label>{title}</Label></Pressable>;
  return <View ref={root} style={D.page}>
    {!searching && <View pointerEvents="none" style={[D.tint, { opacity: C.surface === '#101012' ? 0.16 : 1 }]}><Image source={liked || item.coverUri ? cover : require('../assets/playlist-tint.png')} blurRadius={liked || item.coverUri ? 60 : 0} style={{ width: '100%', height: '100%', opacity: liked || item.coverUri ? 0.25 : 1 }} />{(liked || item.coverUri) && <LinearGradient colors={[C.surface + '00', C.surface]} locations={[0, 1]} style={StyleSheet.absoluteFill} />}</View>}
    {searching ? <>
      <View style={D.searchHeader}><View style={D.searchBox}><Icon name="magnify" size={24} color={C.muted} /><TextInput accessibilityLabel="Search playlist songs" placeholder="Search" autoFocus value={query} onChangeText={setQuery} placeholderTextColor={C.muted} selectionColor={C.primary} style={D.searchInput} />{!!query && <IconButton name="close" label="Clear song search" onPress={() => setQuery('')} style={{ width: 32, height: 40 }} />}</View><IconButton name="close" label="Close playlist song search" onPress={closeSearch} style={D.headerButton} /></View>
      {matches.length ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}>{songRows(matches)}</ScrollView> : <View style={D.noResults}><Label style={D.noResultsTitle}>No Results for “{query}”</Label><Label style={D.noResultsHint}>Try another search, browse your library, or create something new</Label>{!shared && addButton(true)}{createButton('Create New Song')}</View>}
    </> : <>
      <View style={D.header}><IconButton name="chevron-left" label={backLabel} onPress={onBack} style={D.headerButton} /><View style={{ flex: 1 }} />{populated && <><IconButton name="magnify" label="Search Playlist Songs" onPress={() => setSearching(true)} style={D.headerButton} /><IconButton name="sort-variant" label="Sort Playlist Songs" onPress={() => setSortOpen(true)} style={D.headerButton} /></>}{!liked && !shared && <IconButton name="dots-vertical" label="Playlist Actions" onPress={onMenu} style={D.headerButton} />}</View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={D.cover}><Image source={cover} style={{ width: 210, height: 210 }} />{liked && <View style={StyleSheet.absoluteFill}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Icon name="thumb-up" size={67} color="#B8DEEF" /></View></View>}</View>
        <View style={D.info}><Label style={D.category}>PLAYLIST</Label><Label style={[D.title, curated && { fontFamily: 'RobotoRegular' }]}>{item.name}</Label>{curated && !!item.description && <Label style={{ fontSize: 12, lineHeight: 16, marginTop: 4 }}>{item.description}</Label>}<View style={D.metadata}><Image source={require('../assets/demo-avatar.png')} style={D.avatar} /><Label style={D.metaText}>{curated ? 'M620' : 'Demo listener'} · {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</Label><View style={{ flex: 1 }} /><Icon name={item.isPublic ? 'earth' : 'lock'} size={16} color={C.muted} /><Label style={D.metaText}>{item.isPublic ? 'Public' : 'Private'}</Label></View>{!curated && !!item.description && <Label style={{ marginTop: 8 }}>{item.description}</Label>}</View>
        {populated ? <>
          <View style={D.playActions}><Pressable accessibilityRole="button" accessibilityLabel="Play Playlist" onPress={() => void player.start(sorted[0], sorted, item.id)} style={D.play}><Icon name="play" size={24} color={C.surface} /><Label style={{ color: C.surface }}>Play</Label></Pressable><IconButton name="share-variant-outline" label="Share Playlist" onPress={() => setSharing(true)} style={D.round} />{curated && <IconButton name={curated.saved ? 'check' : 'plus'} label={curated.saved ? 'Remove collection from Library' : 'Add collection to Library'} disabled={curated.busy} onPress={curated.onToggle} style={D.round} />}<IconButton name={download.status === 'downloaded' ? 'download-circle' : download.status === 'downloading' ? 'close' : 'arrow-down'} label={download.status === 'downloaded' ? 'Remove playlist from offline' : download.status === 'downloading' ? 'Cancel playlist download' : 'Download Playlist'} onPress={() => download.status === 'downloaded' ? setRemovingDownload(true) : download.status === 'downloading' ? download.cancel() : void download.download()} style={D.round} /></View>
          {!!curated?.error && <Label accessibilityRole="alert" style={D.error}>{curated.error}</Label>}{!!download.error && <Label accessibilityLiveRegion="polite" style={D.error}>{download.error}</Label>}
          {download.status === 'downloading' && <Label accessibilityLiveRegion="polite" style={D.downloadNotice}>Downloading for offline use…</Label>}
          <View style={{ marginTop: 20 }}>{songRows(sorted)}</View>
        </> : <View style={{ gap: 16, marginTop: 32 }}>{!liked && !shared && addButton(true)}{createButton('Create Songs')}</View>}
        {!!item.createdAt && !liked && <Label style={D.created}>Created {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Label>}
        {populated && !liked && !shared && <View style={{ marginTop: 12 }}>{addButton()}</View>}
        {shared && <Label style={D.sharedNote}>{curated ? 'Local example collection · Original recordings' : 'Shared local example playlist · No Suno service connection'}</Label>}
      </ScrollView>
    </>}
    {sortOpen && <View style={StyleSheet.absoluteFill}><Pressable accessibilityRole="button" accessibilityLabel="Close song sort" onPress={() => setSortOpen(false)} style={StyleSheet.absoluteFill} /><View style={D.sortMenu}>{playlistSorts.map(value => <Pressable accessibilityRole="button" key={value} onPress={() => { setSort(value); if (value === 'Default') setSortOpen(false); }} style={D.sortRow}><View style={{ width: 24 }}>{sort === value && <Icon name="check" size={20} />}</View><Label style={{ fontSize: 16 }}>{value}</Label></Pressable>)}{sort !== 'Default' && <><View style={D.separator} />{(['Ascending', 'Descending'] as const).map(value => <Pressable key={value} accessibilityRole="button" onPress={() => { setDirection(value); setSortOpen(false); }} style={D.sortRow}><View style={{ width: 24 }}>{direction === value && <Icon name="check" size={20} />}</View><Label>{value}</Label></Pressable>)}</>}</View></View>}
    {sharing && <LightSurface><PlaylistShare tracks={tracks} playlist={item} onClose={() => setSharing(false)} /></LightSurface>}
    {removingDownload && <AudioConfirm title="Remove from offline?" description="This playlist will no longer be available for offline use." confirm="Remove" cancel="Cancel" onCancel={() => setRemovingDownload(false)} onConfirm={() => { setRemovingDownload(false); void download.remove(); }} />}
  </View>;
}

const styles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.surface },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  header: { height: 76, flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 16 },
  headerButton: { width: 40, height: 40, marginTop: -4, backgroundColor: C.surface === '#101012' ? C.control : '#10101206', borderRadius: 99 },
  cover: { width: 210, height: 210, borderRadius: 20, overflow: 'hidden', alignSelf: 'center', marginTop: 4 },
  info: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 3 },
  category: { fontSize: 14, color: C.muted },
  title: { fontFamily: 'RobotoBold', fontSize: 28, lineHeight: 34 },
  metadata: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatar: { width: 20, height: 20, borderRadius: 99 },
  metaText: { color: C.muted, fontSize: 14, flexShrink: 1 },
  playActions: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 16, marginTop: 4 },
  play: { flex: 1, height: 40, borderRadius: 99, backgroundColor: C.ink, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  round: { width: 40, height: 40, borderRadius: 99, backgroundColor: C.surface === '#101012' ? C.control : '#10101206' },
  actionPill: { width: 142, height: 40, borderRadius: 99, backgroundColor: C.surface === '#101012' ? C.control : '#10101206', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, alignSelf: 'center' },
  created: { paddingVertical: 14, fontSize: 14, lineHeight: 21, textAlign: 'center', color: C.muted },
  searchHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, height: 64, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  searchBox: { flex: 1, backgroundColor: C.surface === '#101012' ? C.control : '#10101206', height: 48, borderRadius: 8, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, height: 48, fontFamily: 'RobotoRegular', fontSize: 16, color: C.ink, padding: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  noResults: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingBottom: 40 },
  noResultsTitle: { fontSize: 16, fontFamily: 'RobotoMedium', textAlign: 'center' },
  noResultsHint: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: -12, paddingHorizontal: 16 },
  sortMenu: { position: 'absolute', right: 72, top: 56, width: 150, borderRadius: 20, backgroundColor: C.toolbar, paddingVertical: 12, boxShadow: '0px 3px 8px #00000022' },
  sortRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  separator: { height: 1, backgroundColor: C.border, marginHorizontal: 12, marginVertical: 6 },
  error: { marginHorizontal: 16, marginTop: 8, color: C.primary, fontSize: 12 },
  downloadNotice: { marginHorizontal: 16, marginTop: 8, color: C.muted, fontSize: 12 },
  sharedNote: { margin: 16, color: C.muted, fontSize: 12, textAlign: 'center' },
});
