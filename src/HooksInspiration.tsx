import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Label } from './ui';
function dailyCountdown() {
    const now = Date.now();
    const left = Math.ceil((86400000 - now % 86400000) / 1000);
    return [Math.floor(left / 3600), Math.floor(left % 3600 / 60), left % 60].map(value => String(value).padStart(2, '0')).join(':');
}
export function HooksInspiration({ onSelect, scrollOffsets }: {
    onSelect: (kind: 'photo' | 'bedtime' | 'love') => void;
    scrollOffsets: React.MutableRefObject<Record<string, number>>;
}) {
    const scroll = useRef<ScrollView>(null);
    const [countdown, setCountdown] = useState(dailyCountdown);
    const rotation = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const timer = setInterval(() => setCountdown(dailyCountdown()), 1000);
        const motion = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true }));
        motion.start();
        return () => { clearInterval(timer); motion.stop(); };
    }, [rotation]);
    return <View style={S.section}>
    <Label style={S.heading}>Get Inspired</Label>
    <ScrollView ref={scroll} horizontal testID="hooks-inspiration" showsHorizontalScrollIndicator={false} contentContainerStyle={S.cards} onContentSizeChange={() => scroll.current?.scrollTo({ x: scrollOffsets.current.inspiration || 0, animated: false })} onScroll={event => { scrollOffsets.current.inspiration = event.nativeEvent.contentOffset.x; }} scrollEventThrottle={100}>
      <Pressable accessibilityRole="button" accessibilityLabel="Turn any photo into a song" onPress={() => onSelect('photo')} style={S.card}>
        <Animated.View pointerEvents="none" style={[S.borderMotion, { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}><LinearGradient colors={['#FF399C', '#FF7900', '#FF7900', '#19191B', '#19191B']} style={StyleSheet.absoluteFill}/></Animated.View>
        <View style={S.photoInner}><Image source={require('../assets/inspiration-love.png')} blurRadius={25} style={S.image}/><LinearGradient colors={['#19120B55', '#000000DD']} style={StyleSheet.absoluteFill}/></View>
        <View style={S.photoText}><Label style={S.newFeature}>New Feature</Label><Label style={S.title}>Turn any photo into a song</Label></View>
        <View style={S.countdown}><Label accessibilityLabel={`Local daily demo countdown ${countdown}`} style={S.clock}>{countdown}</Label></View><View accessibilityLabel="Photo to song" style={[S.icon, S.iconInset]}><Icon name="camera" color="#FFFFFF" size={22}/></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Wind down with a bedtime song" onPress={() => onSelect('bedtime')} style={S.card}>
        <Image source={require('../assets/inspiration-bedtime.png')} style={S.image}/><LinearGradient colors={['#00000044', 'transparent', '#00000033']} style={StyleSheet.absoluteFill}/><Label style={[S.title, S.regularText]}>Wind down with a bedtime song</Label><View accessibilityLabel="Audio to song" style={S.icon}><Icon name="microphone" color="#FFFFFF" size={24}/></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Send your partner a daily love song" onPress={() => onSelect('love')} style={S.card}>
        <Image source={require('../assets/inspiration-love.png')} style={S.image}/><LinearGradient colors={['#00000044', 'transparent', '#00000033']} style={StyleSheet.absoluteFill}/><Label style={[S.title, S.regularText]}>Send your partner a daily love song</Label><View accessibilityLabel="Photo to song" style={S.icon}><Icon name="camera" color="#FFFFFF" size={22}/></View>
      </Pressable>
    </ScrollView>
  </View>;
}
const S = StyleSheet.create({
    section: { flexShrink: 0 }, heading: { fontSize: 18, lineHeight: 24, color: '#F7F4EF', marginHorizontal: 16, marginTop: 11, marginBottom: 7, fontFamily: 'RobotoMedium' },
    cards: { paddingHorizontal: 16, gap: 12 }, card: { width: 150, height: 150, borderRadius: 12, overflow: 'hidden', backgroundColor: '#19191B' },
    image: { position: 'absolute', width: '100%', height: '100%' }, borderMotion: { position: 'absolute', width: 214, height: 214, left: -32, top: -32 }, photoInner: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderRadius: 10, overflow: 'hidden' },
    photoText: { position: 'absolute', top: 12, left: 14, right: 12 }, newFeature: { color: '#FF399C', fontSize: 12, lineHeight: 16, letterSpacing: 0.2, fontFamily: 'RobotoMedium' }, title: { color: '#FFFFFF', fontSize: 14, lineHeight: 20, fontFamily: 'RobotoMedium' }, regularText: { margin: 10 },
    iconInset: { right: 14, bottom: 14 },
    icon: { position: 'absolute', width: 34, height: 34, right: 10, bottom: 10, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: '#FFFFFF66', alignItems: 'center', justifyContent: 'center' },
    countdown: { position: 'absolute', left: 13, bottom: 16, backgroundColor: '#00000066', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 99 }, clock: { fontSize: 11, lineHeight: 12, fontFamily: 'RobotoBold', fontVariant: ['tabular-nums'], color: '#FF486B', letterSpacing: 2 },
});
