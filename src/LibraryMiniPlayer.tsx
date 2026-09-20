import { ThemeColors, useSurfaceColors } from './Theme';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useLibraryPlayback } from './useLibraryPlayback';
import { C, Icon, IconButton, Label } from './ui';
export function LibraryMiniPlayer({ player, onOpen }: {
    player: ReturnType<typeof useLibraryPlayback>;
    onOpen: () => void;
}) {
    const C = useSurfaceColors();
    const M = styles(C);
    if (!player.track)
        return null;
    return <View style={M.outer}>
    <View style={M.row}><Pressable accessibilityRole="button" accessibilityLabel="Open song player" onPress={onOpen} style={M.song}>
      {player.track.cover ? <Image source={player.track.cover} style={M.cover}/> : <View style={M.cover}><Icon name="music-note"/></View>}
      <View style={{ flex: 1 }}><Label numberOfLines={1}>{player.track.title}</Label><Label numberOfLines={1} style={{ color: C.muted }}>{player.track.artist || 'Demo listener'}</Label></View>
    </Pressable><IconButton name={player.status.playing ? 'pause' : 'play'} label={player.status.playing ? 'Pause library player' : 'Play library player'} onPress={() => void player.toggle()} style={{ width: 40, height: 56 }}/><IconButton name="skip-next" label="Next song" onPress={() => player.next()} disabled={!player.canNext} style={{ width: 40, height: 56 }}/></View>
    <View style={M.progress}><View style={{ width: `${player.duration ? player.current / player.duration * 100 : 0}%`, height: '100%', backgroundColor: C.muted }}/></View>
    {!!(player.error || player.status.error) && <Label accessibilityLiveRegion="polite" style={M.error}>{player.error || 'This song could not load. Try playing it again.'}</Label>}
  </View>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    outer: { backgroundColor: C.surface === '#101012' ? C.control : '#EDEAE6', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' },
    row: { minHeight: 70, paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    song: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
    cover: { width: 56, height: 56, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    progress: { height: 4, backgroundColor: C.divider },
    error: { paddingHorizontal: 16, paddingVertical: 4, fontSize: 12, color: C.primary },
});
