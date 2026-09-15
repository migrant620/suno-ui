import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { IconButton, Label } from './ui';
import { useSurfaceColors } from './Theme';
import { MediaDraft, MediaPreview } from './mediaTypes';
export function MediaChip({ draft, preview, busy, onReplace, onRemove }: { draft: MediaDraft; preview: MediaPreview['source']; busy: boolean; onReplace: () => void; onRemove: () => void }) {
  const colors = useSurfaceColors(); const title = draft.kind === 'images' ? 'Image' : 'Video';
  return <View testID="media-attachment" style={[S.chip, { backgroundColor: colors.surface === '#101012' ? '#FFFFFF0D' : '#1010120A' }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Replace ${title}`} accessibilityHint={draft.name} disabled={busy} onPress={onReplace} style={S.content}>
      {preview && <Image accessibilityLabel={`${title} thumbnail`} source={preview} style={S.thumbnail} contentFit="cover" transition={0} />}
      <Label style={S.title}>{title}</Label>
    </Pressable>
    <IconButton name="close" label={`Remove ${title}`} disabled={busy} onPress={onRemove} style={S.remove} color={colors.disabled} size={16} />
  </View>;
}
const S = StyleSheet.create({ chip: { height: 40, borderRadius: 99, flexDirection: 'row', alignItems: 'center' }, content: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 }, thumbnail: { width: 32, height: 32, borderRadius: 8 }, title: { fontSize: 14, lineHeight: 20 }, remove: { width: 44, height: 40 } });
