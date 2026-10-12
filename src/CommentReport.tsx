import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Storage from './accountStorage';
import { LocalComment } from './useCommunity';
import { Icon, Label, Sheet } from './ui';
import { useSheetEscape } from './useSheetEscape';

export const COMMENT_REPORTS_KEY = 'suno-ui:comment-reports:v1';

export function CommentOptionsMenu({ anchor, onClose, onReport }: { anchor: React.RefObject<View | null>; onClose: () => void; onReport: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const root = useRef<View>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  useSheetEscape(onClose, root);
  useEffect(() => {
    let active = true;
    anchor.current?.measureInWindow((x, y, w, h) => {
      if (active) setPosition({ left: Math.max(8, Math.min(x + w - 12 - 112, width - 120)), top: Math.max(insets.top, Math.min(y + h / 2 + 11, height - insets.bottom - 72)) });
    });
    return () => { active = false; };
  }, [anchor, width, height, insets.top, insets.bottom]);
  return <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={StyleSheet.absoluteFill}><Pressable accessibilityRole="button" accessibilityLabel="Dismiss comment options" onPress={onClose} style={StyleSheet.absoluteFill} />
      {position && <View ref={root} testID="comment-options-menu" style={[S.menu, position]}><Pressable accessibilityRole="button" accessibilityLabel="Report comment" onPress={onReport} style={({ pressed }) => [S.report, pressed && { opacity: 0.6 }]}><Icon name="flag" size={24} color="#FD429C" /><Label style={S.reportText}>Report</Label></Pressable></View>}
    </View>
  </Modal>;
}

export function CommentReport({ comment, onClose, onSaved }: { comment: LocalComment; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const working = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const close = () => { active.current = false; onClose(); };
  const save = async () => {
    if (working.current) return;
    working.current = true; setBusy(true); setError('');
    try {
      await Storage.updateItem(COMMENT_REPORTS_KEY, raw => {
        if (!active.current) throw new Error('Cancelled');
        const data = raw ? JSON.parse(raw) : { version: 1, reports: [] };
        if (data?.version !== 1 || !Array.isArray(data.reports) || !data.reports.every((item: any) => item && typeof item.commentId === 'string' && typeof item.trackId === 'string' && Number.isFinite(item.createdAt))) throw new Error('Invalid reports');
        if (!data.reports.some((item: any) => item.commentId === comment.id && item.trackId === comment.trackId)) data.reports.push({ commentId: comment.id, trackId: comment.trackId, createdAt: Date.now() });
        return JSON.stringify(data);
      });
      if (active.current) onSaved();
    } catch { if (active.current) setError('This local report could not be saved. Try again.'); }
    finally { working.current = false; if (active.current) setBusy(false); }
  };
  return <Sheet compact onClose={close} backgroundColor="#1C1C1F">
    <View style={S.confirm}><Label style={S.heading}>Report this comment?</Label><Label style={S.description}>Save a report in this local demo. Nothing is sent to Suno or the comment author.</Label><Label numberOfLines={3} style={S.quote}>{comment.text}</Label>
      {!!error && <Label accessibilityRole="alert" style={S.error}>{error}</Label>}
      <Pressable accessibilityRole="button" accessibilityLabel="Save local comment report" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void save()} style={[S.save, busy && { opacity: 0.6 }]}><Label style={S.reportText}>{busy ? 'Saving…' : 'Save local report'}</Label></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel comment report" onPress={close} style={S.cancel}><Label style={S.description}>Cancel</Label></Pressable>
    </View>
  </Sheet>;
}
const S = StyleSheet.create({ menu: { position: 'absolute', width: 112, paddingVertical: 8, borderRadius: 4, backgroundColor: '#1C1C1F', boxShadow: '0px 3px 7px #00000033' }, report: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 }, reportText: { color: '#FD429C', fontSize: 16, lineHeight: 24 }, confirm: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 }, heading: { color: '#F7F4EF', fontSize: 20, lineHeight: 28 }, description: { color: '#C2C2C1', fontSize: 14, lineHeight: 20 }, quote: { color: '#929297', fontSize: 14, lineHeight: 20 }, error: { color: '#FD429C', fontSize: 14, lineHeight: 20 }, save: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: '#252529' }, cancel: { minHeight: 48, justifyContent: 'center', alignItems: 'center' } });
