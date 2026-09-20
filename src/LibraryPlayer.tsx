import React, { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { AudioTrack, clockTime, exampleTracks } from './audioData';
import { useLibraryPlayback } from './useLibraryPlayback';
import { useLibrary } from './useLibrary';
import { AddToPlaylist } from './AddToPlaylist';
import { PlaylistShare } from './PlaylistShare';
import { SongActions } from './SongActions';
import { Comments } from './Comments';
import { useCommunity } from './useCommunity';
import { C, Icon, IconButton, IconName, Label } from './ui';
export function LibraryPlayer({ player, library, community, author, onClose, onReuse }: {
    player: ReturnType<typeof useLibraryPlayback>;
    library: ReturnType<typeof useLibrary>;
    community: ReturnType<typeof useCommunity>;
    author: string;
    onClose: () => void;
    onReuse: (track: AudioTrack, withAudio: boolean) => void;
}) {
    const [adding, setAdding] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [options, setOptions] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [stylesExpanded, setStylesExpanded] = useState(false);
    const [notice, setNotice] = useState('');
    const [seekWidth, setSeekWidth] = useState(1);
    const track = player.track;
    if (!track)
        return null;
    const liked = !!library.data.likedIds?.includes(track.id);
    const seekTo = (x: number) => void player.seek(x / seekWidth * player.duration);
    const reuse = (audio: boolean) => { setOptions(false); onReuse(track, audio); onClose(); };
    const copyStyles = async () => {
        try {
            await Clipboard.setStringAsync(track.styles);
            setNotice('Styles copied');
        }
        catch {
            setNotice('Styles could not be copied. Try again.');
        }
    };
    const action = (label: string, name: IconName, text: string, onPress: () => void, active = false, glyph?: string) => <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={onPress} style={P.action}><View accessibilityLabel={glyph} style={P.actionIcon}><Icon name={name} color={active ? C.primary : C.surface} size={24}/></View><Label style={P.actionText}>{text}</Label></Pressable>;
    return <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <View style={P.desktop}><View style={P.shell}>
      <StatusBar style="light"/>
      <Image source={(track.templateId || track.id) === 'evening-drift' ? require('../assets/evening-drift-player-background.png') : require('../assets/morning-light-player-background.png')} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover"/>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={P.content} showsVerticalScrollIndicator={false}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close song player" onPress={onClose} style={P.handleArea}><View style={P.handle}/></Pressable>
          {track.cover && <Image accessibilityLabel={`${track.title} artwork`} source={track.cover} style={P.cover}/>}
          <View style={P.songHeader}><View style={{ flex: 1 }}><Label numberOfLines={2} style={P.title}>{track.title}</Label><Label style={P.artist}>{track.artist || 'Demo listener'}</Label></View><IconButton name="share-variant-outline" label="Share playing song" color={C.surface} onPress={() => setSharing(true)}/><IconButton name="dots-vertical" label="Playing song options" color={C.surface} onPress={() => setOptions(true)}/></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={P.actions}>
            {action(liked ? 'Unlike playing song' : 'Like playing song', liked ? 'thumb-up' : 'thumb-up-outline', liked ? '1' : '0', () => library.toggleLike(track.id), liked, 'Like')}
            {action('Open song comments', 'comment-processing-outline', String(community.data.comments.filter(comment => comment.trackId === track.id).length), () => setCommentsOpen(true), false, 'Comment')}
            {action('Remix playing song', 'autorenew', 'Remix', () => reuse(true))}
            {action('Add playing song to playlists', 'plus-box-outline', 'Playlist', () => setAdding(true))}
          </ScrollView>
          <View style={P.timeline}>
            <View accessible accessibilityRole="adjustable" accessibilityLabel="Song playback position" accessibilityValue={{ min: 0, max: player.duration, now: player.current, text: clockTime(player.current) }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={e => void player.seek(player.current + (e.nativeEvent.actionName === 'increment' ? 5 : -5))} {...(Platform.OS === 'web' ? { tabIndex: 0, onKeyDown: (e: any) => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
            void player.seek(e.key === 'Home' ? 0 : e.key === 'End' ? player.duration : player.current + (e.key === 'ArrowRight' ? 5 : -5));
        } } } : {})} onLayout={e => setSeekWidth(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={e => seekTo(e.nativeEvent.locationX)} onResponderMove={e => seekTo(e.nativeEvent.locationX)} style={P.seekTouch}>
              <View pointerEvents="none" style={P.seekBar}><View style={[P.seekFill, { width: `${player.duration ? player.current / player.duration * 100 : 0}%` }]}/></View>
            </View>
            <View style={P.times}><Label accessibilityLabel="Song elapsed time" style={P.time}>{clockTime(player.current)}</Label><Label style={P.time}>{clockTime(player.duration || track.duration || 0)}</Label></View>
          </View>
          <View style={P.transport}>
            <IconButton name="shuffle-variant" label={player.shuffle ? 'Disable shuffle' : 'Enable shuffle'} color={player.shuffle ? C.primary : C.surface} onPress={() => player.setShuffle(!player.shuffle)} size={30} style={P.transportButton}/>
            <IconButton name="rewind" label="Previous song" color={C.surface} onPress={player.previous} size={32} style={P.transportButton}/>
            <IconButton name={player.status.playing ? 'pause' : 'play'} label={player.status.playing ? 'Pause song' : 'Play song'} color={C.surface} onPress={() => void player.toggle()} size={32} style={P.transportButton}/>
            <IconButton name="fast-forward" label="Next song" color={C.surface} disabled={!player.canNext} onPress={() => player.next()} size={32} style={P.transportButton}/>
            <IconButton name={player.repeat === 'one' ? 'repeat-once' : 'repeat'} label={`Repeat: ${player.repeat}`} style={P.transportButton} color={player.repeat === 'off' ? C.surface : C.primary} onPress={() => player.setRepeat(player.repeat === 'off' ? 'all' : player.repeat === 'all' ? 'one' : 'off')} size={28}/>
          </View>
          {!!(player.error || player.status.error) && <Pressable accessibilityRole="button" accessibilityLabel="Retry song playback" onPress={() => void player.start(track, player.queue, player.playlistId)}><Label style={P.notice}>{player.error || 'This song could not load. Tap to retry.'}</Label></Pressable>}
          <View style={P.card}><View style={P.author}><Image source={require('../assets/demo-avatar.png')} style={P.avatar}/><View style={{ flex: 1 }}><Label style={P.authorName}>{track.artist || 'Demo listener'}</Label><Label style={P.secondary}>Local example artist · {exampleTracks.length} Songs</Label></View></View></View>
          <View style={P.card}><Label style={P.cardTitle}>About the song</Label><Label style={P.body}>Original local example music for this UI prototype. Playback uses the included audio; no Suno generation service is connected.</Label></View>
          <View style={P.card}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Label style={[P.cardTitle, { flex: 1 }]}>Style Description</Label><IconButton name="autorenew" label="Reuse song styles and lyrics" color={C.surface} onPress={() => reuse(false)} style={P.smallAction}/><IconButton name="content-copy" label="Copy song styles" color={C.surface} onPress={() => void copyStyles()} style={P.smallAction}/></View><Label numberOfLines={stylesExpanded ? undefined : 2} style={P.body}>{track.styles || 'No styles added'}</Label><Pressable accessibilityRole="button" onPress={() => setStylesExpanded(!stylesExpanded)} style={P.more}><Label style={P.secondary}>{stylesExpanded ? 'See Less' : 'See More'}</Label></Pressable></View>
          {!!track.lyrics && <View style={P.card}><Label style={P.cardTitle}>Lyrics</Label><Label style={P.body}>{track.lyrics}</Label></View>}
          {!!notice && <Label accessibilityLiveRegion="polite" style={P.notice}>{notice}</Label>}
        </ScrollView>
      </SafeAreaView>
      {adding && <AddToPlaylist track={track} library={library} onClose={() => setAdding(false)}/>}
      {commentsOpen && <Comments track={track} currentTime={player.current} author={author} community={community} onSeek={seconds => void player.seek(seconds)} onClose={() => setCommentsOpen(false)}/>}
      {sharing && <PlaylistShare tracks={[track]} playlist={{ id: 'shared-song', name: track.title, songIds: [track.id], isPublic: false, createdAt: 0 }} onClose={() => setSharing(false)}/>}
      {options && <SongActions track={track} liked={liked} canRemove={false} onClose={() => setOptions(false)} onRemove={() => { }} onLike={() => library.toggleLike(track.id)} onShare={() => { setOptions(false); setSharing(true); }} onReuse={reuse} onRadio={() => { void player.start(track, [track, ...exampleTracks.filter(song => song.id !== track.id)], player.playlistId); setOptions(false); }}/>}
    </View></View>
  </Modal>;
}
const P = StyleSheet.create({
    desktop: { flex: 1, alignItems: 'center', backgroundColor: '#17120F' },
    shell: { flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden' },
    content: { paddingBottom: 32 },
    handleArea: { position: 'absolute', top: 0, left: 0, right: 0, height: 40, alignItems: 'center', paddingTop: 12, zIndex: 1 },
    handle: { width: 32, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF66' },
    cover: { width: 280, height: 280, maxWidth: '80%', aspectRatio: 1, alignSelf: 'center', marginTop: 98, marginBottom: 80, borderRadius: 16 },
    songHeader: { paddingLeft: 20, paddingRight: 0, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: C.surface, fontFamily: 'RobotoBold', fontSize: 18, lineHeight: 26 },
    artist: { color: '#F7F4EF99', fontSize: 14, marginTop: 4 },
    actions: { gap: 8, paddingHorizontal: 20, paddingTop: 17 },
    action: { height: 48, paddingLeft: 16, paddingRight: 16, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF08' }, actionIcon: { width: 24, height: 24 },
    actionText: { color: C.surface, fontSize: 14, fontFamily: 'RobotoMedium' },
    timeline: { marginHorizontal: 16, marginTop: 16 },
    seekTouch: { height: 24, justifyContent: 'center' },
    seekBar: { height: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFFFFF33' },
    seekFill: { height: 8, borderRadius: 8, backgroundColor: '#FFFFFF' },
    times: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    time: { color: '#F7F4EF99', fontSize: 11, lineHeight: 16, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
    transport: { marginTop: 6, marginHorizontal: 20, height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, transportButton: { width: 60, height: 60 },
    card: { marginHorizontal: 20, marginTop: 12, borderRadius: 16, backgroundColor: '#FFFFFF08', padding: 16 },
    author: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: { width: 36, height: 36, borderRadius: 99 },
    authorName: { color: C.surface, fontSize: 16 },
    secondary: { color: '#F7F4EF88', fontSize: 12 },
    cardTitle: { fontFamily: 'RobotoBold', fontSize: 14, color: C.surface },
    body: { color: C.surface, fontSize: 14, lineHeight: 20, marginTop: 16 },
    smallAction: { width: 36, height: 36, marginLeft: 8, borderRadius: 99, backgroundColor: '#FFFFFF08' },
    more: { marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderColor: '#FFFFFF22', alignItems: 'center' },
    notice: { margin: 20, color: C.surface, fontSize: 12 },
});
