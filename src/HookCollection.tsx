import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { PlaylistDetails } from './PlaylistDetails';
import { Playlist } from './libraryState';
import { AudioTrack, exampleTracks } from './audioData';
import { useLibrary } from './useLibrary';
import { useLibraryPlayback } from './useLibraryPlayback';

export function HookCollection({ item, library, player, onBack, onCreate, onSongOptions }: {
  item: Playlist; library: ReturnType<typeof useLibrary>; player: ReturnType<typeof useLibraryPlayback>;
  onBack: () => void; onCreate: () => void; onSongOptions: (track: AudioTrack) => void;
}) {
  const root = useRef<View>(null); const pending = useRef(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const saved = library.data.playlists.some(playlist => playlist.id === item.id);
  const toggle = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const ok = saved ? await library.remove(item.id) : await library.saveCollection(item);
      if (!ok) setError('The collection could not be updated. Try again.');
    } finally { pending.current = false; setBusy(false); }
  };
  return <View ref={root} style={{ flex: 1 }}><PlaylistDetails item={item} liked={false} shared tracks={item.songIds.map(id => exampleTracks.find(track => track.id === id)).filter((track): track is AudioTrack => !!track)} player={player}
    onBack={onBack} backLabel="Back to Hooks" onCreate={onCreate} onAdd={() => void toggle()} onMenu={() => void toggle()} onSongOptions={onSongOptions}
    curated={{ saved, busy, error, onToggle: () => void toggle() }} /></View>;
}
