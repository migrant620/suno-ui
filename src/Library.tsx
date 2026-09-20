import { ThemeColors, LightSurface, ThemedSurface, useSurfaceColors } from './Theme';
import { LibrarySearch as Search } from './LibrarySearch';
import { SongRow } from './SongRow';
import { sampleTrack } from './sampleSongs';
import React, { useEffect, useState } from 'react';
import { BackHandler, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { C, Icon, IconButton, Label, S } from './ui';
import { AudioConfirm, SongPicker } from './Audio';
import { PlaylistDetails } from './PlaylistDetails';
import { PlaylistShare } from './PlaylistShare';
import { SongActions } from './SongActions';
import { useLibraryPlayback } from './useLibraryPlayback';
import { PlaylistEditor } from './PlaylistEditor';
import { PlaylistForm } from './PlaylistForm';
import { AudioTrack, exampleTracks } from './audioData';
import { useLibrary } from './useLibrary';
export type LibraryRoute = 'home' | 'liked' | 'playlists' | 'search' | 'shared' | `playlist:${string}`;
const likedArt = require('../assets/liked-texture.png');
const playlistArt = require('../assets/playlist-default.png');
const filters = ['All', 'My Playlists', 'By Others', 'By Suno'];
function LibraryContent({ route, onRoute, onCreate, onReuse, library, player, onDetailBack }: {
    onDetailBack?: () => void;
    route: LibraryRoute;
    onRoute: (route: LibraryRoute) => void;
    onCreate: () => void;
    onReuse: (track: AudioTrack, audio: boolean) => void;
    library: ReturnType<typeof useLibrary>;
    player: ReturnType<typeof useLibraryPlayback>;
}) {
    const C = useSurfaceColors();
    const L = styles(C);
    const { view, setView, filter, setFilter, query, setQuery, searching, setSearching, likedOrigin, setLikedOrigin } = library;
    const [creating, setCreating] = useState(false);
    const [menu, setMenu] = useState(false);
    const [editing, setEditing] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [songActions, setSongActions] = useState<AudioTrack | null>(null);
    const [sharingSong, setSharingSong] = useState<AudioTrack | null>(null);
    const item = route === 'shared' ? library.shared || undefined : route.startsWith('playlist:') ? library.data.playlists.find(p => p.id === route.slice(9)) : undefined;
    const detailItem = item || { id: 'liked', name: 'Liked Songs', songIds: library.data.likedIds || [], isPublic: false, createdAt: 0 };
    const tracks = detailItem.songIds.map(id => [...(item?.songs || []).map(sampleTrack), ...library.tracks].find(track => track.id === id)).filter((track): track is AudioTrack => !!track).map(track => ({ ...track, likes: library.data.likedIds?.includes(track.id) ? 1 : 0 }));
    const back = () => { if (onDetailBack && route.startsWith('playlist:')) {
        onDetailBack();
        return;
    } Keyboard.dismiss(); setSearching(false); setQuery(''); onRoute(route === 'liked' ? likedOrigin : item ? 'playlists' : 'home'); };
    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (menu) {
                setMenu(false);
                return true;
            }
            if (searching) {
                Keyboard.dismiss();
                setSearching(false);
                setQuery('');
                return true;
            }
            if (route === 'liked' || route === 'shared' || route.startsWith('playlist:'))
                return false;
            if (route !== 'home') {
                back();
                return true;
            }
            return false;
        });
        return () => sub.remove();
    }, [route, menu, searching, likedOrigin, onDetailBack]);
    const openLiked = (origin: 'home' | 'playlists' | 'search') => { setLikedOrigin(origin); onRoute('liked'); };
    const cover = (liked: boolean, size: number, uri?: string) => <View style={{ width: size, height: size, borderRadius: size > 100 ? 20 : 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}><Image source={uri ? { uri } : liked ? likedArt : playlistArt} style={{ position: 'absolute', width: '100%', height: '100%' }}/>{liked && <Icon name="thumb-up" size={size * 0.32} color="#B8DEEF"/>}</View>;
    const searchInput = <View style={[L.searchBox, route === 'search' && { borderRadius: 99 }]}><Icon name="magnify" color={C.muted}/><TextInput autoFocus accessibilityLabel={route === 'search' ? 'Search songs' : 'Search playlists'} placeholder={route === 'search' ? 'Search for songs in your library' : 'Search playlists'} placeholderTextColor={C.muted} style={L.searchInput} value={query} onChangeText={setQuery}/>{!!query && <IconButton name="close" label="Clear playlist search" onPress={() => setQuery('')} style={{ width: 32, height: 40 }}/>}</View>;
    const detail = route === 'liked' || !!item;
    const listItems: {
        id: string;
        name: string;
        coverUri?: string;
    }[] = [
        ...(!query.trim() ? [{ id: 'new', name: 'New Playlist' }] : []),
        { id: 'liked', name: 'Liked Songs' },
        ...library.data.playlists,
    ].filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()));
    const ownFilter = filter === 'All' || filter === 'My Playlists';
    if (editing && item)
        return <PlaylistEditor item={item} onClose={() => setEditing(false)} onSave={changed => { library.update(item.id, changed); setEditing(false); }}/>;
    return <View style={L.page}>
    {route === 'search' ? <Search library={library} player={player} onSongOptions={setSongActions} onBack={back}/> : searching ? <>
      <View style={L.searchHeader}>{searchInput}{<IconButton name="close" label="Close library search" onPress={() => { Keyboard.dismiss(); setSearching(false); setQuery(''); }} style={L.headerAction}/>}</View>
      {query.trim() && library.data.playlists.some(p => p.name.toLowerCase().includes(query.trim().toLowerCase())) ? <ScrollView keyboardShouldPersistTaps="handled">{library.data.playlists.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase())).map(p => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => { Keyboard.dismiss(); setSearching(false); onRoute(`playlist:${p.id}`); }} style={[L.listItem, { margin: 16 }]}>{cover(false, 56, p.coverUri)}<Label>{p.name}</Label></Pressable>)}</ScrollView> : <View style={L.center}>{<Label style={{ color: C.muted }}>No playlists match your search</Label>}</View>}
    </> : detail ? <PlaylistDetails backLabel={onDetailBack ? 'Back to Search' : undefined} key={detailItem.id} item={detailItem} liked={route === 'liked'} shared={route === 'shared'} tracks={tracks} player={player} onBack={back} onCreate={onCreate} onAdd={() => { player.player.pause(); setAdding(true); }} onMenu={() => setMenu(true)} onSongOptions={setSongActions}/> : route === 'playlists' ? <>
      <View style={[L.header, { gap: 16 }]}><IconButton name="chevron-left" label="Back to Library" onPress={back} style={L.headerAction}/><View style={{ flex: 1 }}/><IconButton name="magnify" label="Search Playlists" onPress={() => setSearching(true)} style={L.headerAction}/><IconButton name="plus" label="Create Playlist" disabled={!library.ready} onPress={() => setCreating(true)} style={L.headerAction}/></View>
      <View style={L.listHeading}><Label style={L.title}>Playlists</Label><View style={{ flex: 1 }}/><IconButton name={view === 'grid' ? 'format-list-bulleted' : 'view-grid'} label={`Switch to ${view === 'grid' ? 'list' : 'grid'} view`} onPress={() => setView(view === 'grid' ? 'list' : 'grid')}/></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={L.filters}>{filters.map(name => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: filter === name }} onPress={() => setFilter(name)} style={[L.filter, filter === name && { backgroundColor: C.ink }]}><Label style={{ fontSize: 12, color: filter === name ? C.surface : C.ink }}>{name}</Label></Pressable>)}</ScrollView>
      {ownFilter && listItems.length ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[L.items, view === 'grid' ? L.grid : { gap: 16, paddingTop: 24 }]}>{listItems.map(p => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => p.id === 'new' ? setCreating(true) : p.id === 'liked' ? openLiked('playlists') : onRoute(`playlist:${p.id}`)} style={view === 'grid' ? L.gridItem : L.listItem}>
        {p.id === 'new' ? <View style={[L.newCover, view === 'grid' ? { width: '100%', aspectRatio: 1, borderRadius: 20 } : { width: 56, height: 56, borderRadius: 12, backgroundColor: C.toolbar }]}><Icon name="plus" size={view === 'grid' ? 32 : 24}/></View> : <View style={view === 'grid' ? L.gridCover : undefined}>{view === 'grid' ? <><Image source={p.coverUri ? { uri: p.coverUri } : p.id === 'liked' ? likedArt : playlistArt} style={{ position: 'absolute', width: '100%', height: '100%' }}/>{p.id === 'liked' && <Icon name="thumb-up" size={62} color="#B8DEEF"/>}</> : cover(p.id === 'liked', 56, p.coverUri)}</View>}
        <View style={view === 'grid' ? { padding: 4, paddingTop: 8 } : { flex: 1 }}><Label style={{ fontSize: 14 }} numberOfLines={2}>{p.name}</Label>{p.id !== 'new' && p.id !== 'liked' && <Label style={L.metadata}>Demo listener</Label>}</View>
      </Pressable>)}</ScrollView> : <View style={L.center}><Label style={{ color: C.disabled }}>No playlists saved yet</Label></View>}
    </> : <>
      <View style={L.header}><Label style={[L.title, { letterSpacing: 1.05 }]}>Library</Label><View style={{ flex: 1 }}/><IconButton name="magnify" label="Search" onPress={() => { setQuery(''); onRoute('search'); }} circle={C.field} style={{ marginTop: -8 }}/></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={L.categories}>
        <Pressable accessibilityRole="button" accessibilityLabel="Liked" onPress={() => openLiked('home')} style={L.category}><Image source={likedArt} style={L.categoryImage}/><View style={L.categoryIcon}><Icon name="thumb-up" size={56} color="#B8DEEF"/></View><Label style={L.categoryTitle}>Liked</Label></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Playlists" onPress={() => onRoute('playlists')} style={L.category}><Image source={require('../assets/playlists-cover.png')} style={L.categoryImage}/><Label style={L.categoryTitle}>Playlists</Label></Pressable>
      </ScrollView>
      {library.songs.length ? <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}><Label style={[L.title, { fontSize: 20, paddingHorizontal: 16, marginBottom: 12 }]}>Your songs</Label>{library.songs.map(track => <SongRow key={track.id} track={track} playing={player.track?.id === track.id && player.status.playing} onPress={() => void player.playTrack(track, library.songs, 'library')} onOptions={() => setSongActions(track)}/>)}<Label style={{ fontSize: 11, color: C.muted, padding: 16 }}>Local examples use prerecorded audio.</Label></ScrollView> : <><View style={L.emptyMain}><Image source={C.surface === '#101012' ? require('../assets/library-empty-dark.png') : require('../assets/library-empty.png')} style={{ width: 211, height: 180 }}/><Label style={[L.title, { marginTop: 17, textAlign: 'center', fontFamily: 'RobotoRegular', letterSpacing: 0.18 }]}>No songs to show!</Label></View>
      <View style={L.tip}><Label style={L.tipText}>Create your first hit from</Label><View style={[S.row, { justifyContent: 'center' }]}><Label style={L.tipText}>the </Label><Icon name="music-note-plus" size={18} color={C.muted}/><Label style={L.tipText}> button below</Label></View><Icon name="arrow-down-bold" size={40} color="#AA5290"/></View></>}
    </>}
    {!!library.error && <Label style={{ padding: 12, color: '#B52B19' }}>{library.error}</Label>}
    {creating && <PlaylistForm onClose={() => setCreating(false)} onSave={(name, isPublic) => { library.create(name, isPublic); setCreating(false); }}/>}
    {menu && item && <View style={StyleSheet.absoluteFill}><Pressable accessibilityRole="button" accessibilityLabel="Close playlist actions" onPress={() => setMenu(false)} style={StyleSheet.absoluteFill}/><View style={L.menu}>
      <Pressable accessibilityRole="button" onPress={() => { setMenu(false); setEditing(true); }} style={L.menuRow}><Icon name="pencil"/><Label>Edit Playlist Details</Label></Pressable>
      <Pressable accessibilityRole="button" onPress={() => { setMenu(false); setAdding(true); }} style={L.menuRow}><Icon name="plus"/><Label>Add Songs</Label></Pressable>
      <Pressable accessibilityRole="button" onPress={() => { library.update(item.id, { ...item, isPublic: !item.isPublic }); setMenu(false); }} style={L.menuRow}><Icon name={item.isPublic ? 'lock' : 'earth'}/><Label>{item.isPublic ? 'Make Private' : 'Make Public'}</Label></Pressable>
      <Pressable accessibilityRole="button" onPress={() => { setMenu(false); setRemoving(true); }} style={L.menuRow}><Icon name="delete" color="#BF300B"/><Label style={{ color: '#BF300B' }}>Delete Playlist</Label></Pressable>
    </View></View>}
    {removing && item && <AudioConfirm destructive title="Delete playlist?" description="You will not be able to get your playlist back once you press 'Delete'." confirm="Delete" cancel="Cancel" onCancel={() => setRemoving(false)} onConfirm={() => { setRemoving(false); void library.remove(item.id).then(removed => { if (removed)
        onRoute('playlists'); }); }}/>}
    {songActions && <SongActions track={songActions} liked={!!library.data.likedIds?.includes(songActions.id)} canRemove={!!item && route !== 'shared'} onClose={() => setSongActions(null)} onRemove={() => { if (item)
        library.removeSong(item.id, songActions.id); setSongActions(null); }} onLike={() => library.toggleLike(songActions.id)} onShare={() => { setSharingSong(songActions); setSongActions(null); }} onReuse={audio => { const song = songActions; setSongActions(null); onReuse(song, audio); }} onRadio={() => { void player.start(songActions, [songActions, ...exampleTracks.filter(track => track.id !== songActions.id)], detailItem.id); setSongActions(null); }}/>}
    {sharingSong && <LightSurface><PlaylistShare tracks={[sharingSong]} playlist={{ id: 'shared-song', name: sharingSong.title, description: 'Local example music', songIds: [sharingSong.id], isPublic: false, createdAt: 0 }} onClose={() => setSharingSong(null)}/></LightSurface>}
    {adding && item && <SongPicker songs={library.songs} likedSongs={library.tracks.filter(track => library.data.likedIds?.includes(track.id))} onClose={() => setAdding(false)} playlist={{ onAdd: song => library.addSong(item.id, song.id), onRemove: song => library.removeSong(item.id, song.id) }}/>}
  </View>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    page: { flex: 1, backgroundColor: C.surface },
    header: { height: 76, flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
    title: { fontFamily: 'RobotoBold', fontSize: 28, lineHeight: 34 },
    headerAction: { marginTop: -4, width: 40, height: 40, borderRadius: 99, backgroundColor: C.field },
    categories: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
    category: { width: 164, height: 124, borderRadius: 16, overflow: 'hidden' },
    categoryImage: { position: 'absolute', width: '100%', height: '100%' },
    categoryIcon: { position: 'absolute', top: 29, left: 53 },
    categoryTitle: { position: 'absolute', bottom: 12, left: 12, color: C.white, fontSize: 18, lineHeight: 24 },
    emptyMain: { flex: 1, paddingBottom: 42, justifyContent: 'center', alignItems: 'center' },
    tip: { height: 136, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 0, gap: 2 },
    tipText: { fontSize: 14, color: C.muted, lineHeight: 21 },
    largeCover: { alignSelf: 'center', marginTop: 4 },
    metadata: { fontSize: 14, color: C.muted },
    createSongs: { alignSelf: 'center', marginTop: 32, width: 244, minHeight: 40, borderRadius: 99, backgroundColor: C.toolbar, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    created: { marginTop: 20, fontSize: 14, textAlign: 'center', color: C.secondary },
    detailTint: { position: 'absolute', left: 0, right: 0, top: 0, height: 320 },
    listHeading: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', height: 40, marginBottom: 16 },
    filters: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
    filter: { minHeight: 40, borderRadius: 99, backgroundColor: C.field, justifyContent: 'center', paddingHorizontal: 16 },
    items: { paddingHorizontal: 16, paddingBottom: 24 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    gridItem: { width: '47.7%' },
    gridCover: { width: '100%', aspectRatio: 1, borderRadius: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
    newCover: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.divider, backgroundColor: C.field },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, paddingTop: 8, height: 64 },
    searchBox: { flex: 1, paddingHorizontal: 12, borderRadius: 8, height: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface === '#101012' ? C.control : '#10101206', gap: 8 },
    searchInput: { flex: 1, fontFamily: 'RobotoRegular', fontSize: 16, color: C.ink, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
    menu: { position: 'absolute', top: 72, right: 16, backgroundColor: C.toolbar, borderRadius: 20, width: 220, paddingVertical: 12, boxShadow: '0px 3px 8px #00000022' },
    menuRow: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 16 },
});
export function Library(props: React.ComponentProps<typeof LibraryContent>) { return <ThemedSurface><LibraryContent {...props}/></ThemedSurface>; }
