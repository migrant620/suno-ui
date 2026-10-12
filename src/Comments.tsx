import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { AudioTrack, clockTime } from './audioData';
import { LocalComment, useCommunity } from './useCommunity';
import { AudioConfirm } from './Audio';
import { C, Icon, IconButton, Label, Sheet } from './ui';
import { CommentOptionsMenu, CommentReport } from './CommentReport';
import { CommentReplyPreview } from './CommentReplyPreview';

function age(comment: LocalComment) {
  if (!comment.own) return 'Example';
  const minutes = Math.max(0, Math.floor((Date.now() - comment.createdAt) / 60000));
  return minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.floor(minutes / 60)} hr ago` : `${Math.floor(minutes / 1440)} d ago`;
}

export function Comments({ track, currentTime, author, community, onSeek, onClose, timestamps = true }: { timestamps?: boolean; track: AudioTrack; currentTime: number; author: string; community: ReturnType<typeof useCommunity>; onSeek: (seconds: number) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [options, setOptions] = useState<LocalComment | null>(null);
  const [deleting, setDeleting] = useState<LocalComment | null>(null);
  const deletion = useRef<{ active: boolean; pending: boolean } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const beginDelete = (comment: LocalComment) => {
    if (deletion.current) deletion.current.active = false;
    deletion.current = { active: true, pending: false };
    setDeleteBusy(false); setDeleting(comment); setOptions(null);
  };
  const cancelDelete = () => {
    if (deletion.current) deletion.current.active = false;
    setDeleteBusy(false); setDeleting(null);
  };
  const confirmDelete = async () => {
    const attempt = deletion.current;
    if (!deleting || !attempt?.active || attempt.pending) return;
    attempt.pending = true; setDeleteBusy(true);
    const isActive = () => mounted.current && attempt.active && deletion.current === attempt;
    try {
      const saved = await community.remove(deleting.id, isActive);
      if (saved && isActive()) { attempt.active = false; setDeleting(null); }
    } finally {
      attempt.pending = false;
      if (mounted.current && deletion.current === attempt) setDeleteBusy(false);
    }
  };
  const [reporting, setReporting] = useState<LocalComment | null>(null);
  const optionAnchor = useRef<View>(null);
  const anchors = useRef(new Map<string, View>());
  const [notice, setNotice] = useState('');
  const [inputHeight, setInputHeight] = useState(48);
  const [clockWidth, setClockWidth] = useState(40);
  const input = useRef<TextInput>(null);
  const scroll = useRef<ScrollView>(null);
  const comments = community.data.comments.filter(comment => comment.trackId === track.id);
  const replying = comments.find(comment => comment.id === community.data.replyTargets?.[track.id]) || null;
  const setReplying = (comment: LocalComment | null) => community.reply(track.id, comment?.id || null);
  const draft = community.data.drafts[track.id] || '';
  const close = () => { mounted.current = false; Keyboard.dismiss(); onClose(); };
  const submit = async () => {
    const saved = await community.add(track.id, author, draft, Math.min(currentTime, track.duration || currentTime), replying?.id, () => mounted.current);
    if (saved && mounted.current) { Keyboard.dismiss(); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); }
  };
  const copy = async (comment: LocalComment) => { try { await Clipboard.setStringAsync(comment.text); setNotice('Comment copied'); } catch { setNotice('Comment could not be copied. Try again.'); } setOptions(null); };
  const renderComment = (comment: LocalComment, depth = 0): React.ReactNode => <View key={comment.id}>
    <View style={[S.comment, depth > 0 && { marginLeft: 36 }]}>
      <Image source={require('../assets/demo-avatar.png')} style={S.avatar} />
      <View style={{ flex: 1 }}>
        <View style={S.meta}><Label style={S.name}>{comment.author}</Label><Label style={S.age}>{age(comment)}</Label>{timestamps && comment.at !== null && <Pressable accessibilityRole="button" accessibilityLabel={`Jump to ${clockTime(comment.at)} for comment ${comment.id}`} onPress={() => onSeek(comment.at!)}><Label style={S.time}>at {clockTime(comment.at)}</Label></Pressable>}</View>
        <Label style={S.body} numberOfLines={expanded.includes(comment.id) ? undefined : 3}>{comment.text}</Label>
        {comment.text.length > 140 && <Pressable accessibilityRole="button" accessibilityLabel={`${expanded.includes(comment.id) ? 'Collapse' : 'Expand'} comment ${comment.id}`} onPress={() => setExpanded(current => current.includes(comment.id) ? current.filter(id => id !== comment.id) : [...current, comment.id])} style={S.expand}><Label style={S.time}>{expanded.includes(comment.id) ? 'Read Less' : 'Read More'}</Label></Pressable>}
        <View style={S.actions}><Pressable accessibilityRole="button" accessibilityLabel={`Reply to comment ${comment.id}`} disabled={community.posting} accessibilityState={{ disabled: community.posting }} onPress={() => { setReplying(comment); input.current?.focus(); }} style={{ minHeight: 24, justifyContent: 'center' }}><Label style={S.age}>Reply</Label></Pressable><IconButton name={comment.liked ? 'heart' : 'heart-outline'} label={`${comment.liked ? 'Unlike' : 'Like'} comment ${comment.id}`} color={comment.liked ? '#FD429C' : '#6A6A72'} onPress={() => community.toggleLike(comment.id)} size={23} style={{ width: 32, height: 24 }} />{comment.liked && <Label style={S.age}>1</Label>}</View>
      </View>
      <View collapsable={false} ref={node => { if (node) anchors.current.set(comment.id, node); else anchors.current.delete(comment.id); }} style={{ width: 48, height: 48, marginHorizontal: -12, marginTop: -9 }}><Pressable accessibilityRole="button" accessibilityLabel={`Options for comment ${comment.id}`} onPress={() => { optionAnchor.current = anchors.current.get(comment.id) || null; setOptions(comment); }} style={({ pressed }) => ({ width: 48, height: 48, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.55 : 1 })}><Icon name="dots-vertical" size={22} color="#6A6A72" /></Pressable></View>
    </View>
    {comments.filter(child => child.parentId === comment.id).map(child => renderComment(child, depth + 1))}
  </View>;
  return <Sheet compact={!timestamps} keyboardAvoiding onClose={close} backgroundColor="#1C1C1F" handleColor="#C2C2C1" handleHeight={48}>
    <Label style={S.title}>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</Label>
    <ScrollView ref={scroll} style={[{ marginTop: -5 }, !timestamps && { maxHeight: 280 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[S.list, { paddingTop: 9 }]}>
      {comments.filter(comment => !comment.parentId).map(comment => renderComment(comment))}
      {!comments.length && <View style={S.empty}><Label style={S.body}>No comments yet</Label><Label style={S.age}>Be the first to leave a local comment.</Label></View>}
    </ScrollView>
    {community.posting && <Label accessibilityLiveRegion="polite" style={S.notice}>Saving local comment…</Label>}
    {!!(community.error || notice) && <Label accessibilityLiveRegion="polite" style={S.notice}>{community.error || notice}</Label>}
    {replying && <CommentReplyPreview comment={replying} disabled={community.posting} onCancel={() => setReplying(null)} />}
    <View testID="comment-composer" style={S.composer}>
      <Image testID="comment-composer-avatar" source={require('../assets/demo-avatar.png')} style={S.ownAvatar} />
      <View style={S.inputWrap}>
        <View testID="comment-input-background" pointerEvents="none" style={S.inputBackground} />
        <TextInput ref={input} accessibilityLabel="Add a comment" placeholder={replying ? 'Reply to comment…' : 'Add a comment…'} placeholderTextColor="#929297" value={draft} onChangeText={text => community.draft(track.id, text)} editable={community.ready && !community.posting} autoCapitalize="none" autoCorrect multiline returnKeyType="done" submitBehavior={Platform.OS === 'web' ? 'newline' : 'submit'} onSubmitEditing={Platform.OS === 'web' ? undefined : submit} selectionColor="#FD429C" onContentSizeChange={event => setInputHeight(Math.min(120, Math.max(48, event.nativeEvent.contentSize.height)))} style={[S.input, { height: draft ? inputHeight : 48, paddingRight: draft.trim() ? 52 : timestamps ? clockWidth + 22 : 14 }]} />
        {draft.trim() ? <IconButton name="arrow-up-circle" label="Post local comment" disabled={!community.ready || community.posting} onPress={() => void submit()} color="#FD429C" style={S.post} /> : timestamps ? <Label testID="comment-composer-clock" pointerEvents="none" onLayout={event => setClockWidth(event.nativeEvent.layout.width)} style={S.clock}>{clockTime(currentTime)}</Label> : null}
      </View>
    </View>
    <Label testID="comment-disclosure" style={S.disclosure}>Local demo comments · Not posted to Suno</Label>
    {Platform.OS === 'android' && !keyboardVisible && <View testID="comment-bottom-inset" style={{ height: insets.bottom }} />}
    {options && !options.own && <CommentOptionsMenu anchor={optionAnchor} onClose={() => setOptions(null)} onReport={() => { setReporting(options); setOptions(null); }} />}
    {options?.own && <Sheet compact onClose={() => setOptions(null)} backgroundColor="#252529"><Label style={S.title}>Comment</Label><Pressable accessibilityRole="button" onPress={() => void copy(options)} style={S.option}><Label style={S.body}>Copy comment</Label></Pressable><Pressable accessibilityRole="button" onPress={() => beginDelete(options)} style={S.option}><Label style={{ color: '#FD429C' }}>Delete comment</Label></Pressable><Pressable accessibilityRole="button" onPress={() => setOptions(null)} style={S.option}><Label style={S.body}>Cancel</Label></Pressable></Sheet>}
    {reporting && <CommentReport comment={reporting} onClose={() => setReporting(null)} onSaved={() => { setReporting(null); setNotice('Local report saved. Nothing was sent to Suno.'); }} />}
    {deleting && <AudioConfirm destructive title="Delete this local comment?" description={community.error || "This also removes its local replies. This action does not affect Suno."} confirm={deleteBusy ? "Deleting…" : "Delete comment"} busy={deleteBusy} cancel="Cancel" onCancel={cancelDelete} onConfirm={() => void confirmDelete()} />}
  </Sheet>;
}
const S = StyleSheet.create({ title: { textAlign: 'center', fontSize: 16, lineHeight: 24, fontFamily: 'RobotoMedium', color: C.surface, marginBottom: 8 }, list: { paddingTop: 4, paddingBottom: 20 }, comment: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, paddingBottom: 22 }, avatar: { width: 32, height: 32, borderRadius: 99, marginTop: 4 }, meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 5 }, name: { color: C.surface, fontFamily: 'RobotoMedium', fontSize: 13, lineHeight: 20 }, age: { color: '#6A6A72', fontSize: 13, lineHeight: 20 }, time: { color: '#FD429C', fontSize: 13, lineHeight: 20 }, body: { color: '#C2C2C1', fontSize: 14, lineHeight: 20 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 0 }, expand: { marginTop: 1, minHeight: 28, justifyContent: 'center' }, empty: { padding: 32, alignItems: 'center', gap: 12 }, composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingTop: 10 }, ownAvatar: { width: 44, height: 44, borderRadius: 99 }, inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', flex: 1 }, inputBackground: { position: 'absolute', top: 2, bottom: 2, left: 0, right: 0, borderRadius: 24, backgroundColor: '#252529' }, input: { position: 'relative', fontFamily: 'RobotoRegular', color: '#C2C2C1', flex: 1, minHeight: 48, maxHeight: 120, fontSize: 14, lineHeight: 20, paddingVertical: 14, paddingLeft: 14, marginRight: 4, textAlignVertical: 'top', ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }, clock: { position: 'absolute', right: 18, bottom: 14, color: '#C2C2C1', fontSize: 16, lineHeight: 20 }, post: { position: 'absolute', right: 4, bottom: 0, width: 44, height: 48 }, disclosure: { color: '#8E8E96', fontSize: 10, lineHeight: 12, textAlign: 'center', marginVertical: 2.5 }, notice: { color: '#FD429C', fontSize: 12, marginHorizontal: 16, marginBottom: 8 }, option: { paddingHorizontal: 24, minHeight: 52, justifyContent: 'center' } });
