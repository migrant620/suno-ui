import React from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSurfaceColors } from './Theme';
import { MusicModel } from './useDemoEntitlements';
import { Icon, Label } from './ui';

const models: { name: MusicModel; description: string }[] = [
  { name: 'v6', description: 'Powerful. Versatile. Refined. Our best model yet.' },
  { name: 'v6-wild', description: 'Best for experimental ideas.' },
  { name: 'v6-mini', description: 'A free, more efficient version of premium v6 models.' },
];
export function CreateModelMenu({ model, onSelect, onClose }: { model: MusicModel; onSelect: (model: MusicModel) => void; onClose: () => void }) {
  const colors = useSurfaceColors(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const dark = colors.surface === '#101012';
  return <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={M.outer}><Pressable accessibilityRole="button" accessibilityLabel="Dismiss creation model menu" onPress={onClose} style={StyleSheet.absoluteFill} /><View pointerEvents="box-none" style={M.frame}>
      <View accessibilityLabel="Creation models" style={[M.menu, { top: insets.top + 52, width: Math.min(300, width - 32), backgroundColor: dark ? colors.toolbar : '#E0DEDA' }]}>
        {models.map(item => <Pressable key={item.name} accessibilityRole="radio" accessibilityLabel={`Choose creation model ${item.name}`} accessibilityState={{ checked: model === item.name }} aria-checked={model === item.name} onPress={() => onSelect(item.name)} style={[M.row, item.name === model && { backgroundColor: dark ? '#FFFFFF0A' : '#DAD8D3' }]}>
          <View style={{ flex: 1 }}><View style={M.titleRow}><Label style={M.name}>{item.name}</Label>{item.name !== 'v6-mini' && <Label style={[M.pro, { backgroundColor: colors.surface }]}>Pro</Label>}</View><Label style={[M.description, { color: colors.secondary }]}>{item.description}</Label></View>
          {item.name === model && <Icon name="check" size={20} />}
        </Pressable>)}
      </View>
    </View></View>
  </Modal>;
}
const M = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' }, frame: { flex: 1, width: '100%', maxWidth: 480 },
  menu: { position: 'absolute', right: 16, borderRadius: 8, paddingVertical: 8, overflow: 'hidden', boxShadow: '0px 3px 7px #00000033' },
  row: { minHeight: 65.5, paddingHorizontal: 12, paddingVertical: 10.5, flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#FF399C', fontSize: 14, lineHeight: 20 },
  pro: { fontSize: 12, lineHeight: 18, paddingHorizontal: 6, borderRadius: 99 },
  description: { fontSize: 12, lineHeight: 18, marginTop: 2 },
});
