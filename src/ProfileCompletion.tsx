import { useSheetEscape } from './useSheetEscape';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { profileImageUri } from './profileImage';
import { ProfilePickerSession, profileForm, newProfilePickerSession, persistProfilePicker, clearProfilePicker } from './profilePickerSession';
import { useLocalProfile } from './useLocalProfile';
import { C, IconButton, Label } from './ui';
export function ProfileCompletion({ account, onClose, onContinue, recovery }: {
    account: ReturnType<typeof useLocalProfile>;
    onClose: () => void;
    onContinue: () => void;
    recovery?: ProfilePickerSession | null;
}) {
    const [step, setStep] = useState(recovery?.step ?? (account.profile.completionStep ? 1 : 0));
    const [name, setName] = useState(recovery?.draft.name ?? account.profile.name);
    const [photo, setPhoto] = useState(recovery?.draft.avatarUri ?? account.profile.avatarUri);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(recovery?.error || '');
    const session = useRef<ProfilePickerSession | null>(recovery || null);
    const generation = useRef(0);
    const closing = useRef(false);
    const alive = useRef(true);
    const pending = useRef(false);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
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
    const choose = async (camera: boolean) => {
        if (pending.current || !alive.current || !account.ready)
            return;
        pending.current = true;
        setBusy(true);
        setError('');
        const attempt = ++generation.current;
        const active = () => alive.current && !closing.current && generation.current === attempt;
        try {
            if (Platform.OS === 'android') {
                const original = profileForm(account.profile);
                const next = newProfilePickerSession({ accountId: account.profile.shareId!, screen: 'setup', origin: 'profile', target: 'avatar', original, draft: { ...original, name, avatarUri: photo || '' }, step });
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
                    setError('Camera access was not granted. Choose from your library or allow access in device settings.');
                    return;
                }
            }
            const result = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
            if (!result.canceled && active()) {
                const uri = await profileImageUri(result.assets[0]);
                if (session.current && active()) {
                    const next = { ...session.current, pending: false, draft: { ...session.current.draft, avatarUri: uri } };
                    await persistProfilePicker(next, active);
                    session.current = next;
                }
                if (active())
                    setPhoto(uri);
            }
        }
        catch {
            if (active())
                setError('This image could not be opened. Try again or choose another image.');
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
            pending.current = false;
            if (active())
                setBusy(false);
        }
    };
    const enabled = account.ready && !busy && (step === 0 ? !!name.trim() : !!photo);
    const next = async () => {
        if (!enabled || pending.current || !alive.current)
            return;
        pending.current = true;
        setBusy(true);
        setSubmitting(true);
        setError('');
        Keyboard.dismiss();
        const attempt = ++generation.current;
        const active = () => alive.current && !closing.current && generation.current === attempt;
        const saved = await account.update(step === 0 ? { name: name.trim(), completionStep: 1 } : { avatarUri: photo }, active, session.current?.id);
        pending.current = false;
        if (active()) {
            setBusy(false);
            setSubmitting(false);
            if (!saved)
                setError('Profile changes could not be saved. Please try again.');
            else {
                session.current = null;
                if (step === 0)
                    setStep(1);
                else
                    onContinue();
            }
        }
    };
    return <Modal visible animationType="slide" onRequestClose={close} onShow={() => setStatusBarStyle('dark')}><StatusBar style="dark"/><View ref={modalRoot} style={S.desktop}><SafeAreaView edges={['top', 'bottom']} style={S.page}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    <View style={S.header}><IconButton name="close" label="Close profile setup" onPress={close} style={S.close}/><View><Label style={S.title}>{step === 0 ? 'Add your name' : 'Add a profile picture'}</Label><Label style={S.step}>Step {step + 1} of 4</Label></View></View><View style={S.progress}><View style={{ height: 4, width: step === 0 ? 0 : '25%', backgroundColor: '#D777B6' }}/></View>
    <View style={S.body}>{step === 0 ? <TextInput editable={!submitting} accessibilityLabel="Setup display name" value={name} onChangeText={setName} maxLength={60} placeholder="Your name" selectionColor={C.primary} style={S.input}/> : <><Image accessibilityLabel="Setup profile photo" source={photo ? { uri: photo } : require('../assets/demo-avatar.png')} style={S.photo}/><Pressable accessibilityRole="button" accessibilityLabel="Choose profile photo from library" disabled={busy || !account.ready} onPress={() => void choose(false)} style={S.option}><Label style={S.optionText}>Choose From Library</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Take profile photo" disabled={busy || !account.ready} onPress={() => void choose(true)} style={S.option}><Label style={S.optionText}>Take a Photo</Label></Pressable>{photo && <Label style={S.caption}>Next opens your bio and links in the profile editor.</Label>}</>}{!!error && <Label accessibilityRole="alert" style={S.error}>{error}</Label>}</View>
    <Pressable accessibilityRole="button" accessibilityLabel="Next profile setup step" disabled={!enabled} accessibilityState={{ disabled: !enabled }} onPress={() => void next()} style={[S.next, !enabled && { opacity: 0.3 }]}><Label style={S.nextText}>{submitting ? 'Saving…' : 'Next'}</Label></Pressable>
  </KeyboardAvoidingView></SafeAreaView></View></Modal>;
}
const S = StyleSheet.create({ desktop: { flex: 1, alignItems: 'center', backgroundColor: C.surface }, page: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: C.surface }, header: { height: 72, alignItems: 'center', justifyContent: 'center' }, close: { position: 'absolute', left: 8, width: 40, height: 40 }, title: { fontSize: 18, lineHeight: 24, textAlign: 'center' }, step: { fontSize: 14, lineHeight: 20, color: C.muted, textAlign: 'center' }, progress: { height: 4, backgroundColor: '#E9E6E1' }, body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12 }, input: { width: '100%', minHeight: 66, fontSize: 28, fontFamily: 'RobotoRegular', color: C.ink, textAlign: 'center', ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }, photo: { width: 180, height: 180, borderRadius: 99, marginBottom: 16 }, option: { minHeight: 40, minWidth: 200, paddingHorizontal: 20, backgroundColor: '#E8E4DF', borderRadius: 99, alignItems: 'center', justifyContent: 'center' }, optionText: { fontSize: 14, lineHeight: 20 }, caption: { fontSize: 12, lineHeight: 18, color: C.muted, textAlign: 'center' }, error: { color: '#B52B19', fontSize: 13, textAlign: 'center' }, next: { marginHorizontal: 16, marginBottom: 16, height: 56, backgroundColor: C.ink, borderRadius: 99, alignItems: 'center', justifyContent: 'center' }, nextText: { color: C.white, fontSize: 18, lineHeight: 24 } });
