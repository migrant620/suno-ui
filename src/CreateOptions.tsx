import React, { useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon, Label, Sheet } from './ui';
import { useSurfaceColors } from './Theme';
export function CreateOptions({ gender, title, onGender, onTitle, onClose }: {
    gender?: 'Male' | 'Female' | null;
    title: string;
    onGender: (value: 'Male' | 'Female') => void;
    onTitle: (value: string) => void;
    onClose: () => void;
}) {
    const colors = useSurfaceColors();
    const [info, setInfo] = useState(false);
    const close = () => { Keyboard.dismiss(); onClose(); };
    const control = colors.surface === '#101012' ? '#FFFFFF0A' : '#1010120A';
    return <Sheet compact keyboardAvoiding onClose={close} backgroundColor={colors.toolbar} handleHeight={64}>
    <View testID="create-options" style={S.content}>
      <View style={[S.row, { backgroundColor: control }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change the gender of the generated vocals" accessibilityState={{ expanded: info }} aria-expanded={info} onPress={() => setInfo(value => !value)} style={S.caption}>
          <Label style={S.text}>Vocal Gender</Label><Icon name="information" size={14} color={colors.muted}/>
        </Pressable>
        <View accessibilityRole="radiogroup" accessibilityLabel="Vocal Gender" style={S.choices}>
          {(['Male', 'Female'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={value} accessibilityState={{ checked: gender === value }} aria-checked={gender === value} onPress={() => onGender(value)} style={S.option}>
            <View style={[S.selection, gender === value && { backgroundColor: colors.surface === '#101012' ? '#FFFFFF30' : '#10101240' }]}><Label style={[S.text, { color: gender === value ? colors.ink : colors.disabled }]}>{value}</Label></View>
          </Pressable>)}
        </View>
      </View>
      {info && <Label accessibilityRole="text" style={{ fontSize: 13, lineHeight: 18, color: colors.muted }}>Change the gender of the generated vocals. In this local demo, the prerecorded example keeps its original vocals.</Label>}
      <View style={[S.row, S.titleRow, { backgroundColor: control }]}><Icon name="music-note" size={16} color={colors.handle}/><TextInput accessibilityLabel="Song Title" placeholder="Song Title" placeholderTextColor={colors.muted} value={title} onChangeText={onTitle} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={[S.input, { color: colors.ink }]}/></View>
    </View>
  </Sheet>;
}
const S = StyleSheet.create({
    content: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
    row: { minHeight: 56, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
    caption: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0, minHeight: 48 },
    choices: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end', gap: 14 },
    option: { minHeight: 48, justifyContent: 'center' },
    selection: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    text: { fontSize: 14, lineHeight: 20 },
    titleRow: { gap: 8 },
    input: { flex: 1, height: 56, fontFamily: 'RobotoRegular', fontSize: 14, padding: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
});
