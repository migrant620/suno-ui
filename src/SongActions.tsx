import { ThemeColors, useSurfaceColors } from './Theme';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AudioTrack } from './audioData';
import { C, Icon, IconName, Label, Sheet } from './ui';
export function SongActions({ track, liked, canRemove, onClose, onRemove, onLike, onShare, onReuse, onRadio }: {
    track: AudioTrack;
    liked: boolean;
    canRemove: boolean;
    onClose: () => void;
    onRemove: () => void;
    onLike: () => void;
    onShare: () => void;
    onReuse: (audio: boolean) => void;
    onRadio: () => void;
}) {
    const tile = (title: string, icon: IconName, onPress: () => void) => <Pressable accessibilityRole="button" key={title} onPress={onPress} style={A.tile}><Icon name={icon} size={24} color={liked && title === 'Unlike' ? C.primary : C.ink}/><Label style={A.tileText}>{title}</Label></Pressable>;
    const C = useSurfaceColors();
    const A = styles(C);
    return <Sheet compact onClose={onClose}>
    <View style={A.summary}>{track.cover && <Image source={track.cover} style={A.cover}/>}<View style={{ flex: 1 }}><Label style={{ fontSize: 16 }}>{track.title}</Label><Label style={{ color: C.muted }}>by {track.artist || 'Demo listener'}</Label></View></View>
    <View style={A.tiles}>{canRemove && tile('Remove from Playlist', 'minus', onRemove)}{tile(liked ? 'Unlike' : 'Like', 'thumb-up', onLike)}{tile('Share Song', 'share-variant-outline', onShare)}</View>
    <View style={A.group}><Pressable accessibilityRole="button" onPress={() => onReuse(true)} style={A.row}><Icon name="autorenew"/><Label>Remix</Label></Pressable><Pressable accessibilityRole="button" onPress={() => onReuse(false)} style={A.row}><Icon name="text-box-plus-outline"/><Label>Reuse Styles and Lyrics</Label></Pressable></View>
    <View style={A.group}><Pressable accessibilityRole="button" onPress={onRadio} style={A.row}><Icon name="radio-tower"/><Label>Start Song Radio</Label></Pressable></View>
    <Label style={A.disclosure}>Local example music · No Suno service connection</Label>
  </Sheet>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    summary: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
    cover: { width: 60, height: 60, borderRadius: 12 },
    tiles: { flexDirection: 'row', gap: 12, margin: 12, marginTop: 0 },
    tile: { flex: 1, minHeight: 84, borderRadius: 12, backgroundColor: C.surface === '#101012' ? C.control : '#10101206', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12 },
    tileText: { textAlign: 'center', fontSize: 12, lineHeight: 17 },
    group: { marginHorizontal: 12, marginBottom: 12, borderRadius: 12, backgroundColor: C.surface === '#101012' ? C.control : '#10101206' },
    row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
    disclosure: { marginHorizontal: 16, marginBottom: 12, fontSize: 11, color: C.muted },
});
