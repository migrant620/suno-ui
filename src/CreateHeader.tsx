import React, { useId } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Icon, Label } from './ui';
import { useSurfaceColors } from './Theme';
import { useCreditPromotion } from './useCreditPromotion';

export function CreateHeader({ mode, model, freePlan, promotion, onMode, onModel, onOffer, modelOpen }: {
  mode: 'Simple' | 'Advanced'; model: string; freePlan: boolean; modelOpen: boolean;
  promotion: ReturnType<typeof useCreditPromotion>; onMode: () => void; onModel: () => void; onOffer: () => void;
}) {
  const colors = useSurfaceColors(); const { width } = useWindowDimensions();
  const gradient = useId().replace(/:/g, '');
  const banner = freePlan && (promotion.active || promotion.error);
  return <View style={[H.header, { height: banner ? 112 : 80 }]}>
    <View style={[H.row, width < 360 && { paddingRight: 36 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Switch creation mode" onPress={onMode} style={H.mode}><Label style={H.modeText}>{mode}</Label><Icon name="chevron-down" size={20} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Select model" onPress={onModel} style={H.model}>
        {banner ? <Svg pointerEvents="none" accessible={false} aria-hidden width={93} height={48} viewBox="0 0 93 48" style={StyleSheet.absoluteFill}>
          <Defs><LinearGradient id={gradient} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0" stopColor="#FF2997" /><Stop offset="0.5" stopColor="#FF176C" /><Stop offset="0.8" stopColor="#FF7800" /><Stop offset="1" stopColor="#FFB000" /></LinearGradient></Defs>
          <Rect x={0.75} y={0.75} width={91.5} height={46.5} rx={23.25} fill="none" stroke={`url(#${gradient})`} strokeWidth={1.5} />
        </Svg> : <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill, H.modelBorder, { borderColor: colors.surface === '#101012' ? '#F7F4EF26' : '#1010121A' }]} />}
        <Label numberOfLines={1} style={H.modelText}>{model}</Label><Icon name={modelOpen ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>
    </View>
    {freePlan && promotion.error ? <Pressable accessibilityRole="button" accessibilityLabel={promotion.invalid ? 'Reset demo offer timer' : 'Retry offer timer'} accessibilityState={{ disabled: promotion.loading }} disabled={promotion.loading} onPress={promotion.retry} style={H.promotion}><Label style={{ color: colors.muted, fontSize: 12 }}>{promotion.invalid ? 'Offer timer unavailable. Reset demo offer.' : 'Offer timer unavailable. Tap to retry.'}</Label></Pressable>
      : freePlan && promotion.active ? <Pressable accessibilityRole="button" accessibilityLabel="Upgrade for credit-free songs" accessibilityHint="Local demo offer. No purchase or Suno benefits are granted." onPress={onOffer} style={H.promotion}>
        <Label style={[H.offerTitle, { fontSize: width < 360 ? 11 : 12 }]}>UPGRADE FOR CREDIT-FREE SONGS</Label>
        <Label accessibilityLabel="Demo offer time remaining" style={[H.timer, { color: colors.muted }]}><Label style={{ fontSize: 9, color: colors.muted }}>Demo · </Label>{promotion.label}</Label>
      </Pressable> : null}
  </View>;
}
const H = StyleSheet.create({
  header: { marginHorizontal: 16, zIndex: 1 },
  row: { height: 64, alignItems: 'center', justifyContent: 'center' },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 0, height: 48 },  
  modeText: { fontFamily: 'RobotoMedium', fontSize: 18.5, lineHeight: 22 },  
  model: { position: 'absolute', top: 8, right: 0, width: 93, height: 48, paddingLeft: 16, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 0 },
  modelBorder: { borderWidth: 1, borderRadius: 24 },
  modelText: { fontFamily: 'RobotoRegular', fontSize: 13, lineHeight: 15, flexShrink: 0 },  
  promotion: { position: 'absolute', top: 56, left: 0, right: 0, minHeight: 36, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' },
  offerTitle: { color: '#E88725', fontFamily: 'RobotoBold', lineHeight: 16, flexShrink: 1 },
  timer: { fontFamily: 'RobotoBold', fontSize: 12, lineHeight: 16 },
});
