import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ThemeColors, useSurfaceColors } from './Theme';
import { AudioTrack } from './audioData';
import { useLibrary } from './useLibrary';
import { useLibraryPlayback } from './useLibraryPlayback';
import { SongRow } from './SongRow';
import { ChevronLeft, Search as SearchIcon, X } from 'lucide-react-native';

export function LibrarySearch({ library, player, onSongOptions, onBack }: {
  library: ReturnType<typeof useLibrary>; player: ReturnType<typeof useLibraryPlayback>;
  onSongOptions: (song: AudioTrack) => void; onBack: () => void;
}) {
  const C = useSurfaceColors(); const S = styles(C); const input = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const search = query.trim().toLowerCase();
  const tracks = search ? library.tracks.filter(track =>
    (library.songs.some(song => song.id === track.id) || library.data.likedIds?.includes(track.id) || library.data.playlists.some(item => item.songIds.includes(track.id))) &&
    `${track.title} ${track.styles} ${track.artist}`.toLowerCase().includes(search)) : [];
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing && !document.querySelector('[role="dialog"],[aria-modal="true"]')) { event.preventDefault(); onBack(); }
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [onBack]);
  return <View style={S.page}>
    <View testID="library-search-header" style={S.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to Library" testID="library-search-back" onPress={onBack} style={({ pressed }) => [S.backTarget, pressed && { opacity: 0.65 }]}><View style={S.backCircle}><ChevronLeft size={28} strokeWidth={2} color={C.ink} style={{ marginLeft: -1 }} /></View></Pressable>
      <View testID="library-search-field" style={S.search}>
        <View style={S.searchIcon}><SearchIcon color={query ? C.ink : C.secondary} size={22} strokeWidth={2} /></View>
        <TextInput ref={input} autoFocus accessibilityLabel="Search your library" placeholder="Search for songs in your library" autoCapitalize="none" value={query} onChangeText={setQuery} onSubmitEditing={Keyboard.dismiss} submitBehavior="submit" returnKeyType="search" style={S.input} selectionColor={C.primary} placeholderTextColor={C.secondary} />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => { setQuery(''); if (Platform.OS === 'web') input.current?.focus(); }} style={({ pressed }) => [S.clear, pressed && { opacity: 0.65 }]}><X color={C.muted} size={24} strokeWidth={2} /></Pressable>}
      </View>
    </View>
    {!library.ready ? <ActivityIndicator accessibilityLabel="Loading your library" color={C.ink} /> : <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={S.results}>
      {tracks.map(track => <SongRow key={track.id} track={track} playing={player.track?.id === track.id && player.status.playing} onPress={() => { Keyboard.dismiss(); void player.playTrack(track, tracks, 'library-search'); }} onOptions={() => { Keyboard.dismiss(); onSongOptions(track); }} />)}
    </ScrollView>}
  </View>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.surface },
  header: { height: 82.5, paddingTop: 10.5, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  backTarget: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  backCircle: { width: 40, height: 40, borderRadius: 99, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, height: 48, paddingHorizontal: 8, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.field },
  input: { flex: 1, minWidth: 0, height: 48, padding: 0, fontFamily: 'RobotoRegular', fontSize: 16, lineHeight: 20, color: C.ink, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  searchIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, results: { paddingBottom: 24 },
});
