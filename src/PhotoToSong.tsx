import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { CameraView } from './PhotoCamera';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { Accent, Icon, IconButton, Label } from './ui';
import { useSheetEscape } from './useSheetEscape';
import { PhotoDraft, usePhotoDraft } from './usePhotoDraft';
import { releasePhotoSource } from './photoFiles';
import { ExampleCreation } from './ExampleCreation';

type Field = 'place' | 'moment' | 'style';
export function PhotoToSong({ onClose, canSave, onCreate, inspiration = 'photo' }: { inspiration?: 'photo' | 'love'; onClose: () => void; canSave: boolean; onCreate: (template: string, draft: PhotoDraft, prompt: string, isActive: () => boolean) => Promise<boolean> }) {
  const photo = usePhotoDraft();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false); const [cameraError, setCameraError] = useState('');
  const [cameraKey, setCameraKey] = useState(0); const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const workingFacing = useRef<'back' | 'front' | null>(null);
  const mountedCamera = useRef<string | null>(null);
  const [picking, setPicking] = useState(false); const [opening, setOpening] = useState(false); const [error, setError] = useState('');
  const [editor, setEditor] = useState<Field | null>(null); const [value, setValue] = useState(''); const [example, setExample] = useState(false);
  useEffect(() => { setEditor(null); setExample(false); Keyboard.dismiss(); }, [photo.draft?.id]);
  const camera = useRef<CameraView>(null); const root = useRef<View>(null); const pending = useRef(false); const alive = useRef(true); const asked = useRef(false);
  const back = () => {
    if (example) { setExample(false); return; }
    if (editor) { Keyboard.dismiss(); setEditor(null); return; }
    if (pending.current) { onClose(); return; }
    if (photo.draft) { void photo.discard(); return; }
    onClose();
  };
  useSheetEscape(back, root);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { setForeground(state === 'active'); if (state === 'active') void getPermission(); else setCameraReady(false); });
    return () => listener.remove();
  }, [getPermission]);
  useEffect(() => {
    if (Platform.OS === 'web' || !photo.ready || photo.draft || photo.error || !permission || asked.current) return;
    asked.current = true;
    if (!permission.granted && permission.canAskAgain) void requestPermission().catch(() => setCameraError('Camera access could not be requested. Try again.'));
  }, [photo.ready, photo.draft, photo.error, permission]);
  const allow = async () => {
    setCameraError('');
    try {
      if (permission && !permission.canAskAgain && Platform.OS !== 'web') await Linking.openSettings();
      else await requestPermission();
    } catch { setCameraError('Camera access could not be requested. Try again.'); }
  };
  const accept = async (uri: string, name: string) => {
    if (!alive.current) { await releasePhotoSource(uri); return; }
    setOpening(true);
    try {
      await new Promise<void>((resolve, reject) => Image.getSize(uri, () => resolve(), () => reject(new Error('The image could not be opened. Choose another photo.'))));
      if (!alive.current) { await releasePhotoSource(uri); return; }
      await photo.select(uri, name);
    } catch (cause) {
      try { await releasePhotoSource(uri); } catch { /* Preserve the image error; exact temporary cleanup failure remains unaccepted. */ }
      if (alive.current) setError(cause instanceof Error ? cause.message : 'The image could not be opened. Try again.');
    }
    finally { if (alive.current) setOpening(false); }
  };
  const gallery = async () => {
    if (pending.current || photo.busy) return;
    pending.current = true; setPicking(true); setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (!result.canceled && result.assets[0]) await accept(result.assets[0].uri, result.assets[0].fileName || 'Selected photo');
    } catch { if (alive.current) setError('The photo library could not be opened. Try again.'); }
    finally { pending.current = false; if (alive.current) setPicking(false); }
  };
  const capture = async () => {
    if (!permission?.granted) { void allow(); return; }
    if (pending.current || !cameraReady || photo.busy) return;
    pending.current = true; setError(''); setOpening(true);
    try {
      const picture = await camera.current?.takePictureAsync({ quality: 0.85 });
      if (!picture) throw new Error('The photo could not be captured. Try again.');
      await accept(picture.uri, 'Camera photo');
    } catch { if (alive.current) setError('The photo could not be captured. Try again.'); }
    finally { pending.current = false; if (alive.current) setOpening(false); }
  };
  const startEdit = (field: Field) => { if (!photo.draft || photo.busy) return; setEditor(field); setValue(photo.draft[field]); };
  const commit = async () => { if (!editor) return true; const field = editor; const saved = await photo.edit(field, value.trim()); if (saved) { setEditor(null); Keyboard.dismiss(); } return saved; };
  const cycle = (field: 'moment' | 'style') => {
    if (!photo.draft || photo.busy) return;
    const options = field === 'style' ? ['cinematic ambient', 'desert blues'] : ['shadows stretch', 'the light changes'];
    void photo.edit(field, options[(options.indexOf(photo.draft[field]) + 1) % options.length]);
  };
  const word = (field: Field, punctuation = '') => {
    const content = editor === field ? <TextInput autoFocus selectTextOnFocus autoCapitalize="none" accessibilityLabel={`Photo ${field}`} value={value} onChangeText={setValue} maxLength={200} returnKeyType="done" onSubmitEditing={() => void commit()} style={P.input} placeholder={field === 'place' ? '[place name]' : ''} placeholderTextColor="#AAA8A4" selectionColor="#F3A6C7" /> :
      <Pressable accessibilityRole="button" accessibilityLabel={`Photo ${field}: ${photo.draft?.[field] || 'place name'}`} onPress={() => field === 'place' ? startEdit(field) : cycle(field)} onLongPress={() => startEdit(field)} delayLongPress={500} style={({ pressed }) => [{ maxWidth: '100%', flexShrink: 1 }, pressed && { opacity: 0.65 }]}><Label style={[P.word, field === 'place' && !photo.draft?.place && { color: '#AAA8A4' }]}>{photo.draft?.[field] || '[place name]'}</Label></Pressable>;
    return <View key={field} style={P.wordGroup}>{content}{!!punctuation && <Label style={P.prose}>{punctuation}</Label>}</View>;
  };
  const prompt = photo.draft ? `In this photo, ${photo.draft.place} becomes a memory as ${photo.draft.moment}. The sound is ${photo.draft.style}.` : '';
  const editedDraft = photo.draft && editor ? { ...photo.draft, [editor]: value } : photo.draft;
  const valid = !!editedDraft && [editedDraft.place, editedDraft.moment, editedDraft.style].every(v => v.trim()) && !photo.busy && !photo.error;
  // Keep the preview mounted until takePictureAsync has produced its file.
  const cameraVisible = photo.ready && !photo.draft && permission?.granted && foreground && !picking && !cameraError;
  const cameraIdentity = `${facing}-${cameraKey}`;
  mountedCamera.current = cameraVisible ? cameraIdentity : null;
  const cameraOpened = () => {
    if (!alive.current || mountedCamera.current !== cameraIdentity) return;
    workingFacing.current = facing; setCameraReady(true);
  };
  const cameraFailed = () => {
    if (!alive.current || mountedCamera.current !== cameraIdentity) return;
    mountedCamera.current = null; setCameraReady(false);
    // A device with only one camera can keep using its working lens.
    if (workingFacing.current && workingFacing.current !== facing) { setCameraKey(n => n + 1); setFacing(workingFacing.current); }
    else setCameraError('The camera could not be opened. Try again or choose a photo.');
  };
  const switchCamera = () => {
    if (pending.current || photo.busy || !cameraReady) return;
    mountedCamera.current = null; setCameraReady(false);
    setCameraKey(n => n + 1);
    setFacing(current => current === 'back' ? 'front' : 'back');
  };
  useEffect(() => { if (!cameraVisible) setCameraReady(false); }, [cameraVisible]);
  return <Modal visible animationType="slide" onRequestClose={back}><StatusBar style="dark" /><View style={P.outer}><SafeAreaView ref={root} edges={['top', 'bottom']} style={P.page}>
    <View style={P.header}><IconButton name="chevron-left" label="Back from Photo to Song" size={24} color="#101012" onPress={back} style={P.back} />{(photo.draft || opening) && <Label numberOfLines={1} style={P.headerTitle}>Turn any photo into a song</Label>}</View>
    {!photo.ready ? <View style={P.center}><ActivityIndicator color="#101012" accessibilityLabel="Loading photo draft" /></View> : photo.draft ? <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={P.promptContent}>
        <Image accessibilityLabel="Selected photo preview" source={{ uri: photo.uri }} style={P.preview} onError={() => setError('The selected image could not be displayed. Try selecting it again.')} />
        <View style={P.sentence}><Label style={P.prose}>In this photo, </Label>{word('place')}<Label style={P.prose}> becomes a memory as </Label>{word('moment', '.')}<Label style={P.prose}> The sound is </Label>{word('style', '.')}</View>
        
      </ScrollView>
      <View style={P.footer}>{editor && <Pressable accessibilityRole="button" accessibilityLabel="Save photo word" disabled={photo.busy} onPress={() => void commit()} style={P.editDone}><Label style={P.editDoneText}>Done</Label></Pressable>}{!editor && <Label style={P.hint}>Tap the pink words to cycle options or long press to edit</Label>}<Label style={P.disclosure}>Local prompt template · No image analysis or new music generation</Label><Pressable accessibilityRole="button" accessibilityLabel="Create photo song" disabled={!valid} accessibilityState={{ disabled: !valid }} onPress={() => { void commit().then(saved => { if (saved && alive.current) setExample(true); }); }}>{valid ? <Accent style={P.create}><Icon name="music-note" color="#FFFFFF" /><Label style={P.createText}>Create song</Label></Accent> : <View style={[P.create, { backgroundColor: '#4D4D4D' }]}><Icon name="music-note" color="#AAA8A4" /><Label style={[P.createText, { color: '#AAA8A4' }]}>Create song</Label></View>}</Pressable></View>
    </KeyboardAvoidingView> : <View style={P.cameraPage}>
      <View style={P.intro}><View style={P.badge}><Icon name="camera" size={12} color="#707077" /><Label style={P.badgeText}>PHOTO TO SONG</Label></View><Label style={P.title}>{inspiration === 'love' ? 'Send your partner a daily love song' : 'Turn any photo into a song'}</Label><Label style={P.subtitle}>{inspiration === 'love' ? 'Take their photo, then send them the song' : 'Snap a picture and fill in the blanks'}</Label></View>
      <View style={P.cameraSpace}><View style={P.cameraCard}>{cameraVisible ? <CameraView key={cameraIdentity} ref={camera} style={StyleSheet.absoluteFill} facing={facing} mode="picture" mute onCameraReady={cameraOpened} onMountError={cameraFailed} /> : <View style={P.center}>{opening || photo.busy || picking ? <><ActivityIndicator color="#101012" /><Label style={P.accessTitle}>Opening your photo…</Label></> : <><Label style={P.accessTitle}>{cameraError ? 'Camera unavailable' : 'Allow camera access'}</Label><Pressable accessibilityRole="button" accessibilityLabel={cameraError ? 'Retry photo camera' : 'Allow photo camera access'} onPress={() => cameraError ? (setCameraError(''), setCameraKey(n => n + 1), void allow()) : void allow()} style={P.allow}><Label style={P.allowText}>{cameraError ? 'Try again' : 'Allow access'}</Label></Pressable></>}</View>}</View></View>
      <View style={P.controls}><IconButton name="image-multiple-outline" label="Choose photo from gallery" size={32} color="#101012" disabled={picking || opening || photo.busy} onPress={() => void gallery()} /><Pressable accessibilityRole="button" accessibilityLabel="Take photo" disabled={opening || picking || photo.busy || (!!permission?.granted && !cameraReady)} accessibilityState={{ disabled: opening || picking || photo.busy || (!!permission?.granted && !cameraReady) }} onPress={() => void capture()} style={P.shutter}><View style={P.shutterCore} /></Pressable>{permission?.granted ? <IconButton name="sync" label="Switch photo camera" size={32} color="#101012" disabled={picking || opening || photo.busy || !cameraReady} onPress={switchCamera} /> : <View style={{ width: 48 }} />}</View>
    </View>}
    {!!(error || photo.error || cameraError) && <View style={P.error}><Label accessibilityRole="alert" style={P.errorText}>{error || photo.error || cameraError}</Label>{!!photo.error && <><Pressable accessibilityRole="button" accessibilityLabel="Retry photo draft" disabled={photo.busy} onPress={() => void photo.retry()} style={P.errorAction}><Label>Retry</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Discard photo draft" disabled={photo.busy} onPress={() => void photo.discard()} style={P.errorAction}><Label>Discard photo draft</Label></Pressable></>}{!!error && <IconButton name="close" label="Dismiss photo error" onPress={() => setError('')} />}</View>}
    {example && photo.draft && <ExampleCreation mediaName={photo.draft.name} title={photo.draft.place} ready={canSave} onClose={() => setExample(false)} onCreate={async (template, isActive) => { if (await onCreate(template, photo.draft!, prompt, isActive)) { setExample(false); onClose(); } }} />}
  </SafeAreaView></View></Modal>;
}
const P = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#222126', alignItems: 'center' }, page: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: '#EDEAE4' }, header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }, back: { backgroundColor: '#E5E2DC', borderRadius: 99 }, headerTitle: { position: 'absolute', left: 82, right: 20, fontSize: 18, lineHeight: 24, color: '#101012' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }, cameraPage: { flex: 1 }, intro: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 24 }, badge: { flexDirection: 'row', gap: 5, backgroundColor: '#E5E2DC', borderRadius: 99, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 8 }, badgeText: { fontSize: 10, lineHeight: 12, letterSpacing: 1.4, fontFamily: 'RobotoBold', color: '#101012' }, title: { fontSize: 18, lineHeight: 22, fontFamily: 'RobotoBold', color: '#101012', textAlign: 'center' }, subtitle: { fontSize: 12, lineHeight: 14, marginTop: 4, color: '#101012', textAlign: 'center' }, cameraSpace: { flex: 1, marginTop: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }, cameraCard: { width: '100%', aspectRatio: 1, maxHeight: '100%', borderRadius: 36, overflow: 'hidden', backgroundColor: '#E5E2DC' }, accessTitle: { fontSize: 16, lineHeight: 20, color: '#101012', fontFamily: 'RobotoBold' }, allow: { borderRadius: 99, backgroundColor: '#101012', height: 56, paddingHorizontal: 16, justifyContent: 'center' }, allowText: { fontSize: 16, lineHeight: 20, color: '#FFFFFF', fontFamily: 'RobotoMedium' }, controls: { height: 168, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, shutter: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#AAA8A4', justifyContent: 'center', alignItems: 'center' }, shutterCore: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#101012' }, promptContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 24, gap: 32 }, preview: { width: 160, height: 160, borderRadius: 16, boxShadow: '0px 12px 28px #00000026' }, wordGroup: { flexDirection: 'row', alignItems: 'baseline', maxWidth: '100%' }, sentence: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline' }, prose: { fontSize: 24, lineHeight: 40, color: '#101012' }, word: { fontSize: 24, lineHeight: 40, color: '#DE1677', textDecorationLine: 'underline' }, input: { flexShrink: 1, minWidth: 100, maxWidth: '100%', fontFamily: 'RobotoRegular', color: '#DE1677', fontSize: 24, padding: 0, borderBottomWidth: 1, borderBottomColor: '#DE1677', ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }, editDone: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, backgroundColor: '#101012' }, editDoneText: { color: '#FFFFFF' }, footer: { padding: 16, gap: 8 }, hint: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: '#84828A' }, disclosure: { textAlign: 'center', fontSize: 10, lineHeight: 14, color: '#626168' }, create: { height: 56, borderRadius: 99, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }, createText: { fontSize: 20, lineHeight: 26, fontFamily: 'RobotoMedium', color: '#FFFFFF' }, error: { padding: 12, backgroundColor: '#E5E2DC' }, errorText: { color: '#9F1239', fontSize: 13 }, errorAction: { minHeight: 44, justifyContent: 'center' },
});
