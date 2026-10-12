import { ThemeColors, useSurfaceColors } from './Theme';
import React, { useEffect, useState } from 'react';
import { BackHandler, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Playlist } from './libraryState';
import { C, IconButton, Label, S } from './ui';

export function PlaylistEditor({ item, onClose, onSave }: { item: Playlist; onClose: () => void; onSave: (item: Playlist) => void }) {
  const C = useSurfaceColors(); const E = styles(C);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [isPublic, setPublic] = useState(item.isPublic);
  const [coverUri, setCoverUri] = useState(item.coverUri);
  const [error, setError] = useState('');
  const changed = !!name.trim() && (name.trim() !== item.name || description !== (item.description || '') || isPublic !== item.isPublic || coverUri !== item.coverUri);
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; }); return () => sub.remove(); }, [onClose]);
  const chooseCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
      if (!result.canceled) {
        const asset = result.assets[0];
        if (!asset.base64) throw new Error('No persistent image content');
        setCoverUri(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);setError('');
      }
    } catch { setError('The cover could not be opened. Please try another image.'); }
  };
  return <View style={{ flex: 1, backgroundColor: C.surface }}>
    <View style={E.header}><IconButton name="chevron-left" label="Cancel playlist changes" onPress={onClose} style={E.back} /><Label style={E.heading}>Update Playlist Details</Label><Pressable accessibilityRole="button" accessibilityLabel="Save playlist changes" disabled={!changed} accessibilityState={{ disabled: !changed }} onPress={() => { Keyboard.dismiss(); onSave({ ...item, name: name.trim(), description, isPublic, coverUri }); }} style={E.save}><Label style={{ color: changed ? C.ink : C.disabled, fontSize: 14 }}>Save</Label></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}>
      <View style={E.cover}><Image source={coverUri ? { uri: coverUri } : require('../assets/playlist-default.png')} style={{ position: 'absolute', width: '100%', height: '100%' }} /><Pressable accessibilityRole="button" accessibilityLabel="Edit playlist cover" onPress={() => void chooseCover()} style={E.edit}><Label style={{ color: '#101012' }}>Edit</Label></Pressable></View>
      {!!error && <Label style={{ color: '#B52B19' }}>{error}</Label>}
      <TextInput accessibilityLabel="Playlist title" value={name} onChangeText={setName} placeholder="Playlist title" selectionColor={C.primary} style={[E.input, { minHeight: 44 }]} />
      <View style={E.description}><TextInput accessibilityLabel="Playlist description" value={description} onChangeText={setDescription} placeholder="Playlist description (optional)" placeholderTextColor={C.disabled} selectionColor={C.primary} multiline maxLength={200} style={[E.input, { padding: 0, flex: 1, textAlignVertical: 'top' }]} /><Label style={{ textAlign: 'right', color: C.secondary, fontSize: 12 }}>{description.length} / 200</Label></View>
      <View style={[S.row, E.visibility]}><View style={{ flex: 1, gap: 4 }}><Label>Make Playlist Public</Label><Label style={{ color: C.secondary, fontSize: 12, lineHeight: 16 }}>Playlists will be visible on your profile, search, through links and in other areas of Suno</Label></View><Switch accessibilityLabel="Make Playlist Public" value={isPublic} onValueChange={setPublic} trackColor={{ false: C.control, true: C.ink }} thumbColor={isPublic ? C.surface : '#85848C'} /></View>
      {isPublic && <Label style={{ color: C.muted, fontSize: 12 }}>Local demo visibility only. Nothing is published to Suno.</Label>}
    </ScrollView>
  </View>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
  header: { height: 76, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 16 },
  back: { width: 40, height: 40, borderRadius: 99, backgroundColor: C.surface === '#101012' ? C.control : '#10101206' },
  heading: { fontFamily: 'RobotoMedium', fontSize: 18, lineHeight: 24, paddingTop: 7, flexShrink: 1 },
  save: { height: 40, width: 80, backgroundColor: '#FFFFFF44', borderRadius: 99, justifyContent: 'center', alignItems: 'center' },
  cover: { width: 172, height: 172, borderRadius: 20, overflow: 'hidden', alignSelf: 'center', marginBottom: 12, justifyContent: 'flex-end', alignItems: 'center', padding: 8 },
  edit: { borderRadius: 99, backgroundColor: '#FFFFFF77', paddingHorizontal: 12, height: 32, justifyContent: 'center' },
  input: { fontFamily: 'RobotoRegular', fontSize: 14, color: C.ink, backgroundColor: C.surface === '#101012' ? C.field : '#10101205', borderRadius: 12, padding: 16, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  description: { height: 130, backgroundColor: C.surface === '#101012' ? C.field : '#10101205', borderRadius: 12, padding: 12 },
  visibility: { padding: 16, backgroundColor: C.surface === '#101012' ? C.field : '#10101205', borderRadius: 12, gap: 16 },
});
