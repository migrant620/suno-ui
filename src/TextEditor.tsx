import { ThemeColors, useSurfaceColors } from './Theme';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Action, Draft, EditorKind, SavedText } from './state';
import { Accent, C, Icon, IconButton, Label, S, Sheet } from './ui';

import { useEnhancement } from './Enhancement';

type Naming = { type: 'save' } | { type: 'rename'; item: SavedText };
export function TextEditor({ kind, state, dispatch, onClose, entry = 'editor' }: {
  kind: EditorKind; entry?: 'editor' | 'saved' | 'save'; state: Draft; dispatch: React.Dispatch<Action>; onClose: () => void;
}) {
  const C = useSurfaceColors(); const E = styles(C);
  const title = kind === 'lyrics' ? 'Lyrics' : 'Styles';
  const singular = kind === 'lyrics' ? 'Lyrics' : 'Style';
  const h = state[kind];
  const [listing, setListing] = useState(entry === 'saved');
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const listingView = useRef<View>(null);
  const anchors = useRef(new Map<string, View>());
  const [naming, setNaming] = useState<Naming | null>(entry === 'save' ? { type: 'save' } : null);
  const [name, setName] = useState('');
  const enhancement = useEnhancement(state, dispatch);
  const input = useRef<TextInput>(null);
  const nameInput = useRef<TextInput>(null);
  const items = state.saved.filter(item => item.kind === kind);
  const isSaved = items.some(item => item.value === h.value && h.value.length > 0);
  const close = () => {
    if (menu) setMenu(null);
    else if (listing && entry !== 'saved') setListing(false);
    else { Keyboard.dismiss(); onClose(); }
  };
  const openMenu = (id: string) => {
    if (menu?.id === id) { setMenu(null); return; }
    anchors.current.get(id)?.measureInWindow((x, y, width, height) => {
      listingView.current?.measureInWindow((left, top, availableWidth, availableHeight) => {
        setMenu({ id, x: Math.max(8, Math.min(x + width - left - 144, availableWidth - 152)), y: Math.max(0, Math.min(y + height - top, availableHeight - 120)) });
      });
    });
  };
  const menuItem = items.find(item => item.id === menu?.id);
  const openName = (next: Naming) => { setMenu(null); setNaming(next); setName(next.type === 'rename' ? next.item.name : ''); };
  const save = () => {
    if (!name.trim() || !naming) return;
    if (naming.type === 'rename') dispatch({ type: 'rename', id: naming.item.id, name });
    else dispatch({ type: 'save', item: { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind, name: name.trim(), value: h.value, createdAt: Date.now() } });
    setNaming(null); Keyboard.dismiss(); if (entry === 'save') onClose();
  };
  const cancelName = () => { setNaming(null); Keyboard.dismiss(); if (entry === 'save') onClose(); };
  return <>
    {entry !== 'save' && <Sheet onClose={close} onShow={() => { if (entry === 'editor') input.current?.focus(); }}>
    {listing ? <View ref={listingView} collapsable={false} style={{ flex: 1 }}>
      <Label style={E.listTitle}>Saved {title}</Label>
      <ScrollView onScrollBeginDrag={() => setMenu(null)} contentContainerStyle={[E.list, !items.length && { flexGrow: 1, justifyContent: 'center' }]}>
        {!items.length && <Label style={E.empty}>Nothing saved yet</Label>}
        {items.map(item => <View key={item.id} style={E.savedRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Use ${item.name}`} onPress={() => { dispatch({ type: 'edit', kind, value: item.value }); if (entry === 'saved') onClose(); else setListing(false); }} style={E.savedContent}>
            <View style={E.songIcon}><Icon name="music-note" /></View>
            <View style={{ flex: 1 }}><Label numberOfLines={1}>{item.name}</Label><Label style={E.time}>{Date.now() - item.createdAt < 60000 ? 'Just now' : `${Math.floor((Date.now() - item.createdAt) / 60000)}m ago`}</Label></View>
          </Pressable>
          <View collapsable={false} ref={view => { if (view) anchors.current.set(item.id, view); else anchors.current.delete(item.id); }}>
            <IconButton name="dots-vertical" label={`More options for ${item.name}`} onPress={() => openMenu(item.id)} />
          </View>
        </View>)}
      </ScrollView>
      {menu && menuItem && <View style={StyleSheet.absoluteFill}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close options" onPress={() => setMenu(null)} style={StyleSheet.absoluteFill} />
        <View style={[E.contextMenu, { left: menu.x, top: menu.y }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Rename" onPress={() => openName({ type: 'rename', item: menuItem })} style={E.menuItem}><Icon name="pencil" /><Label>Rename</Label></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Delete" onPress={() => { dispatch({ type: 'delete', id: menuItem.id }); setMenu(null); }} style={E.menuItem}><Icon name="delete" color={C.primary} /><Label style={{ color: C.primary }}>Delete</Label></Pressable>
        </View>
      </View>}
    </View> : <>
      <Label style={[S.heading, E.title]}>{title}</Label>
      <TextInput ref={input} multiline autoFocus={Platform.OS === 'web'} accessibilityLabel={title} value={h.value} onChangeText={value => dispatch({ type: 'edit', kind, value })}
        style={E.input} placeholder={kind === 'lyrics' ? 'Write your lyrics here' : 'Describe what you want your song to sound like'} placeholderTextColor={C.placeholder}
        selectionColor={C.primary} textAlignVertical="top" />
      <View style={E.footer}>
        <View style={E.toolbar}>
          <IconButton name="undo" label="Undo" disabled={!h.past.length} onPress={() => dispatch({ type: 'undo', kind })} style={E.tool} />
          <IconButton name="redo" label="Redo" disabled={!h.future.length} onPress={() => dispatch({ type: 'redo', kind })} style={E.tool} />
          <IconButton name="bookshelf" label={`Saved ${title}`} onPress={() => { Keyboard.dismiss(); setListing(true); }} style={E.tool} />
          <IconButton name={isSaved ? 'bookmark' : 'bookmark-outline'} label={`Save ${singular}`} disabled={!h.value.trim()} color={isSaved ? C.primary : C.ink} onPress={() => openName({ type: 'save' })} style={E.tool} />
          <IconButton name="delete" label="Reset" disabled={!h.value.length} onPress={() => dispatch({ type: 'reset', kind })} style={E.tool} />
          {enhancement.pending === kind ? <View style={E.tool}><ActivityIndicator color={C.ink} /></View> : <IconButton name="auto-fix" label="Enhance" onPress={() => enhancement.request(kind)} style={E.tool} />}
        </View>
        <IconButton name="check" label="Done" onPress={() => { Keyboard.dismiss(); onClose(); }} color={C.white} size={24} circle={C.surface === '#101012' ? C.primary : '#FF4B27'} />
      </View>
    </>}
    </Sheet>}
    {naming && <Modal transparent animationType="fade" onRequestClose={cancelName} onShow={() => nameInput.current?.focus()}>
      <View style={E.dialogOuter}><View style={E.dialog}>
        <Label style={E.dialogTitle}>{naming.type === 'rename' ? 'Rename' : `Save ${singular}`}</Label>
        {naming.type === 'save' && <Label style={E.dialogDescription}>Give your {kind === 'lyrics' ? 'lyrics' : 'style'} a title so it's easy to remember</Label>}
        <TextInput ref={nameInput} autoFocus={Platform.OS === 'web'} accessibilityLabel="Name" value={name} onChangeText={setName} style={E.nameInput} placeholder="Name" placeholderTextColor={C.muted} selectionColor={C.primary} onSubmitEditing={save} />
        <View style={E.dialogButtons}>
          <Pressable accessibilityRole="button" onPress={cancelName} style={E.cancel}><Label>Cancel</Label></Pressable>
          <Pressable accessibilityRole="button" disabled={!name.trim()} onPress={save} style={[E.save, !name.trim() && { opacity: 0.35 }]}><Label style={{ color: C.surface }}>Save</Label></Pressable>
        </View>
      </View></View>
    </Modal>}
    {enhancement.dialog}
  </>;
}

const styles = (C: ThemeColors) => StyleSheet.create({
  title: { marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  input: { flex: 1, marginHorizontal: 16, marginBottom: 20, fontFamily: 'RobotoRegular', color: C.ink, fontSize: 16, lineHeight: 20, padding: 0, paddingTop: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}), includeFontPadding: false },
  footer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingLeft: 16, paddingRight: 14, gap: 7 },  // pill 308 wide, Done 48dp target at 331
  toolbar: { backgroundColor: C.toolbar, flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, boxShadow: '0px 4px 5px rgba(0,0,0,0.18)' },
  tool: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  done: { width: 40, height: 40, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  listTitle: { textAlign: 'center', fontFamily: 'RobotoMedium', marginBottom: 24 },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 80 },
  empty: { color: C.muted, textAlign: 'center' },
  savedRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, zIndex: 1 },
  savedContent: { flexDirection: 'row', alignItems: 'center', gap: 24, flex: 1 },
  songIcon: { width: 40, height: 40, borderRadius: 22, borderColor: C.ink, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 12, color: C.muted, marginTop: 2 },
  contextMenu: { position: 'absolute', backgroundColor: C.toolbar, paddingVertical: 8, borderRadius: 20, width: 144, zIndex: 10, boxShadow: '0px 4px 12px rgba(0,0,0,0.17)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48, paddingHorizontal: 16 },
  dialogOuter: { flex: 1, backgroundColor: '#00000055', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 },
  dialog: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, backgroundColor: C.toolbar },
  dialogTitle: { textAlign: 'center', fontFamily: 'RobotoMedium', marginBottom: 16 },
  dialogDescription: { color: C.muted, textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  nameInput: { backgroundColor: C.surface === '#101012' ? C.control : '#10101208', borderRadius: 16, padding: 16, fontSize: 16, fontFamily: 'RobotoRegular', color: C.ink, height: 56 },
  dialogButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancel: { flex: 1, borderRadius: 999, minHeight: 56, backgroundColor: C.surface === '#101012' ? C.control : '#10101208', justifyContent: 'center', alignItems: 'center' },
  save: { flex: 1, borderRadius: 999, minHeight: 56, backgroundColor: C.ink, justifyContent: 'center', alignItems: 'center' },
});
