import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Label } from './ui';
import { LocalComment } from './useCommunity';

export function CommentReplyPreview({ comment, onCancel, disabled = false }: { comment: LocalComment; onCancel: () => void; disabled?: boolean }) {
  return <View testID="comment-reply-preview" style={S.row}>
    <View style={S.preview}>
      <Label numberOfLines={1} ellipsizeMode="tail" style={S.author}>Reply to {comment.author}</Label>
      <Label testID="comment-reply-quote" accessibilityLabel="Replied comment preview" numberOfLines={1} ellipsizeMode="tail" style={S.quote}>{comment.text.replace(/\s+/g, ' ').trim()}</Label>
    </View>
    <IconButton name="close" disabled={disabled} label="Cancel comment reply" onPress={onCancel} color="#C2C2C1" size={24} style={{ width: 44, height: 48 }} />
  </View>;
}
const S = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 48, paddingLeft: 8 },
  preview: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 4 },
  author: { color: '#F7F4EF', fontSize: 16, lineHeight: 20, flexShrink: 1, maxWidth: '65%' },
  quote: { color: '#C2C2C1', fontSize: 16, lineHeight: 20, flex: 1, minWidth: 0 },
});
