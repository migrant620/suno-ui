import { AudioTrack } from './audioData';
import React, { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { Playlist } from './libraryState';
import { encodeSharedPlaylist } from './playlistSharing';
import { C, Icon, IconName, Label, Sheet } from './ui';

export function PlaylistShare({ playlist, tracks, onClose }: { playlist: Playlist; tracks?: AudioTrack[]; onClose: () => void }) {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const share = async (action: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const url = Linking.createURL('', { queryParams: { playlist: encodeSharedPlaylist(playlist, tracks) } });
      const message = `${playlist.name} · Local example playlist\n${url}`;
      if (action === 'Copy Link') { await Clipboard.setStringAsync(url); setNotice('Link copied'); }
      else if (action === 'Messages') await Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
      else if (action === 'Email') await Linking.openURL(`mailto:?subject=${encodeURIComponent(playlist.name)}&body=${encodeURIComponent(message)}`);
      else if (Platform.OS === 'web' && typeof navigator.share !== 'function') { await Clipboard.setStringAsync(url); setNotice('Link copied. Paste it to share this example playlist.'); }
      else await Share.share({ title: playlist.name, message, ...(Platform.OS === 'ios' ? { url } : {}) });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) setNotice('Sharing could not open. Try Copy Link instead.');
    } finally { setBusy(false); }
  };
  return <Sheet compact onClose={onClose}>
    <Label style={P.title}>Share</Label>
    <View style={P.options}>{([['Copy Link', 'link-variant'], ['Messages', 'message'], ['Email', 'email'], ['More', 'dots-vertical']] as [string, IconName][]).map(([name, icon]) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={name} disabled={busy} onPress={() => void share(name)} style={P.option}><View style={P.icon}><Icon name={icon} size={24} color="#333333" /></View><Label style={P.label}>{name}</Label></Pressable>)}</View>
    <Label accessibilityLiveRegion="polite" style={P.notice}>{notice || 'Demo link includes the title and example songs. Uploaded files stay on this device.'}</Label>
  </Sheet>;
}

const P = StyleSheet.create({
  title: { fontSize: 16, fontFamily: 'RobotoMedium', textAlign: 'center', marginTop: -8, marginBottom: 24 },
  options: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, paddingHorizontal: 4 },
  option: { width: '33.333%', alignItems: 'center', gap: 10, paddingBottom: 8 },
  icon: { width: 48, height: 48, borderRadius: 99, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14 },
  notice: { marginHorizontal: 16, marginTop: 8, marginBottom: 12, fontSize: 11, lineHeight: 16, color: C.muted },
});
