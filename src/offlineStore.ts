import { withOfflineLock } from './offlineQueue';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { AudioTrack } from './audioData';

const directory = (playlistId: string) => {
  if (!FileSystem.documentDirectory) throw new Error('Offline storage is unavailable.');
  return `${FileSystem.documentDirectory}offline-playlists/${encodeURIComponent(playlistId)}/`;
};
const file = (playlistId: string, track: AudioTrack) => `${directory(playlistId)}${encodeURIComponent(track.id)}.mp3`;
async function hasOfflinePlaylistRaw(playlistId: string, tracks: AudioTrack[]): Promise<boolean> {
  if (!tracks.length) return false;
  const files = await Promise.all(tracks.map(track => FileSystem.getInfoAsync(file(playlistId, track))));
  return files.every(info => info.exists && !info.isDirectory && info.size > 0);
}
async function saveOfflinePlaylistRaw(playlistId: string, tracks: AudioTrack[], signal: AbortSignal): Promise<void> {
  await FileSystem.makeDirectoryAsync(directory(playlistId), { intermediates: true });
  for (const track of tracks) {
    if (signal.aborted) throw new Error('Download canceled.');
    const source = track.source;
    const uri = typeof source === 'number' ? Asset.fromModule(source).uri : typeof source === 'string' ? source : source?.uri || (source?.assetId ? Asset.fromModule(source.assetId).uri : '');
    if (!uri) throw new Error('This audio source is unavailable.');
    // Native assets can be packaged resource names, asset:// or content:// URIs.
    // Only HTTP sources belong to the network downloader.
    if (!/^https?:\/\//i.test(uri)) await FileSystem.copyAsync({ from: uri, to: file(playlistId, track) });
    else {
      const download = FileSystem.createDownloadResumable(uri, file(playlistId, track));
      const cancel = () => { void download.cancelAsync().catch(() => {}); };
      signal.addEventListener('abort', cancel);
      try {
        const result = await download.downloadAsync();
        if (!result || result.status < 200 || result.status >= 300) throw new Error('Audio download failed.');
      } finally { signal.removeEventListener('abort', cancel); }
    }
  }
  if (signal.aborted) throw new Error('Download canceled.');
}
async function removeOfflinePlaylistRaw(playlistId: string): Promise<void> {
  await FileSystem.deleteAsync(directory(playlistId), { idempotent: true });
}
async function offlineTrackSourceRaw(playlistId: string, track: AudioTrack): Promise<{ source: AudioTrack['source']; release: () => void } | null> {
  const uri = file(playlistId, track);
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && !info.isDirectory && info.size > 0 ? { source: { uri }, release: () => {} } : null;
}

export const hasOfflinePlaylist = (id: string, tracks: AudioTrack[]) => withOfflineLock(id, () => hasOfflinePlaylistRaw(id, tracks));
export const saveOfflinePlaylist = (id: string, tracks: AudioTrack[], signal: AbortSignal) => withOfflineLock(id, async () => {
  try { await saveOfflinePlaylistRaw(id, tracks, signal); }
  catch (error) { await removeOfflinePlaylistRaw(id); throw error; }
});
export const removeOfflinePlaylist = (id: string) => withOfflineLock(id, () => removeOfflinePlaylistRaw(id));
export const offlineTrackSource = (id: string, track: AudioTrack) => withOfflineLock(id, () => offlineTrackSourceRaw(id, track));
