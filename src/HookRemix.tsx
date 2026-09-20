import React, { useEffect, useRef, useState } from 'react';
import { AppState, findNodeHandle, Image, Keyboard, NativeModules, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AudioTrack } from './audioData';
import { CoverBackdrop } from './CoverBackdrop';
import { ExampleCreation } from './ExampleCreation';
import { useLibrary } from './useLibrary';
import { Accent, Icon, Label, Sheet } from './ui';
export function HookRemix({ track, library, onClose, onAdvanced, onCreated }: {
    track: AudioTrack;
    library: ReturnType<typeof useLibrary>;
    onClose: () => void;
    onAdvanced: (track: AudioTrack, isActive: () => boolean) => Promise<boolean>;
    onCreated: (track: AudioTrack) => void;
}) {
    const [prompt, setPrompt] = useState('');
    const [styles, setStyles] = useState(track.styles.split(',').map(value => value.trim()).filter(Boolean));
    const [creating, setCreating] = useState(false);
    const input = useRef<TextInput>(null);
    const leavingInput = useRef(false);
    const keyboardShown = useRef(false);
    const alive = useRef(true);
    const pendingAdvanced = useRef(false);
    const [advancedBusy, setAdvancedBusy] = useState(false);
    const [advancedError, setAdvancedError] = useState('');
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => {
        if (Platform.OS !== 'android')
            return;
        const shown = Keyboard.addListener('keyboardDidShow', () => { keyboardShown.current = true; });
        const hidden = Keyboard.addListener('keyboardDidHide', () => {
            const wasShown = keyboardShown.current;
            keyboardShown.current = false;
            if (wasShown && !leavingInput.current && AppState.currentState === 'active')
                onClose();
        });
        return () => { shown.remove(); hidden.remove(); };
    }, [onClose]);
    const leaveInput = () => { leavingInput.current = true; Keyboard.dismiss(); };
    const startCreation = () => { if (pendingAdvanced.current)
        return; leaveInput(); setCreating(true); };
    const focusInput = () => {
        const target = input.current;
        if (Platform.OS === 'android' && NativeModules.SunoKeyboard) {
            const tag = findNodeHandle(target);
            if (tag !== null)
                NativeModules.SunoKeyboard.focusInWindow(tag);
        }
        else
            target?.focus();
    };
    const creation = { mode: 'Advanced' as const, prompt, instrumental: track.creation?.instrumental || false, vocalGender: track.creation?.vocalGender || null };
    const openAdvanced = async () => {
        if (pendingAdvanced.current)
            return;
        pendingAdvanced.current = true;
        setAdvancedBusy(true);
        setAdvancedError('');
        leaveInput();
        try {
            const saved = await onAdvanced({ ...track, styles: styles.join(', '), creation }, () => alive.current);
            if (!saved && alive.current) {
                leavingInput.current = false;
                setAdvancedError('Remix could not be opened. Try Advanced again.');
            }
        }
        catch {
            if (alive.current) {
                leavingInput.current = false;
                setAdvancedError('Remix could not be opened. Try Advanced again.');
            }
        }
        finally {
            pendingAdvanced.current = false;
            if (alive.current)
                setAdvancedBusy(false);
        }
    };
    return <Sheet compact keyboardAvoiding onClose={() => { alive.current = false; onClose(); }} onShow={focusInput} backgroundColor="#1C1C1F" backdrop={<CoverBackdrop source={track.cover}/>} handleColor="#C2C2C1" handleHeight={48}>
    <View style={S.header}><Image testID="hook-remix-cover" source={track.cover} style={S.cover}/><View testID="hook-remix-title" style={S.titleBlock}><Icon name="autorenew" size={16} color="#FFFFFF"/><Label numberOfLines={1} ellipsizeMode="tail" style={S.title}>{track.title}</Label></View><Label numberOfLines={1} style={S.disclosure}>Local example · Prerecorded audio</Label></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={S.styles}>
      <Pressable accessibilityRole="button" accessibilityLabel="Advanced Hook remix" accessibilityState={{ disabled: advancedBusy, busy: advancedBusy }} disabled={advancedBusy} onPress={() => void openAdvanced()} style={S.chipTarget}><View pointerEvents="none" style={S.advanced}><Icon name="tune-vertical" color="#FFFFFF" size={12.5}/><Label style={S.chipText}>{advancedBusy ? 'Saving…' : 'Advanced'}</Label></View></Pressable>
      {track.styles.split(',').map(value => value.trim()).filter(Boolean).map(value => <Pressable key={value} accessibilityRole="checkbox" accessibilityLabel={`Remix style: ${value}`} accessibilityState={{ checked: styles.includes(value) }} aria-checked={styles.includes(value)} onPress={() => setStyles(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} style={S.chipTarget}><View pointerEvents="none" style={[S.chip, !styles.includes(value) && { backgroundColor: 'transparent', borderColor: '#555559' }]}><Label style={S.chipText}>{value}</Label></View></Pressable>)}
    </ScrollView>
    <View style={S.inputRow}><TextInput ref={input} autoFocus={Platform.OS === 'web'} autoCapitalize="none" returnKeyType="go" submitBehavior="submit" onSubmitEditing={startCreation} accessibilityLabel="Describe Hook remix" value={prompt} onChangeText={setPrompt} maxLength={3000} placeholder="Describe remix sound and lyrics…" placeholderTextColor="#FFFFFF4D" selectionColor="#FD429C" style={S.input}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Create local Hook remix" accessibilityState={{ disabled: advancedBusy }} disabled={advancedBusy} onPress={startCreation} style={S.createTarget}><Accent style={S.create}><Icon name="music-note-plus" color="#FFFFFF" size={28}/></Accent></Pressable>
    </View><View style={{ height: 12 }}/>
    {!!advancedError && <Label accessibilityRole="alert" style={{ color: '#FFFFFF', fontSize: 12, marginHorizontal: 16, marginBottom: 12 }}>{advancedError}</Label>}
    {creating && <ExampleCreation title={prompt.trim().slice(0, 70) || `${track.title} Remix`} ready={library.ready} onClose={() => { leavingInput.current = false; setCreating(false); }} onCreate={async (template, isActive) => {
                const result = await library.createSample(template, prompt.trim().slice(0, 70) || `${track.title} Remix`, styles.join(', '), track.lyrics, undefined, isActive, { inputs: creation });
                if (result && isActive()) {
                    setCreating(false);
                    onCreated(result);
                }
            }}/>}
  </Sheet>;
}
const S = StyleSheet.create({
    header: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 104, height: 48 },
    cover: { position: 'absolute', left: 38, top: 6, width: 36, height: 36, borderRadius: 8 },
    titleBlock: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
    title: { flexShrink: 1, minWidth: 0, color: '#FFFFFF', fontSize: 16, lineHeight: 20 },
    disclosure: { position: 'absolute', top: 34, left: 78, right: 78, textAlign: 'center', color: '#99999F', fontSize: 9, lineHeight: 12 },
    styles: { paddingHorizontal: 16, gap: 8, paddingTop: 16, paddingBottom: 8 },
    chipTarget: { height: 48, justifyContent: 'center' },
    advanced: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#FFFFFF1A', borderRadius: 99, paddingHorizontal: 15, height: 40 },
    chip: { borderWidth: 1, borderColor: 'transparent', backgroundColor: '#FFFFFF0A', borderRadius: 99, paddingHorizontal: 15, height: 40, justifyContent: 'center' },
    chipText: { color: '#FFFFFF', fontFamily: 'RobotoMedium', fontSize: 12.5, lineHeight: 15 },
    inputRow: { marginHorizontal: 16, borderWidth: 1, borderColor: '#FFFFFF1A', borderRadius: 99, height: 56, paddingRight: 3, paddingLeft: 16, flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: { flex: 1, minWidth: 0, color: '#FFFFFF', fontFamily: 'RobotoRegular', fontSize: 16, height: 40, padding: 0, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
    createTarget: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    create: { width: 40, height: 40, borderRadius: 99, justifyContent: 'center', alignItems: 'center' },
});
