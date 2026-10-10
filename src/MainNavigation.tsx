import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Search from 'lucide-react-native/icons/search';
import Square from 'lucide-react-native/icons/square';
import Play from 'lucide-react-native/icons/play';
import Pause from 'lucide-react-native/icons/pause';
import { AudioTrack } from './audioData';
import Library from 'lucide-react-native/icons/library';
import Sparkle from 'lucide-react-native/icons/sparkle';
import { Ionicons } from './ui';
type Tab = 'hooks' | 'search' | 'create' | 'library' | 'profile';
const tabs: {
    id: Tab;
    label: string;
}[] = [
    { id: 'hooks', label: 'Hooks Feed' }, { id: 'search', label: 'Search' },
    { id: 'create', label: 'Create Music' }, { id: 'library', label: 'Library' },
    { id: 'profile', label: 'Profile' },
];
export function MainNavigation({ tab, dark, avatarUri, onSelect, playback }: {
    tab: Tab;
    dark: boolean;
    avatarUri?: string;
    onSelect: (tab: Tab) => void;
    playback?: {
        track: AudioTrack;
        playing: boolean;
        onOpen: () => void;
        onToggle: () => void;
    };
}) {
    const surface = dark ? '#101012' : '#F7F4EF';
    const selectedFill = dark ? '#28282A' : '#9F9D9B';
    const compact = tab === 'create' && playback;
    return <View accessibilityLabel="Main navigation" testID="main-navigation" style={[styles.bar, { backgroundColor: surface }]}>
    {tabs.map(({ id, label }) => {
            const selected = tab === id;
            if (id === 'create' && compact)
                return <View key={id} testID="navigation-compact-player" style={styles.compactSlot}>
        <View testID="navigation-compact-player-pill" pointerEvents="none" style={[styles.compactPill, { backgroundColor: dark ? '#28282A' : '#EDEAE6' }]}/>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open the player, ${compact.track.title}`} onPress={compact.onOpen} style={({ pressed }) => [styles.coverTarget, pressed && { opacity: 0.55 }]}>
          {compact.track.cover ? <Image source={compact.track.cover} style={styles.compactCover}/> : <Ionicons name="musical-notes" size={26} color={dark ? '#F7F4EF' : '#101012'}/>}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={compact.playing ? 'Pause library player' : 'Play library player'} onPress={compact.onToggle} style={({ pressed }) => [styles.transportTarget, pressed && { opacity: 0.55 }]}>
          {compact.playing ? <Pause size={24} fill={dark ? '#F7F4EF' : '#101012'} color={dark ? '#F7F4EF' : '#101012'}/> : <Play size={24} fill={dark ? '#F7F4EF' : '#101012'} color={dark ? '#F7F4EF' : '#101012'}/>}
        </Pressable>
      </View>;
            const color = selected ? (dark ? '#F7F4EF' : '#101012') : (dark ? '#6A6A72' : '#A3A3A3');
            const backgroundColor = selected ? selectedFill : surface;
            return <View key={id} style={[styles.slot, !!compact && { width: 68 }]}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} aria-pressed={selected} onPress={() => onSelect(id)} style={({ pressed }) => [styles.target, id === 'create' && styles.createTarget, pressed && { opacity: 0.55 }]}>
        <View testID={`navigation-pill-${id}`} pointerEvents="none" style={[styles.pill, { backgroundColor }]}>
          <View accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" style={styles.glyph}>
            {id === 'hooks' && <><Square size={28} strokeWidth={2.3} color={color}/><Play size={11} strokeWidth={2} color={color} fill={color} style={styles.play}/></>}
            {id === 'search' && <Search size={28} strokeWidth={2.2} color={color}/>}
            {id === 'create' && <><Ionicons name="musical-notes" size={26} color={color} style={styles.notes}/><View style={[styles.sparkle, { backgroundColor }]}><Sparkle size={18} strokeWidth={0} fill={color} color={color}/></View></>}
            {id === 'library' && <Library size={28} strokeWidth={2.2} color={color}/>}
            {id === 'profile' && <Image source={avatarUri ? { uri: avatarUri } : require('../assets/demo-avatar.png')} style={styles.avatar}/>}
          </View>
        </View>
      </Pressable></View>;
        })}
  </View>;
}
const styles = StyleSheet.create({
    compactSlot: { width: 96, marginHorizontal: -4, height: 48, flexDirection: 'row', alignItems: 'center' },
    compactPill: { position: 'absolute', left: 4, right: 4, top: 4, bottom: 4, borderRadius: 99 },
    coverTarget: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
    transportTarget: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    compactCover: { width: 32, height: 32, borderRadius: 99, transform: [{ translateX: 4 }] },
    bar: { height: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    slot: { width: 72, flexShrink: 1, alignItems: 'center', justifyContent: 'center' },
    target: { width: '100%', height: 56, alignItems: 'center', justifyContent: 'center' },
    createTarget: { width: 54, height: 48 },
    pill: { width: 54, height: 40, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
    glyph: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    play: { position: 'absolute', left: 11, top: 10.5 },
    notes: { position: 'absolute', left: 0, top: 7 },
    sparkle: { position: 'absolute', right: 0, top: 0, borderRadius: 99 },
    avatar: { width: 30, height: 30, borderRadius: 99 },
});
