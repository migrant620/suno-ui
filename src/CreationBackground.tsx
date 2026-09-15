import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';

export function CreationBackground({ reduceMotion: localReduceMotion = false, dark = false }: { reduceMotion?: boolean; dark?: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const update = (reduceMotion: boolean) => {
      animation?.stop();
      progress.setValue(0);
      if (!reduceMotion && !localReduceMotion && active) {
        animation = Animated.loop(Animated.sequence([
          Animated.timing(progress, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(progress, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        ]));
        animation.start();
      }
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) update(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => { active = false; animation?.stop(); subscription.remove(); };
  }, [progress, localReduceMotion]);
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <Animated.View style={{
      position: 'absolute', width: '120%', height: '120%', top: '-10%', left: '-10%',
      transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, -16] }) }],
    }}>
      {dark ? <>
        <LinearGradient colors={['#42261E', '#482E24', '#35252B', '#211A2C']} locations={[0, 0.22, 0.55, 1]} start={{ x: 0, y: 0.45 }} end={{ x: 1, y: 0.55 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['#10101200', '#10101200', '#10101266', '#101012']} locations={[0, 0.45, 0.86, 1]} style={StyleSheet.absoluteFill} />
      </> : <Image source={require('../assets/creation-aura.png')} resizeMode="cover" style={{ width: '100%', height: '100%' }} />}
    </Animated.View>
  </View>;
}
