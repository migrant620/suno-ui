import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Action, Draft, EditorKind } from './state';
import { C, Label } from './ui';

export function useEnhancement(state: Draft, dispatch: React.Dispatch<Action>) {
  const [pending, setPending] = useState<EditorKind | null>(null);
  const [requested, setRequested] = useState<EditorKind | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const apply = () => {
    if (!requested || pending) return;
    const kind = requested;
    const value = state[kind].value;
    setRequested(null); setPending(kind); Keyboard.dismiss();
    timer.current = setTimeout(() => {
      dispatch({ type: 'edit', kind, value: kind === 'styles'
        ? `${value ? value + '. ' : ''}Gentle piano, warm acoustic texture, a clear melody and an unhurried rhythm.`
        : `${value ? value + '\n\n' : ''}[Verse]\nMorning opens, soft and slow\nLight on water starts to glow\n\n[Chorus]\nStay a moment, let it shine\nKeep this little dawn of mine` });
      if (kind === 'lyrics') dispatch({ type: 'field', field: 'title', value: 'A Little Dawn' });
      setPending(null);
    }, 900);
  };
  return {
    pending,
    request: (kind: EditorKind) => { if (!pending) { Keyboard.dismiss(); setRequested(kind); } },
    dialog: requested && <Modal transparent animationType="fade" onRequestClose={() => setRequested(null)}>
      <View style={E.outer}><View style={E.dialog}>
        <Label style={E.title}>Example enhancement</Label>
        <Label style={E.description}>This prototype uses a local writing example. It does not call Suno or an AI service.</Label>
        <View style={E.buttons}>
          <Pressable accessibilityRole="button" onPress={() => setRequested(null)} style={E.cancel}><Label>Cancel</Label></Pressable>
          <Pressable accessibilityRole="button" onPress={apply} style={E.confirm}><Label style={{ color: C.white }}>Use example</Label></Pressable>
        </View>
      </View></View>
    </Modal>,
  };
}

const E = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#00000055', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 },
  dialog: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, backgroundColor: C.toolbar },
  title: { textAlign: 'center', fontFamily: 'RobotoMedium', marginBottom: 16 },
  description: { color: C.muted, textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancel: { flex: 1, borderRadius: 999, minHeight: 56, backgroundColor: '#10101208', justifyContent: 'center', alignItems: 'center' },
  confirm: { flex: 1, borderRadius: 999, minHeight: 56, backgroundColor: C.ink, justifyContent: 'center', alignItems: 'center' },
});
