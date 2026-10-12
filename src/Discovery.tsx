import React, { useRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { HookCollectionId, hookCollectionCards } from './hookCollections';
import { HooksInspiration } from './HooksInspiration';
import { HookPreview } from './HookPreview';
import { ExampleHook } from './hookData';
import { C, IconButton, Label } from './ui';
export function Discovery({ onInspiration, onCollection, onNotifications, scrollOffsets, clip, active, onOpen, videoPositions }: {
  onInspiration: (kind: 'photo' | 'bedtime' | 'love') => void; onCollection: (id: HookCollectionId) => void; onNotifications: () => void;
  scrollOffsets: React.MutableRefObject<Record<string, number>>; clip: ExampleHook; active: boolean; onOpen: () => void; videoPositions: React.MutableRefObject<Record<string, number>>;
}) {
  const categories = useRef<ScrollView>(null);
  return <View style={D.page}>
    <View style={D.header}><Label style={D.wordmark}>SUNO</Label><IconButton name="bell" label="Notifications" color={C.surface} circle="#1C1C1E" onPress={onNotifications} /></View>
    <HooksInspiration onSelect={onInspiration} scrollOffsets={scrollOffsets} />
    <ScrollView ref={categories} horizontal testID="hooks-categories" showsHorizontalScrollIndicator={false} onContentSizeChange={() => categories.current?.scrollTo({ x: scrollOffsets.current.categories || 0, animated: false })} onScroll={event => { scrollOffsets.current.categories = event.nativeEvent.contentOffset.x; }} scrollEventThrottle={100} style={D.categoryStrip} contentContainerStyle={D.categories}>
      {hookCollectionCards.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => onCollection(item.id)} style={D.category}><Image source={item.image} style={D.smallCover} /><Label style={D.categoryText}>{item.label}</Label></Pressable>)}
    </ScrollView>
    <HookPreview key={clip.id} clip={clip} active={active} onOpen={onOpen} position={videoPositions} />
  </View>;
}
const D = StyleSheet.create({ page: { flex: 1, backgroundColor: '#101012' }, header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, wordmark: { color: C.white, fontSize: 32, lineHeight: 40, fontFamily: 'RobotoBold', letterSpacing: 2 }, round: { backgroundColor: '#1C1C1E', borderRadius: 99, width: 40, height: 40 }, banner: { minHeight: 96, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', padding: 16, gap: 12, flexDirection: 'row', alignItems: 'center' }, bannerTitle: { fontSize: 20, lineHeight: 26, fontFamily: 'RobotoMedium' }, bannerText: { fontSize: 14, lineHeight: 20, color: '#3C333B', marginTop: 4 }, cta: { paddingHorizontal: 18, minHeight: 44, backgroundColor: C.surface, borderRadius: 99, justifyContent: 'center', alignItems: 'center' }, categoryStrip: { flexGrow: 0, flexShrink: 0, height: 72 }, categories: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 }, category: { width: 176, height: 48, backgroundColor: '#19191B', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 }, smallCover: { width: 32, height: 32, borderRadius: 8 }, categoryText: { color: '#FFFFFF', fontSize: 14, flex: 1 }, disclosure: { color: '#AAAAAE', fontSize: 10, lineHeight: 16, paddingHorizontal: 16, marginBottom: 14 }, hook: { height: 510, borderRadius: 24, overflow: 'hidden', marginBottom: 16, backgroundColor: '#202022' }, playSurface: { flex: 1, alignItems: 'center', justifyContent: 'center' }, playIcon: { width: 64, height: 64, backgroundColor: '#00000044', borderRadius: 99, justifyContent: 'center', alignItems: 'center' }, hookInfo: { padding: 20, gap: 12 }, songTitle: { color: C.white, fontSize: 26, lineHeight: 32, fontFamily: 'RobotoBold' }, songStyle: { color: '#DEDEE0', fontSize: 13, lineHeight: 19, marginTop: 4 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, artist: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 } });
