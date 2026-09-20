import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PublicVoice } from './voiceData';
import { ExampleCreator } from './creatorData';
import { AudioTrack } from './audioData';
import { useLocalProfile } from './useLocalProfile';
import { useLibraryPlayback } from './useLibraryPlayback';
import { SongRow } from './SongRow';
import { Accent, Icon, Label, Sheet } from './ui';
import { OwnVoice } from './useOwnVoices';
import { LocalVoicePreview } from './LocalVoicePreview';
export function VoiceDetails({ voice, creator, account, songs, player, onClose, onUse, onCreator, onSongOptions, ownVoice }: {
    ownVoice?: OwnVoice;
    voice: PublicVoice;
    creator: ExampleCreator;
    account: ReturnType<typeof useLocalProfile>;
    songs: AudioTrack[];
    player: ReturnType<typeof useLibraryPlayback>;
    onClose: () => void;
    onUse: () => void;
    onCreator: () => void;
    onSongOptions: (song: AudioTrack) => void;
}) {
    const insets = useSafeAreaInsets();
    const [imageError, setImageError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const liked = !!account.profile.likedVoiceIds?.includes(voice.id);
    const toggleLike = () => account.update(current => ({ likedVoiceIds: current.likedVoiceIds?.includes(voice.id) ? current.likedVoiceIds.filter(id => id !== voice.id) : [...(current.likedVoiceIds || []), voice.id] }));
    const tracks = songs.filter(song => song.voiceId === voice.id);
    return <Sheet onClose={onClose} backgroundColor="#EDEAE4" handleHeight={44} handlePaddingTop={22} handleColor="#68666C">
    {imageError ? <View style={D.error}><Label accessibilityRole="alert" style={D.errorText}>Something went wrong. Please try again.</Label><Pressable accessibilityRole="button" accessibilityLabel="Retry voice details" onPress={() => { setAttempt(value => value + 1); setImageError(false); }} style={D.retry}><Label style={D.retryText}>Tap to retry</Label></Pressable></View> : <>
      <ScrollView contentContainerStyle={D.content}>
        <View style={D.header}>
          <Image key={attempt} source={require('../assets/voice-public-hero.png')} onError={() => setImageError(true)} style={D.art} accessible={false}/>
          <View style={D.identity}><Label numberOfLines={1} style={D.title}>{voice.name}</Label><Pressable accessibilityRole="button" accessibilityLabel={`View voice creator ${creator.name}`} onPress={onCreator} style={D.creator}><Image source={creator.avatar} style={D.avatar} accessible={false}/><Label style={D.creatorName}>{creator.name}</Label></Pressable></View>
          <Pressable accessibilityRole="button" accessibilityLabel={liked ? `Unlike ${voice.name} locally` : `Like ${voice.name} locally`} accessibilityState={{ selected: liked, disabled: !account.ready }} aria-pressed={liked} disabled={!account.ready} onPress={toggleLike} style={D.like}><Icon name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? '#FD429C' : '#101012'}/><Label style={D.count}>{liked ? 1 : 0}</Label></Pressable>
        </View>
        {ownVoice && <LocalVoicePreview voice={ownVoice} libraryPlaying={player.status.playing} onPlay={() => player.player.pause()}/>}
        <View style={D.heading}><Label style={D.songs}>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</Label><Label style={D.subtitle}>Songs that are using this voice</Label></View>
        {tracks.map(track => <SongRow key={track.id} track={track} variant="search" playing={player.track?.id === track.id && player.status.playing} onPress={() => void player.playTrack(track, tracks, `voice:${voice.id}`)} onOptions={() => onSongOptions(track)}/>)}
      </ScrollView>
      <View style={[D.footer, { paddingBottom: 24 + (Platform.OS === 'android' ? insets.bottom : 0) }]}>
        <Label accessibilityLiveRegion="polite" style={D.disclosure}>{account.error || 'Local example Voice · Likes stay on this device'}</Label>
        <Pressable accessibilityRole="button" accessibilityLabel={`Use Voice ${voice.name}`} onPress={onUse}><Accent style={D.use}><Icon name="music-note-plus" size={20} color="#FFFFFF"/><Label style={D.useText}>Use Voice</Label></Accent></Pressable>
      </View>
    </>}
  </Sheet>;
}
const D = StyleSheet.create({
    content: { paddingTop: 0, paddingBottom: 16 }, header: { height: 104, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }, art: { width: 100, height: 100 }, identity: { flex: 1, minWidth: 0 }, title: { fontSize: 28, lineHeight: 34, fontFamily: 'RobotoMedium', color: '#101012' }, creator: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }, avatar: { width: 16, height: 16, borderRadius: 8 }, creatorName: { fontSize: 16, lineHeight: 20, color: '#101012' }, like: { marginLeft: -12, height: 48, minWidth: 72, paddingHorizontal: 12, borderRadius: 24, backgroundColor: '#E6E3DD', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }, count: { fontSize: 18, color: '#101012' }, heading: { marginTop: 40, marginHorizontal: 16, marginBottom: 16 }, songs: { fontSize: 18, lineHeight: 24, color: '#101012' }, subtitle: { fontSize: 12, lineHeight: 16, color: '#85828A' }, footer: { alignItems: 'center', gap: 8, paddingHorizontal: 16 }, disclosure: { fontSize: 10, lineHeight: 14, textAlign: 'center', color: '#65636A' }, use: { height: 56, width: 140, justifyContent: 'center', borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 8 }, useText: { fontSize: 16, lineHeight: 20, color: '#FFFFFF', fontFamily: 'RobotoMedium' }, error: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, gap: 8 }, errorText: { textAlign: 'center', fontSize: 18, lineHeight: 22, color: '#101012' }, retry: { minHeight: 48, justifyContent: 'center' }, retryText: { fontSize: 16, lineHeight: 20, color: '#85828A' },
});
