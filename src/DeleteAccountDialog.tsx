import React, { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSession } from './LocalSession';
import { ThemeColors, useTheme } from './Theme';
import { Label } from './ui';
export function DeleteAccountDialog({ onClose }: {
    onClose: () => void;
}) {
    const theme = useTheme();
    const C = theme.colors;
    const S = styles(C);
    const session = useLocalSession();
    const [confirmation, setConfirmation] = useState('');
    const [focused, setFocused] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const changing = useRef(false);
    const cancel = () => { if (!changing.current) {
        Keyboard.dismiss();
        onClose();
    } };
    const remove = async () => {
        if (changing.current)
            return;
        if (confirmation !== 'confirm_delete') {
            setError("Enter exactly 'confirm_delete' to delete this local account.");
            return;
        }
        changing.current = true;
        setBusy(true);
        setError('');
        Keyboard.dismiss();
        try {
            await session.deleteAccount();
        }
        catch (e) {
            setError(e instanceof Error && e.message.includes('HTTPS') ? e.message : 'Deletion could not start. Your saved data has not been removed. Try again.');
            changing.current = false;
            setBusy(false);
        }
    };
    return <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={cancel}><View style={S.overlay}><Pressable accessibilityRole="button" accessibilityLabel="Dismiss account deletion" disabled={busy} onPress={cancel} style={StyleSheet.absoluteFill}/><SafeAreaView pointerEvents="box-none" style={{ flex: 1 }}><KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined} style={S.center}><View accessibilityViewIsModal role="dialog" aria-label="Delete account" style={S.card}>
    <Label style={S.title}>Delete account</Label><Label style={S.description}>{"Type 'confirm_delete' below.\nThis action cannot be undone."}</Label>
    <TextInput accessibilityLabel="Account deletion confirmation" value={confirmation} onChangeText={value => { setConfirmation(value); setError(''); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} editable={!busy} autoCapitalize="none" autoCorrect={false} multiline maxLength={100} style={[S.input, focused && { borderBottomColor: C.primary }]} selectionColor={C.primary}/>
    {!!error && <Label accessibilityRole="alert" style={S.error}>{error}</Label>}
    <View style={S.actions}><Pressable accessibilityRole="button" accessibilityLabel="Cancel account deletion" disabled={busy} onPress={cancel} style={S.button}><Label style={S.buttonText}>Cancel</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Delete local account" disabled={busy} onPress={() => void remove()} style={S.button}><Label style={[S.buttonText, { color: '#FF0000', opacity: busy ? 0.4 : 1 }]}>{busy ? 'Deleting…' : 'Delete'}</Label></Pressable></View>
    <Label style={S.disclosure}>Local demo only · Removes saved demo data.</Label>
  </View></KeyboardAvoidingView></SafeAreaView></View></Modal>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#00000052' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    card: { width: 272, maxWidth: '100%', padding: 24, borderRadius: 28, backgroundColor: C.surface === '#101012' ? '#2E2E33' : C.surface }, title: { fontFamily: 'InstrumentSerif', fontSize: 28, lineHeight: 32, color: C.ink },
    description: { fontSize: 16, lineHeight: 32, color: C.secondary, marginTop: 16 }, input: { height: 64, backgroundColor: C.surface === '#101012' ? '#38383E' : '#FFFFFF', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomWidth: 1, borderBottomColor: C.secondary, marginTop: 16, padding: 12, color: C.ink, fontFamily: 'RobotoRegular', fontSize: 16, lineHeight: 24, textAlignVertical: 'center' },
    actions: { marginTop: 24, minHeight: 48, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }, button: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' }, buttonText: { fontSize: 24, lineHeight: 32, color: C.ink }, error: { color: C.surface === '#101012' ? '#FFB1A3' : '#B52B19', fontSize: 12, lineHeight: 18, marginTop: 12 }, disclosure: { position: 'absolute', left: 8, right: 8, bottom: -30, fontSize: 11, lineHeight: 16, textAlign: 'center', color: C.ink },
});
