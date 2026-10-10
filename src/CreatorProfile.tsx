import { ExampleCreator, exampleCreators } from './creatorData';
import React, { useEffect, useRef, useState } from 'react';
import { PublicVoice, publicVoices } from './voiceData';
import { BackHandler, Image, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { AudioTrack } from './audioData';
import { useLibraryPlayback } from './useLibraryPlayback';
import { useLocalProfile } from './useLocalProfile';
import { SongRow } from './SongRow';
import { C, Icon, IconButton, Label, Sheet } from './ui';
export function CreatorProfile({ account, player, onVoice, scrollOffsets, onClose, onSongOptions, onOpenPlayer, creator = exampleCreators[0], backLabel = 'Back to Search' }: {
    creator?: ExampleCreator;
    backLabel?: string;
    onVoice: (voice: PublicVoice) => void;
    scrollOffsets?: React.MutableRefObject<Record<string, number>>;
    account: ReturnType<typeof useLocalProfile>;
    player: ReturnType<typeof useLibraryPlayback>;
    onClose: () => void;
    onSongOptions: (track: AudioTrack) => void;
    onOpenPlayer: () => void;
}) {
    const [panel, setPanel] = useState<'share' | 'followers' | 'following' | 'more' | null>(null);
    const [notice, setNotice] = useState('');
    const scroll = useRef<ScrollView>(null);
    const restoring = useRef(true);
    const voices = creator.shared ? [] : publicVoices.filter(voice => voice.creatorId === creator.id);
    const [busy, setBusy] = useState(false);
    const followed = !!account.profile.followedCreatorIds?.includes(creator.id);
    const follow = () => account.update(current => ({ followedCreatorIds: current.followedCreatorIds?.includes(creator.id) ? current.followedCreatorIds.filter(id => id !== creator.id) : [...(current.followedCreatorIds || []), creator.id] }));
    const share = async (copy: boolean) => {
        if (busy)
            return;
        setBusy(true);
        try {
            const url = Linking.createURL('', { queryParams: creator.shared ? { profile: JSON.stringify({ version: 1, id: creator.id.replace(/^shared-/, ''), name: creator.name, handle: creator.handle, bio: creator.bio || '' }) } : { creator: creator.id } });
            if (copy || (Platform.OS === 'web' && typeof navigator.share !== 'function')) {
                await Clipboard.setStringAsync(url);
                setNotice('Link copied');
            }
            else
                await Share.share({ title: creator.name, message: `${creator.name} · Local example creator\n${url}`, ...(Platform.OS === 'ios' ? { url } : {}) });
        }
        catch (error) {
            if (!(error instanceof Error && error.name === 'AbortError'))
                setNotice('Sharing could not open. Try Copy Link instead.');
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => { const handler = BackHandler.addEventListener('hardwareBackPress', () => { if (panel)
        setPanel(null);
    else
        onClose(); return true; }); return () => handler.remove(); }, [panel, onClose]);
    const closePanel = () => { setPanel(null); setNotice(''); };
    return <View style={P.page}>
    <ScrollView ref={scroll} onContentSizeChange={() => { if (restoring.current) {
        scroll.current?.scrollTo({ y: scrollOffsets?.current[`creator:${creator.id}`] || 0, animated: false });
        restoring.current = false;
    } }} onScroll={event => { if (!restoring.current && scrollOffsets)
        scrollOffsets.current[`creator:${creator.id}`] = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={100} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={P.hero}>
        <Image source={creator.cover} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover"/>
        <LinearGradient pointerEvents="none" colors={['#F8F5F000', C.surface]} style={P.fade}/>
        <View style={P.identity}><Image source={creator.avatar} style={P.avatar}/><View style={{ flex: 1 }}><Label style={P.name}>{creator.name}</Label><Label style={P.handle}>@{creator.handle}</Label></View></View>
      </View>
      {!!creator.bio && <Label style={{ marginHorizontal: 16, marginTop: 12 }}>{creator.bio}</Label>}
      <View style={P.connections}>{(['followers', 'following'] as const).map(kind => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={`Creator ${kind}`} onPress={() => setPanel(kind)} style={P.connection}><Icon name="account-multiple" size={18}/><Label style={P.actionText}>{kind === 'followers' && followed ? 1 : 0} {kind}</Label></Pressable>)}</View>
      <Label style={P.heading}>Songs</Label>
      {creator.tracks.map(track => <SongRow key={track.id} track={track} variant="search" playing={player.track?.id === track.id && player.status.playing} onPress={() => void player.playTrack(track, creator.tracks, `creator:${creator.id}`)} onOptions={() => onSongOptions(track)}/>)}
      {creator.tracks.length ? <Pressable accessibilityRole="button" accessibilityLabel="Play creator songs" style={P.play} onPress={() => { void player.start(creator.tracks[0], creator.tracks, `creator:${creator.id}`); onOpenPlayer(); }}><Icon name="play"/><Label>Play songs</Label></Pressable> : <View style={P.emptySongs}><View accessible={false} importantForAccessibility="no-hide-descendants" style={P.emptyRows}>{[0, 1, 2].map(index => <View key={index} style={P.emptyRow}><View style={P.emptyCover}/><View style={P.emptyLines}><View style={P.emptyLine}/><View style={[P.emptyLine, { width: 80 }]}/></View></View>)}</View><Label style={P.emptySongsLabel}>No songs added yet</Label></View>}
      <Label style={P.heading}>Voices</Label>{voices.length ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={P.voices}>{voices.map(voice => <Pressable key={voice.id} accessibilityRole="button" accessibilityLabel={`Open Voice ${voice.name}`} onPress={() => onVoice(voice)} style={P.voiceCard}><Image source={require('../assets/voice-public-hero.png')} style={P.voiceArt} accessible={false}/><Label numberOfLines={1} style={P.voiceName}>{voice.name}</Label></Pressable>)}</ScrollView><View style={P.creatorFooter}><Image source={creator.avatar} style={P.footerAvatar} accessible={false}/><Label style={P.footerName}>{creator.name}</Label><Pressable accessibilityRole="button" accessibilityLabel={followed ? `Unfollow ${creator.name} from footer locally` : `Follow ${creator.name} from footer locally`} disabled={!account.ready} onPress={follow} style={P.follow}><Icon name={followed ? 'account-check' : 'account-plus'} size={20}/><Label>{followed ? 'Following' : 'Follow'}</Label></Pressable></View></> : <Label style={P.empty}>No voices added yet</Label>}
      <Label style={P.disclosure}>{creator.shared ? 'Shared profile snapshot · Photos and songs are not included' : 'Local example creator · Follows stay on this device'}</Label>
      {!!account.error && <Label accessibilityLiveRegion="polite" style={P.error}>{account.error}</Label>}
    </ScrollView>
    <View style={[P.header, P.fixedHeader]}><IconButton name="chevron-left" label={backLabel} onPress={onClose} style={P.round}/><View style={{ flex: 1 }}/><Pressable accessibilityRole="button" accessibilityLabel={followed ? `Unfollow ${creator.name} locally` : `Follow ${creator.name} locally`} aria-pressed={followed} accessibilityState={{ selected: followed, disabled: !account.ready }} disabled={!account.ready} onPress={follow} style={P.follow}><Icon name={followed ? 'account-check' : 'account-plus'} size={24}/><Label style={P.actionText}>{followed ? 'Following' : 'Follow'}</Label></Pressable><IconButton name="share-variant-outline" label="Share creator" onPress={() => setPanel('share')} style={P.round}/><IconButton name="dots-vertical" label="Creator actions" onPress={() => setPanel('more')} style={P.round}/></View>
    {panel && <Sheet compact onClose={closePanel}><Label style={P.panelTitle}>{panel === 'share' ? 'Share' : panel === 'more' ? 'Creator actions' : panel === 'followers' ? 'Followers' : 'Following'}</Label>
      {panel === 'share' ? <><View style={P.shareOptions}><Pressable accessibilityRole="button" accessibilityLabel="Copy creator link" disabled={busy} onPress={() => void share(true)} style={P.shareOption}><View style={P.shareIcon}><Icon name="link-variant"/></View><Label>Copy Link</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="More creator share options" disabled={busy} onPress={() => void share(false)} style={P.shareOption}><View style={P.shareIcon}><Icon name="dots-vertical"/></View><Label>More</Label></Pressable></View><Label accessibilityLiveRegion="polite" style={P.disclosure}>{notice || 'Share this local example profile.'}</Label></> : panel === 'more' ? <><Pressable accessibilityRole="button" accessibilityLabel="Share creator profile" onPress={() => setPanel('share')} style={P.menuRow}><Icon name="share-variant-outline"/><Label>Share profile</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel={followed ? 'Unfollow creator from menu' : 'Follow creator from menu'} disabled={!account.ready} onPress={() => { follow(); closePanel(); }} style={P.menuRow}><Icon name={followed ? 'account-minus' : 'account-plus'}/><Label>{followed ? 'Unfollow' : 'Follow'}</Label></Pressable><Label style={P.disclosure}>Changes apply only to this local example.</Label></> : panel === 'followers' && followed ? <View style={P.follower}><Image source={account.profile.avatarUri ? { uri: account.profile.avatarUri } : require('../assets/demo-avatar.png')} style={P.followerAvatar}/><View><Label>{account.profile.name}</Label><Label style={P.caption}>You · Local demo profile</Label></View></View> : <Label style={P.empty}>{panel === 'followers' ? 'No followers yet' : 'Not following anyone yet'}</Label>}
    </Sheet>}
  </View>;
}
const P = StyleSheet.create({
    fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0 }, voices: { paddingHorizontal: 16, gap: 4 }, voiceCard: { width: 134, alignItems: 'center', paddingBottom: 8 }, voiceArt: { width: 112, height: 112 }, voiceName: { fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 126 }, creatorFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, paddingHorizontal: 16 }, footerAvatar: { width: 56, height: 56, borderRadius: 28 }, footerName: { flex: 1, fontSize: 18, lineHeight: 24 }, emptySongs: { height: 196, justifyContent: 'center', alignItems: 'center', marginHorizontal: 16 }, emptyRows: { position: 'absolute', top: 0, left: 0, right: 0, gap: 8 }, emptyRow: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }, emptyCover: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#EFECE8', borderWidth: 1, borderColor: '#DEDBD6' }, emptyLines: { gap: 8 }, emptyLine: { height: 10, width: 144, backgroundColor: '#EFECE8', borderRadius: 5 }, emptySongsLabel: { fontSize: 14, lineHeight: 20 },
    page: { flex: 1, backgroundColor: C.surface }, hero: { height: 272, overflow: 'hidden' }, fade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 48 }, header: { height: 70, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, round: { width: 40, height: 40, borderRadius: 99, backgroundColor: '#FFFFFFCC' }, follow: { height: 48, borderRadius: 99, backgroundColor: '#FFFFFFCC', flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 16 }, actionText: { fontSize: 14, lineHeight: 20 }, identity: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }, avatar: { width: 76, height: 76, borderRadius: 99 }, name: { fontSize: 28, lineHeight: 34, fontFamily: 'RobotoBold' }, handle: { fontSize: 14, lineHeight: 22 }, connections: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 }, connection: { minHeight: 44, paddingHorizontal: 16, borderRadius: 99, backgroundColor: '#EEEBE7', flexDirection: 'row', alignItems: 'center', gap: 4 }, heading: { fontSize: 18, lineHeight: 24, marginHorizontal: 16, marginTop: 4, marginBottom: 8 }, play: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, minHeight: 44, paddingHorizontal: 20, backgroundColor: '#EEEBE7', borderRadius: 99 }, empty: { textAlign: 'center', padding: 32, fontSize: 14, color: C.muted }, disclosure: { fontSize: 11, lineHeight: 17, textAlign: 'center', color: C.muted, padding: 16 }, error: { color: '#B52B19', padding: 16 }, panelTitle: { fontSize: 18, fontFamily: 'RobotoMedium', textAlign: 'center', marginBottom: 20 }, shareOptions: { flexDirection: 'row', justifyContent: 'space-around' }, shareOption: { alignItems: 'center', gap: 10, minWidth: 80 }, shareIcon: { width: 48, height: 48, borderRadius: 99, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, menuRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24 }, follower: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 24 }, followerAvatar: { width: 56, height: 56, borderRadius: 99 }, caption: { color: C.muted, fontSize: 12, marginTop: 4 },
});
