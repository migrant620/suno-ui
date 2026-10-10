import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { creatorById, ExampleCreator } from './creatorData';
import { AudioTrack } from './audioData';
import { useLibrary } from './useLibrary';
import { recentKey, useSearchHistory } from './useSearchHistory';
import { ThemeColors, useSurfaceColors } from './Theme';
import { Icon, IconButton, Label } from './ui';
export function SearchRecent({ history, library, onCreator, onSong, onPlaylist }: {
    history: ReturnType<typeof useSearchHistory>;
    library: ReturnType<typeof useLibrary>;
    onCreator: (creator: ExampleCreator) => void;
    onSong: (song: AudioTrack) => void;
    onPlaylist: (id: string) => void;
}) {
    const colors = useSurfaceColors();
    const S = styles(colors);
    const rows = history.entries.map(item => {
        if (item.kind === 'creator') {
            const creator = creatorById(item.id);
            return creator && { item, title: creator.name, caption: `Creator · @${creator.handle} · Local example`, image: creator.avatar, open: () => onCreator(creator) };
        }
        if (item.kind === 'song') {
            const song = library.tracks.find(track => track.id === item.id);
            return song && { item, title: song.title, caption: `Song · ${song.artist || 'Local example'}`, image: song.cover, open: () => onSong(song) };
        }
        const playlist = library.data.playlists.find(list => list.id === item.id);
        return playlist && { item, title: playlist.name, caption: `Playlist · ${playlist.songIds.length} songs`, image: playlist.coverUri ? { uri: playlist.coverUri } : require('../assets/playlist-default.png'), open: () => onPlaylist(playlist.id) };
    });
    const missing = history.entries.filter((_, index) => !rows[index]);
    const missingKey = missing.map(recentKey).join('|');
    useEffect(() => { if (history.ready && library.ready && !history.busy && !history.error && missing.length)
        history.remove(missing); }, [missingKey, history.ready, library.ready, history.busy, history.error]);
    return <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={[S.content, !rows.some(Boolean) && !history.error && { flexGrow: 1 }]}>
    {!!history.error && <View style={S.error}><Label accessibilityRole="alert" style={S.message}>{history.error}</Label><View style={S.actions}><Pressable accessibilityRole="button" accessibilityLabel="Retry search history" disabled={history.busy} onPress={history.retry} style={S.action}><Label style={S.clear}>Retry</Label></Pressable>{!history.ready && <Pressable accessibilityRole="button" accessibilityLabel="Clear unreadable search history" onPress={history.clear} style={S.action}><Label style={S.clear}>Clear local history</Label></Pressable>}</View></View>}
    {!history.ready && !history.error ? <ActivityIndicator accessibilityLabel="Loading search history" color={colors.primary}/> : rows.some(Boolean) ? <>
      <View style={S.header}><Label style={S.heading}>Recent</Label><Pressable accessibilityRole="button" accessibilityLabel="Clear search history" onPress={history.clear} style={S.clearButton}><Label style={S.clear}>Clear</Label></Pressable></View>
      {rows.map(row => row && <View key={recentKey(row.item)} style={S.row}><Pressable accessibilityRole="button" accessibilityLabel={`Open recent ${row.item.kind} ${row.title}`} onPress={row.open} style={S.open}>{row.image ? <Image source={row.image} style={[S.image, row.item.kind !== 'creator' && { borderRadius: 12 }]}/> : <View style={S.image}><Icon name="music-note"/></View>}<View style={S.identity}><Label numberOfLines={1} style={S.title}>{row.title}</Label><Label numberOfLines={1} style={S.caption}>{row.caption}</Label></View></Pressable><IconButton name="close" label={`Remove recent ${row.item.kind} ${row.title}`} size={24} color={colors.muted} onPress={() => history.remove([row.item])} style={S.remove}/></View>)}
    </> : !history.error ? <View style={S.empty}><Icon name="magnify" size={28}/><Label style={S.message}>Search for creators, songs or playlists</Label></View> : null}
  </ScrollView>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    content: { paddingBottom: 20 }, header: { height: 64, paddingTop: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heading: { fontSize: 18, lineHeight: 24, fontFamily: 'RobotoMedium' }, clearButton: { height: 48, width: 58, marginRight: -8, alignItems: 'center', justifyContent: 'center' }, clear: { fontSize: 14, lineHeight: 18, color: '#FD429C' }, row: { height: 72, marginTop: 4, paddingLeft: 16, paddingRight: 4, flexDirection: 'row', alignItems: 'center' }, open: { flex: 1, minWidth: 0, height: 72, flexDirection: 'row', alignItems: 'center', gap: 12 }, image: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }, identity: { flex: 1, minWidth: 0, gap: 2 }, title: { fontSize: 14, lineHeight: 18 }, caption: { fontSize: 12, lineHeight: 16, color: C.muted }, remove: { width: 48, height: 48 }, empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 16 }, message: { fontSize: 14, lineHeight: 22, color: C.secondary, textAlign: 'center' }, error: { padding: 16, gap: 8 }, actions: { flexDirection: 'row', justifyContent: 'center', gap: 16 }, action: { minHeight: 44, justifyContent: 'center' },
});
