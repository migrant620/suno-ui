import { useSheetEscape } from './useSheetEscape';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextProps, View, ViewStyle, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import Undo2 from 'lucide-react-native/icons/undo-2';
import Redo2 from 'lucide-react-native/icons/redo-2';
import Library from 'lucide-react-native/icons/library';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from './tokens';
import { useSurfaceColors } from './Theme';

export const C = tokens.colors;
export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
export function Label({ style, ...props }: TextProps) {
  const colors = useSurfaceColors();
  return <Text {...props} style={[S.text, { color: colors.ink }, style]} />;
}
export function Icon({ name, size = 24, color: suppliedColor }: { name: IconName; size?: number; color?: string }) {
  const colors = useSurfaceColors(); const color = suppliedColor || colors.ink;
  const Vector = name === 'undo' ? Undo2 : name === 'redo' ? Redo2 : name === 'bookshelf' ? Library : null;
  if (Vector) return <View accessible={false} aria-hidden importantForAccessibility="no-hide-descendants"><Vector size={size} color={color} strokeWidth={2.5} /></View>;
  if (name === 'delete') return <Ionicons name="trash" size={size} color={color} accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" />;
  if (name === 'thumb-up') return <MaterialIcons name="thumb-up-alt" size={size} color={color} accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" />;
  return <MaterialCommunityIcons name={name} size={size} color={color} accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
export function IconButton({ name, label, onPress, disabled, color, style, size = 24, circle }: {
  name: IconName; label: string; onPress: () => void; disabled?: boolean; color?: string; style?: ViewStyle; size?: number; circle?: string;
}) {
  
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [S.iconButton, style, pressed && { opacity: 0.55 }]}>
    {!!circle && <View pointerEvents="none" style={[S.disc, { backgroundColor: circle }]} />}
    <Icon name={name} size={size} color={disabled ? C.disabled : color} />
  </Pressable>;
}
export function Pill({ title, icon, onPress, active, onRemove }: {
  title: string; icon?: IconName; onPress: () => void; active?: boolean; onRemove?: () => void;
}) {
  const C = useSurfaceColors();
  
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={S.pillTarget}>
    <View style={[S.pill, active ? { backgroundColor: C.surface === '#101012' ? '#FFFFFF0D' : '#1010120A' } : { ...S.pillEmpty, borderColor: C.surface === '#101012' ? '#F7F4EF26' : C.border }]}>
      <View style={S.pillContent}>
        {icon && <Icon name={icon} size={20} color={active ? C.blue : C.disabled} />}
        <Label style={S.pillText}>{title}</Label>
      </View>
      {active && onRemove && <IconButton name="close" label={`Remove ${title}`} onPress={onRemove} style={{ width: 28, height: 40 }} color={C.disabled} />}
    </View>
  </Pressable>;
}
export function Accent({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <LinearGradient colors={[C.primary, '#FF176C', C.orange, '#FFB000']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[{ overflow: 'hidden' }, style]}>{children}</LinearGradient>;
}
export function Sheet({ children, onClose, compact = false, onShow, backgroundColor, backdrop, keyboardAvoiding = false, handleColor, handleHeight, handlePaddingTop }: { children: React.ReactNode; onClose: () => void; compact?: boolean; onShow?: () => void; backgroundColor?: string; backdrop?: React.ReactNode; keyboardAvoiding?: boolean; handleColor?: string; handleHeight?: number; handlePaddingTop?: number }) {
  const sheetRoot = React.useRef<View>(null);
  useSheetEscape(onClose, sheetRoot);
  const { width } = useWindowDimensions();
  const colors = useSurfaceColors();
  return <Modal transparent visible animationType="slide" onRequestClose={onClose} onShow={onShow} hardwareAccelerated={!!backdrop} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : keyboardAvoiding ? 'height' : undefined} style={S.modalOuter}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close sheet" onPress={onClose} />
      <View ref={sheetRoot} style={[S.sheet, { width: Math.min(width, 480), backgroundColor: backgroundColor || colors.surface }, compact ? { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', minHeight: 180 } : { flex: 1 }]}>
        {backdrop && <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>{backdrop}</View>}
        <View style={[S.handleArea, handleHeight ? { height: handleHeight } : undefined]}><Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close sheet" style={[S.handleTarget, handlePaddingTop !== undefined ? { paddingTop: handlePaddingTop } : undefined]}><View accessibilityLabel="Drag handle" style={[S.handle, { backgroundColor: handleColor || colors.handle }]} /></Pressable></View>
        {children}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
export const S = StyleSheet.create({
  text: { fontFamily: 'RobotoRegular', fontSize: tokens.typography.body.fontSize, lineHeight: 21, color: C.ink, includeFontPadding: false },
  heading: { fontFamily: 'RobotoRegular', fontSize: tokens.typography.heading.fontSize, lineHeight: 34, letterSpacing: 0.7 },  
  sectionHeading: { fontFamily: 'RobotoMedium', fontSize: tokens.typography.section.fontSize, lineHeight: 30 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  disc: { position: 'absolute', width: 40, height: 40, borderRadius: 999 },
  pillTarget: { height: 48, justifyContent: 'center' },
  pill: { borderRadius: 999, flexDirection: 'row', alignItems: 'center', height: 40 },
  pillEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: C.border },
  pillActive: { backgroundColor: '#1010120A' },
  pillContent: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 11, paddingRight: 19, height: 40 },  // 1dp dashed border sits outside: 12/20 from the pill edge
  pillText: { fontFamily: 'RobotoMedium', fontSize: 14, lineHeight: 17 },
  modalOuter: { flex: 1, backgroundColor: '#00000040', alignItems: 'center', justifyContent: 'flex-end', paddingTop: Platform.OS === 'web' ? 0 : 49 },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: tokens.rounded.sheet, borderTopRightRadius: tokens.rounded.sheet, overflow: 'hidden', paddingBottom: Platform.OS === 'ios' ? 24 : 0 },
  handleArea: { height: 52, alignItems: 'center' },
  handleTarget: { width: 48, height: 48, alignItems: 'center', paddingTop: 22 },  
  handle: { width: 32, height: 4, backgroundColor: C.handle, borderRadius: 2 },
});
