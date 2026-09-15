import { ExampleHook, encodeHook } from './hookData';
import React, { useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { Icon, Label, Sheet } from './ui';
export function HookShare({ clip, creator, onClose }: { clip: ExampleHook; creator: string; onClose: () => void }) {
  const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const send = async (copy: boolean) => {
    if (busy) return; setBusy(true);
    try { const url = Linking.createURL('', { queryParams: { hook: encodeHook(clip, creator) } }); if (copy || (Platform.OS === 'web' && !navigator.share)) { await Clipboard.setStringAsync(url); setNotice('Hook link copied'); } else await Share.share({ title: clip.track.title, message: `${clip.track.title} · Local example Hook\n${url}` }); }
    catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) setNotice('Sharing could not open. Try Copy Link.'); }
    finally { setBusy(false); }
  };
  return <Sheet compact onClose={onClose} backgroundColor="#1C1C1F" handleColor="#C2C2C1"><Label style={{ color: '#F7F4EF', textAlign: 'center', fontSize: 18 }}>Share Hook</Label><View style={{ flexDirection: 'row', justifyContent: 'center', gap: 48, padding: 24 }}>{[true, false].map(copy => <Pressable key={String(copy)} accessibilityRole="button" accessibilityLabel={copy ? 'Copy Hook Link' : 'Share Hook Link'} disabled={busy} onPress={() => void send(copy)} style={{ alignItems: 'center', gap: 12, minHeight: 64 }}><Icon name={copy ? 'link-variant' : 'share-variant-outline'} color="#F7F4EF" /><Label style={{ color: '#F7F4EF' }}>{copy ? 'Copy Link' : 'More'}</Label></Pressable>)}</View><Label accessibilityLiveRegion="polite" style={{ color: '#B3B3B8', fontSize: 12, margin: 16, textAlign: 'center' }}>{notice || 'Shares an original example clip. Local posts and files stay on this device.'}</Label></Sheet>;
}
