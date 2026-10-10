import { ThemeColors, useSurfaceColors } from './Theme';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AudioTrack, clockTime } from './audioData';
import { C, Icon, IconButton, Label } from './ui';
export function SongRow({ track, playing, onPress, onOptions, variant }: {
    track: AudioTrack;
    playing: boolean;
    onPress: () => void;
    onOptions: () => void;
    variant?: 'search';
}) {
    const C = useSurfaceColors();
    const R = styles(C);
    return <View style={[R.row, variant === 'search' && { minHeight: 76 }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${playing ? 'Pause' : 'Play'} ${track.title}`} onPress={onPress} style={[R.song, variant === 'search' && { minHeight: 76 }]}>
      <View style={R.cover}>{track.cover ? <Image source={track.cover} style={R.image}/> : <Icon name="music-note"/>}
        <Label style={R.duration}>{clockTime(track.duration || 0).replace(/^0/, '')}</Label>
      </View>
      <View style={{ flex: 1 }}>
        <View style={R.titleRow}>{playing && <Icon name="waveform" size={14} color={C.primary}/>}<Label numberOfLines={1} style={[R.title, playing && { color: C.primary }]}>{track.title}</Label>{!!track.model && <Label style={R.model}>{track.model}</Label>}</View>
        <View style={R.titleRow}><Icon name="play" size={14} color={C.muted}/><Label numberOfLines={1} style={R.metadata}>{track.plays || 0} · {track.artist || 'Your audio'}</Label></View>
      </View>
    </Pressable>
    <IconButton name="dots-vertical" label={`Options for ${track.title}`} onPress={onOptions} size={24} style={{ width: 32, height: 48 }}/>
  </View>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingHorizontal: 16 },
    song: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72 },
    cover: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: C.toolbar },
    image: { width: 56, height: 56 },
    duration: { position: 'absolute', right: 4, bottom: 4, borderRadius: 99, paddingHorizontal: 4, color: C.white, backgroundColor: '#10101299', fontSize: 12, lineHeight: 18 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    title: { fontSize: 14, flexShrink: 1 },
    model: { fontSize: 10, color: '#96959B', marginLeft: 3 },
    metadata: { fontSize: 14, color: C.muted, flexShrink: 1 },
});
