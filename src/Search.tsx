import { ThemeColors, ThemedSurface, useSurfaceColors } from './Theme';
import React, { useRef } from 'react';
import { ActivityIndicator, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AudioTrack, exampleTracks } from './audioData';
import { ExampleCreator, exampleCreators } from './creatorData';
import { useLibrary } from './useLibrary';
import { useLibraryPlayback } from './useLibraryPlayback';
import { SongRow } from './SongRow';
import { SearchDiscover } from './SearchDiscover';
import { SearchRecent } from './SearchRecent';
import { useSearchHistory } from './useSearchHistory';
import { C, Icon, IconButton, Label } from './ui';
export type SearchPhase = 'discover' | 'typing' | 'results';
const filters = ['All', 'Songs', 'Creators', 'Playlists', 'Hooks'];
function SearchContent({ history, library, player, query, setQuery, filter, setFilter, phase, setPhase, scrollOffsets, onSongOptions, onProfile, onPlaylist, onInspiration, onNotifications, onOpenPlayer, commentCounts }: {
    history: ReturnType<typeof useSearchHistory>;
    library: ReturnType<typeof useLibrary>;
    player: ReturnType<typeof useLibraryPlayback>;
    query: string;
    setQuery: (query: string) => void;
    filter: string;
    setFilter: (filter: string) => void;
    phase: SearchPhase;
    setPhase: (phase: SearchPhase) => void;
    scrollOffsets: React.MutableRefObject<Record<string, number>>;
    onSongOptions: (song: AudioTrack) => void;
    onProfile: (creator?: ExampleCreator) => void;
    onPlaylist: (id: string) => void;
    commentCounts: Record<string, number>;
    onInspiration: (kind: 'photo' | 'record') => void;
    onNotifications: () => void;
    onOpenPlayer: () => void;
}) {
    const C = useSurfaceColors();
    const S = styles(C);
    const input = useRef<TextInput>(null);
    const scroll = useRef<ScrollView>(null);
    const search = query.trim().toLowerCase();
    const catalog = library.tracks;
    const tracks = catalog.filter(track => `${track.title} ${track.styles} ${track.artist}`.toLowerCase().includes(search));
    const playlists = library.data.playlists.filter(item => item.name.toLowerCase().includes(search));
    const creators = exampleCreators.filter(creator => [creator.name, creator.handle, creator.bio || '', 'Local example artist', ...creator.tracks.map(track => track.styles)].join(' ').toLowerCase().includes(search));
    const artist = creators.length > 0;
    const hooks = tracks.filter(track => exampleTracks.some(example => example.id === track.id));
    const submitted = phase === 'results';
    const showSongs = !submitted || filter === 'All' || filter === 'Songs';
    const showPlaylists = !submitted || filter === 'All' || filter === 'Playlists';
    const showArtist = !submitted || filter === 'All' || filter === 'Creators';
    const showHooks = submitted && filter === 'Hooks';
    const any = (showSongs && !!tracks.length) || (showPlaylists && !!playlists.length) || (showArtist && artist) || (showHooks && !!hooks.length);
    const scrollKey = `${phase}:${filter}:${search}`;
    const change = (value: string) => { setQuery(value); setPhase('typing'); setFilter('All'); };
    const submit = () => { if (search) {
        setPhase('results');
        setFilter('All');
    } };
    const chooseFilter = (value: string) => { setFilter(value); setPhase('results'); };
    const close = () => { Keyboard.dismiss(); input.current?.blur(); setQuery(''); setFilter('All'); setPhase('discover'); };
    const openCreator = (target: ExampleCreator) => { history.visit({ kind: 'creator', id: target.id }); Keyboard.dismiss(); onProfile(target); };
    const openPlaylist = (id: string) => { history.visit({ kind: 'playlist', id }); Keyboard.dismiss(); onPlaylist(id); };
    const play = (track: AudioTrack, list = tracks) => { history.visit({ kind: 'song', id: track.id }); Keyboard.dismiss(); void player.playTrack(track, list, 'search'); };
    const header = (title: string, category: string) => <View style={S.sectionHeader}><Label style={S.sectionTitle}>{title}</Label><Pressable accessibilityRole="button" accessibilityLabel={`See all ${category.toLowerCase()}`} onPress={() => chooseFilter(category)} style={S.seeAll}><Label style={S.secondary}>See All</Label></Pressable></View>;
    const creator = (featured = false, target = creators[0]) => <Pressable key={target.id} accessibilityRole="button" accessibilityLabel={featured ? `Open featured ${target.name} creator` : `View ${target.name} artist`} onPress={() => openCreator(target)} style={[S.result, featured && S.featured]}><Image source={target.avatar} style={S.avatar}/><View style={{ flex: 1 }}><Label style={S.resultTitle}>{target.name}</Label><Label style={S.caption}>@{target.handle} · Local example creator</Label></View><Icon name="chevron-right" color={C.muted} size={28}/></Pressable>;
    const songRows = (list: AudioTrack[]) => list.map(track => <SongRow key={track.id} track={track} variant="search" playing={player.track?.id === track.id && player.status.playing} onPress={() => play(track, list)} onOptions={() => { Keyboard.dismiss(); onSongOptions(track); }}/>);
    const playlistRows = (limited = false) => (limited ? playlists.slice(0, 3) : playlists).map(item => <Pressable accessibilityRole="button" accessibilityLabel={`Open playlist ${item.name}`} key={item.id} onPress={() => openPlaylist(item.id)} style={S.result}><Image source={item.coverUri ? { uri: item.coverUri } : require('../assets/playlist-default.png')} style={S.cover}/><View style={{ flex: 1 }}><Label style={S.resultTitle}>{item.name}</Label><Label style={S.caption}>{item.songIds.length} songs</Label></View><Icon name="chevron-right" color={C.muted} size={28}/></Pressable>);
    return <View style={S.page}>
    <View style={S.header}><View style={S.search}><View pointerEvents="none" style={S.searchFill}/><Icon name="magnify" color={C.secondary} size={24}/><TextInput ref={input} accessibilityLabel="Search all music" autoCapitalize="none" placeholder="Search" value={query} onFocus={() => { if (phase === 'discover')
        setPhase('typing'); void history.refresh(); }} onChangeText={change} onSubmitEditing={submit} returnKeyType="search" submitBehavior="submit" style={S.input} selectionColor={C.primary} placeholderTextColor={C.secondary}/>{!!query && <IconButton name="close" label="Clear search" color={C.secondary} onPress={() => { change(''); input.current?.focus(); }} style={{ width: 40, height: 44 }}/>}</View><View style={S.headerEnd}><IconButton name={phase === 'discover' ? 'bell' : 'close'} label={phase === 'discover' ? 'Notifications' : 'Close search'} onPress={phase === 'discover' ? onNotifications : close} circle={C.field} size={24}/></View></View>
    {phase === 'discover' ? <SearchDiscover commentCounts={commentCounts} library={library} player={player} onSongOptions={onSongOptions} onProfile={onProfile} onInspiration={onInspiration} onOpenPlayer={onOpenPlayer} scrollOffsets={scrollOffsets} onBrowse={() => { setQuery(''); setPhase('results'); setFilter('Songs'); }}/> : <>
      {submitted && <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} style={S.tabs} contentContainerStyle={{ minWidth: '100%' }}>{filters.map(item => <Pressable key={item} accessibilityRole="tab" accessibilityLabel={`Search ${item}`} accessibilityState={{ selected: filter === item }} aria-selected={filter === item} onPress={() => chooseFilter(item)} style={[S.tab, filter === item && S.selectedTab]}><Label style={[S.tabText, { color: filter === item ? C.ink : C.muted }]}>{item}</Label></Pressable>)}</ScrollView>}
      {!library.ready ? <View style={S.empty}><ActivityIndicator accessibilityLabel="Loading local search" color={C.primary}/></View> : !search && !submitted ? <SearchRecent history={history} library={library} onCreator={openCreator} onSong={track => { play(track, library.tracks); onOpenPlayer(); }} onPlaylist={openPlaylist}/> : <ScrollView key={scrollKey} ref={scroll} onContentSizeChange={() => scroll.current?.scrollTo({ y: scrollOffsets.current[scrollKey] || 0, animated: false })} onScroll={event => { scrollOffsets.current[scrollKey] = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={100} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[S.results, showHooks && { paddingTop: 0 }]}>
        {submitted && filter === 'All' && artist && creator(true)}
        {showSongs && !!tracks.length && <>{submitted && filter === 'All' && header('Songs', 'Songs')}{songRows(submitted && filter === 'All' ? tracks.slice(0, 3) : tracks)}</>}
        {showArtist && artist && <>{submitted && filter === 'All' && header('Creators', 'Creators')}{creators.map(target => creator(false, target))}</>}
        {showPlaylists && !!playlists.length && <>{submitted && filter === 'All' && header('Playlists', 'Playlists')}{playlistRows(submitted && filter === 'All')}</>}
        {showHooks && <View style={S.hooks}>{hooks.map(track => <Pressable key={track.id} accessibilityRole="button" accessibilityLabel={`Play hook result ${track.title}`} onPress={() => { play(track, hooks); onOpenPlayer(); }} style={S.hook}><Image source={track.cover!} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover"/><View style={S.hookBottom}><Icon name="play" color={C.white}/><Label style={{ color: C.white, flex: 1 }}>{track.title}</Label></View></Pressable>)}</View>}
        {!any && <View style={S.noResults}><Icon name="magnify" size={32} color={C.muted}/><Label style={S.emptyText}>{search ? `No results for “${query}”` : 'No results'}</Label></View>}
        <Label style={S.disclosure}>Local example catalog · Searches stay on this device</Label>
      </ScrollView>}
    </>}
  </View>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    page: { flex: 1, backgroundColor: C.surface }, header: { height: 64, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }, search: { flex: 1, height: 48, paddingLeft: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }, searchFill: { position: 'absolute', left: 0, right: 0, top: 2, bottom: 2, borderRadius: 8, backgroundColor: C.surface === '#101012' ? '#1D1D1F' : C.field }, input: { flex: 1, fontFamily: 'RobotoRegular', fontSize: 16, color: C.ink, height: 48, paddingVertical: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }, headerEnd: { width: 48, alignItems: 'center' }, round: { width: 40, height: 40, borderRadius: 99, backgroundColor: C.field }, tabs: { flexGrow: 0, minHeight: 48, maxHeight: 48, borderBottomWidth: 1, borderBottomColor: C.surface === '#101012' ? '#FFFFFF26' : '#7D7C83' }, tab: { height: 48, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent', justifyContent: 'center' }, selectedTab: { borderBottomColor: C.secondary }, tabText: { fontSize: 16, lineHeight: 22 }, results: { paddingTop: 8, paddingBottom: 20 }, sectionHeader: { height: 52, marginTop: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { fontSize: 18, lineHeight: 24, fontFamily: 'RobotoMedium' }, seeAll: { minHeight: 44, justifyContent: 'center' }, secondary: { fontSize: 14, color: C.muted }, result: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }, featured: { minHeight: 72, paddingHorizontal: 16, margin: 8, marginHorizontal: 16, borderRadius: 20, backgroundColor: C.field }, avatar: { width: 56, height: 56, borderRadius: 99 }, cover: { width: 56, height: 56, borderRadius: 12 }, resultTitle: { fontSize: 14, lineHeight: 20 }, caption: { fontSize: 12, lineHeight: 18, color: C.muted }, empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 16, paddingBottom: 32 }, emptyText: { fontSize: 14, lineHeight: 22, color: C.secondary, textAlign: 'center' }, noResults: { alignItems: 'center', padding: 32, gap: 16 }, disclosure: { fontSize: 10, lineHeight: 16, textAlign: 'center', color: C.muted, margin: 20 }, hooks: { flexDirection: 'row', flexWrap: 'wrap' }, hook: { width: '50%', aspectRatio: 196 / 244, overflow: 'hidden', borderWidth: 0.5, borderColor: C.surface, backgroundColor: C.toolbar }, hookBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#00000066' },
});
export function Search(props: React.ComponentProps<typeof SearchContent>) { return <ThemedSurface><SearchContent {...props}/></ThemedSurface>; }
