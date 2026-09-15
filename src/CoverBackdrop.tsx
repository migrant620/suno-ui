import React from 'react';
import { Image, ImageSourcePropType, Platform, StyleSheet, View } from 'react-native';

export function CoverBackdrop({ source }: { source?: ImageSourcePropType }) {
  if (!source) return null;
  const viewBlur = Platform.OS === 'web' || (Platform.OS === 'android' && Number(Platform.Version) >= 31);
  return <View testID="cover-backdrop" pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <View style={[StyleSheet.absoluteFill, viewBlur && S.blur]}>
      <Image source={source} resizeMode="cover" blurRadius={viewBlur ? undefined : 9} accessible={false} style={S.image} />
    </View>
    <View style={[StyleSheet.absoluteFill, S.shade]} />
  </View>;
}

const S = StyleSheet.create({
  blur: { filter: 'blur(9px)' },
  image: { width: '100%', height: '100%' },
  shade: { backgroundColor: '#1C1C1FBF' },
});
