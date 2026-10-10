import { useSheetEscape } from './useSheetEscape';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { profileImageUri } from './profileImage';
import { ProfilePickerSession, profileForm, newProfilePickerSession, persistProfilePicker, clearProfilePicker } from './profilePickerSession';
import { LinearGradient } from 'expo-linear-gradient';
import { LocalProfile, useLocalProfile } from './useLocalProfile';
import { ProfileLinks, socialFields, socialURL } from './profileData';
import { C, Icon, IconButton, Label, Sheet } from './ui';
export function ProfileEditor({ account, onClose, origin = 'profile', recovery }: {
    account: ReturnType<typeof useLocalProfile>;
    onClose: () => void;
    origin?: 'profile' | 'settings';
    recovery?: ProfilePickerSession | null;
}) {
    const original = useRef({ ...account.profile, ...recovery?.original }).current;
    const initial = useRef(recovery?.draft || profileForm(original)).current;
    const [name, setName] = useState(initial.name);
    const [handle, setHandle] = useState(initial.handle);
    const [bio, setBio] = useState(initial.bio);
    const [avatarUri, setAvatar] = useState(initial.avatarUri);
    const [coverUri, setCover] = useState(initial.coverUri);
    const [links, setLinks] = useState<ProfileLinks>({ ...initial.links });
    const [imageTarget, setImageTarget] = useState<'avatar' | 'cover' | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(recovery?.error || '');
    const session = useRef<ProfilePickerSession | null>(recovery || null);
    const generation = useRef(0);
    const closing = useRef(false);
    const alive = useRef(true);
    const picking = useRef(false);
    const saving = useRef(false);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    const linkError = socialFields.find(field => links[field.key]?.trim() && socialURL(field.key, links[field.key]!) === null);
    const validHandle = /^[a-zA-Z0-9_-]{3,30}$/.test(handle);
    const changed = name.trim() !== original.name || handle !== (original.handle || 'm620-demo') || bio !== original.bio || avatarUri !== (original.avatarUri || '') || coverUri !== (original.coverUri || '') || socialFields.some(field => (links[field.key] || '') !== (original.links?.[field.key] || ''));
    const canSave = changed && !!name.trim() && validHandle && !linkError && account.ready && !busy;
    const close = async () => {
        if (closing.current)
            return;
        closing.current = true;
        generation.current += 1;
        if (session.current) {
            setBusy(true);
            try {
                await clearProfilePicker(session.current.id);
                session.current = null;
            }
            catch {
                closing.current = false;
                setBusy(false);
                setError('Your changes could not be discarded. Please try again.');
                return;
            }
        }
        alive.current = false;
        Keyboard.dismiss();
        onClose();
    };
    const modalRoot = useRef<View>(null);
    useSheetEscape(close, modalRoot);
    const choose = async (kind: 'avatar' | 'cover', camera = false) => {
        if (picking.current || !alive.current || !account.ready)
            return;
        picking.current = true;
        const attempt = ++generation.current;
        const active = () => alive.current && !closing.current && generation.current === attempt;
        setBusy(true);
        setError('');
        try {
            if (Platform.OS === 'android') {
                const next = newProfilePickerSession({ accountId: account.profile.shareId!, screen: 'editor', origin, target: kind, original: profileForm(original), draft: { name, handle, bio, avatarUri, coverUri, links }, step: 0 });
                session.current = { ...next, id: session.current?.id || next.id };
                await persistProfilePicker(session.current, active, true);
                if (!active())
                    return;
            }
            if (camera && Platform.OS !== 'web') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!active())
                    return;
                if (!permission.granted) {
                    setError('Camera access was not granted. Choose from Gallery or allow camera access in your device settings.');
                    return;
                }
            }
            const pick = camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
            const result = await pick({ mediaTypes: ['images'], allowsEditing: true, aspect: kind === 'avatar' ? [1, 1] : [3, 2], quality: 0.8, base64: true });
            if (!result.canceled && active()) {
                const uri = await profileImageUri(result.assets[0]);
                if (session.current && active()) {
                    const next = { ...session.current, pending: false, draft: { ...session.current.draft, [kind === 'avatar' ? 'avatarUri' : 'coverUri']: uri } };
                    await persistProfilePicker(next, active);
                    session.current = next;
                }
                if (active()) {
                    if (kind === 'avatar')
                        setAvatar(uri);
                    else
                        setCover(uri);
                }
            }
        }
        catch {
            if (active())
                setError('This image could not be saved. Try again or choose another image.');
        }
        finally {
            if (session.current?.pending && active()) {
                const next = { ...session.current, pending: false };
                try {
                    await persistProfilePicker(next, active);
                    session.current = next;
                }
                catch {
                    if (active())
                        setError('Your photo changes could not be retained. Please try again.');
                }
            }
            picking.current = false;
            if (active())
                setBusy(false);
        }
    };
    const save = async () => {
        if (!canSave || saving.current || !alive.current)
            return;
        saving.current = true;
        setBusy(true);
        setSubmitting(true);
        setError('');
        const attempt = ++generation.current;
        const active = () => alive.current && !closing.current && generation.current === attempt;
        const normalized = Object.fromEntries(socialFields.map(field => [field.key, socialURL(field.key, links[field.key] || '') || ''])) as ProfileLinks;
        const fields = { name: name.trim(), handle, bio, avatarUri, coverUri };
        const baseline = profileForm(original);
        const patch = Object.fromEntries(Object.entries(fields).filter(([key, value]) => value !== baseline[key as keyof typeof fields])) as Partial<LocalProfile>;
        const linkPatch = Object.fromEntries(socialFields.filter(field => (links[field.key] || '') !== (original.links?.[field.key] || '')).map(field => [field.key, normalized[field.key]]));
        const saved = await account.update(current => ({ ...patch, ...(Object.keys(linkPatch).length ? { links: { ...current.links, ...linkPatch } } : {}) }), active, session.current?.id);
        saving.current = false;
        if (active()) {
            setBusy(false);
            setSubmitting(false);
            if (saved) {
                session.current = null;
                void close();
            }
            else
                setError('Profile changes could not be saved. Please try again.');
        }
    };
    return <Modal visible animationType="slide" onRequestClose={close} onShow={() => setStatusBarStyle('dark')}><StatusBar style="dark"/><View ref={modalRoot} style={E.desktop}><SafeAreaView edges={['top', 'bottom']} style={E.page}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={E.hero}><Image source={coverUri ? { uri: coverUri } : require('../assets/creator-cover.png')} resizeMode="cover" style={E.heroImage}/><LinearGradient pointerEvents="none" colors={['#F7F4EF00', C.surface]} style={E.fade}/><View style={E.identity}><Image source={avatarUri ? { uri: avatarUri } : require('../assets/demo-avatar.png')} style={E.avatar}/><View style={{ flex: 1 }}><Label numberOfLines={2} style={E.name}>{name || 'Your name'}</Label><Label style={E.handle}>@{handle}</Label></View></View></View>
      <View style={E.imageActions}>{(['avatar', 'cover'] as const).map(kind => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={kind === 'avatar' ? 'Edit profile photo' : 'Edit profile cover'} disabled={busy || !account.ready} onPress={() => { Keyboard.dismiss(); setImageTarget(kind); }} style={E.imageAction}><Icon name="pencil" size={24}/><Label style={E.buttonText}>{kind === 'avatar' ? 'Profile Photo' : 'Cover Image'}</Label></Pressable>)}</View>
      {!!error && <Label accessibilityRole="alert" style={E.error}>{error}</Label>}
      <View style={E.fields}><TextInput editable={!submitting} accessibilityLabel="Profile display name" placeholder="Name" value={name} onChangeText={setName} maxLength={60} style={E.input} selectionColor={C.primary}/><View style={E.divider}/><View style={{ flexDirection: 'row', alignItems: 'center' }}><Label style={E.at}>@</Label><TextInput editable={!submitting} accessibilityLabel="Profile username" autoCapitalize="none" autoCorrect={false} value={handle} onChangeText={setHandle} maxLength={30} style={[E.input, { flex: 1 }]} selectionColor={C.primary}/></View></View>
      {!validHandle && <Label accessibilityRole="alert" style={E.error}>Use 3–30 letters, numbers, underscores or hyphens.</Label>}
      <TextInput editable={!submitting} accessibilityLabel="Profile bio" placeholder="Bio" placeholderTextColor={C.disabled} value={bio} onChangeText={setBio} multiline maxLength={200} selectionColor={C.primary} style={[E.input, E.bio]}/>
      <View style={E.socials}>{socialFields.map((field, index) => <View key={field.key}><View style={E.socialRow}><Icon name={field.icon} size={24}/><TextInput editable={!submitting} accessibilityLabel={`Profile ${field.label} link`} placeholder={field.placeholder} placeholderTextColor={C.disabled} value={links[field.key] || ''} onChangeText={value => setLinks(current => ({ ...current, [field.key]: value }))} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={300} selectionColor={C.primary} style={[E.input, { flex: 1, fontSize: 17 }]}/></View>{index < socialFields.length - 1 && <View style={E.divider}/>}</View>)}</View>
      {linkError && <Label accessibilityRole="alert" style={E.error}>Enter a valid {linkError.label} link or leave it empty.</Label>}
      <Label style={E.disclosure}>Local demo profile · Saved on this device</Label>
    </ScrollView>
    <View pointerEvents="box-none" style={E.header}><IconButton name="chevron-left" label="Cancel profile changes" onPress={close} style={E.round}/><Pressable accessibilityRole="button" accessibilityLabel="Save profile" disabled={!canSave} accessibilityState={{ disabled: !canSave }} onPress={() => void save()} style={E.save}><Label style={[E.buttonText, { color: canSave ? C.ink : '#10101266' }]}>{submitting ? 'Saving…' : 'Save'}</Label></Pressable></View>
  </KeyboardAvoidingView>
    {imageTarget && <Sheet compact onClose={() => setImageTarget(null)}><Label style={E.imageTitle}>{imageTarget === 'avatar' ? 'Change Profile Picture' : 'Change Cover Image'}</Label>{[{ title: 'Choose from Gallery', icon: 'image' as const, camera: false }, { title: 'Take a Photo', icon: 'camera' as const, camera: true }].map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => { const target = imageTarget; setImageTarget(null); void choose(target, item.camera); }} style={E.imageMenuRow}><Icon name={item.icon} size={24}/><Label style={{ fontSize: 14 }}>{item.title}</Label></Pressable>)}</Sheet>}
  </SafeAreaView></View></Modal>;
}
const E = StyleSheet.create({ imageTitle: { fontSize: 18, lineHeight: 24, textAlign: 'center', marginVertical: 24 }, imageMenuRow: { height: 64, marginHorizontal: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#D8D5D1', flexDirection: 'row', alignItems: 'center', gap: 24 }, desktop: { flex: 1, backgroundColor: C.surface, alignItems: 'center' }, page: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: C.surface }, hero: { height: 272, overflow: 'hidden' }, heroImage: { position: 'absolute', width: '100%', height: '100%' }, fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 48 }, header: { position: 'absolute', top: 16, left: 20, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, round: { width: 40, height: 40, borderRadius: 99, backgroundColor: '#FFFFFFCC' }, save: { height: 48, minWidth: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 99, backgroundColor: '#FFFFFF66', paddingHorizontal: 18 }, buttonText: { fontSize: 16, lineHeight: 22 }, identity: { position: 'absolute', left: 16, right: 16, bottom: 22, flexDirection: 'row', alignItems: 'center', gap: 8 }, avatar: { width: 76, height: 76, borderRadius: 99 }, name: { fontSize: 28, lineHeight: 34, fontFamily: 'RobotoBold' }, handle: { fontSize: 14, lineHeight: 22 }, imageActions: { marginHorizontal: 20, marginTop: 14, marginBottom: 20, flexDirection: 'row', gap: 8 }, imageAction: { flex: 1, height: 56, borderRadius: 99, backgroundColor: '#EEEBE7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }, fields: { marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 24, backgroundColor: '#EEEBE7' }, input: { height: 56, fontFamily: 'RobotoRegular', fontSize: 18, color: C.ink, paddingVertical: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }, divider: { height: 1, backgroundColor: '#D8D5D1' }, at: { fontSize: 18, color: C.disabled }, bio: { paddingVertical: 16, marginHorizontal: 20, marginTop: 20, padding: 16, height: 152, backgroundColor: '#EEEBE7', borderRadius: 24, textAlignVertical: 'top' }, socials: { marginHorizontal: 20, marginTop: 20, paddingHorizontal: 16, borderRadius: 24, backgroundColor: '#EEEBE7' }, socialRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 18 }, error: { marginHorizontal: 20, marginTop: 8, fontSize: 13, lineHeight: 19, color: '#B52B19' }, disclosure: { fontSize: 11, lineHeight: 16, color: C.muted, textAlign: 'center', padding: 20 } });
