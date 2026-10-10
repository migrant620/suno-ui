import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PublicVoice } from './voiceData';
import { IconButton, Label } from './ui';
import { useTheme } from './Theme';
export function VoiceAttachment({ voice, onRemove }: {
    voice: PublicVoice;
    onRemove: () => void;
}) {
    const { colors } = useTheme();
    return <View accessibilityLabel={`Selected Voice ${voice.name}`} style={[S.attachment, { borderColor: colors.border }]}>
    <Image source={require('../assets/voice-public-hero.png')} style={S.art} accessible={false}/>
    <Label numberOfLines={1} style={[S.name, { color: colors.ink }]}>{voice.name}</Label>
    {voice.trial && <View style={S.trial}><Label style={S.trialText}>Trial</Label></View>}
    <IconButton name="close" label={`Remove Voice ${voice.name}`} color={colors.muted} onPress={onRemove} style={{ width: 40, height: 48 }} size={20}/>
  </View>;
}
const S = StyleSheet.create({ attachment: { height: 64, borderWidth: 1, borderRadius: 24, paddingLeft: 16, paddingRight: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }, art: { width: 32, height: 32 }, name: { flex: 1, fontSize: 18, lineHeight: 24 }, trial: { backgroundColor: '#10101208', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 }, trialText: { fontSize: 12, lineHeight: 16, color: '#8A878C' } });
