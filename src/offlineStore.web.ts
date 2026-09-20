import { withOfflineLock } from './offlineQueue';
import { Asset } from 'expo-asset';
import { AudioTrack } from './audioData';
const cacheName = (playlistId: string) => `suno-ui:offline:v1:${playlistId}`;
const key = (track: AudioTrack) => new URL(`/__offline_audio__/${encodeURIComponent(track.id)}`, window.location.origin).href;
async function hasOfflinePlaylistRaw(playlistId: string, tracks: AudioTrack[]): Promise<boolean> {
    if (!tracks.length || !('caches' in globalThis) || !(await caches.has(cacheName(playlistId))))
        return false;
    const cache = await caches.open(cacheName(playlistId));
    return (await Promise.all(tracks.map(track => cache.match(key(track))))).every(Boolean);
}
async function saveOfflinePlaylistRaw(playlistId: string, tracks: AudioTrack[], signal: AbortSignal): Promise<void> {
    if (!('caches' in globalThis))
        throw new Error('Offline storage is unavailable in this browser.');
    const cache = await caches.open(cacheName(playlistId));
    for (const track of tracks) {
        if (signal.aborted)
            throw new DOMException('Download canceled.', 'AbortError');
        const source = track.source;
        const uri = typeof source === 'number' ? Asset.fromModule(source).uri : typeof source === 'string' ? source : source?.uri || (source?.assetId ? Asset.fromModule(source.assetId).uri : '');
        if (!uri)
            throw new Error('This audio source is unavailable.');
        const response = await fetch(uri, { signal });
        if (!response.ok)
            throw new Error('Audio download failed.');
        const blob = await response.blob();
        if (!blob.size)
            throw new Error('The downloaded audio is empty.');
        await cache.put(key(track), new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/mpeg' } }));
    }
    if (signal.aborted)
        throw new DOMException('Download canceled.', 'AbortError');
}
async function removeOfflinePlaylistRaw(playlistId: string): Promise<void> {
    if ('caches' in globalThis)
        await caches.delete(cacheName(playlistId));
}
async function offlineTrackSourceRaw(playlistId: string, track: AudioTrack): Promise<{
    source: AudioTrack['source'];
    release: () => void;
} | null> {
    if (!('caches' in globalThis) || !(await caches.has(cacheName(playlistId))))
        return null;
    const response = await (await caches.open(cacheName(playlistId))).match(key(track));
    if (!response)
        return null;
    const uri = URL.createObjectURL(await response.blob());
    return { source: { uri }, release: () => URL.revokeObjectURL(uri) };
}
export const hasOfflinePlaylist = (id: string, tracks: AudioTrack[]) => withOfflineLock(id, () => hasOfflinePlaylistRaw(id, tracks));
export const saveOfflinePlaylist = (id: string, tracks: AudioTrack[], signal: AbortSignal) => withOfflineLock(id, async () => {
    try {
        await saveOfflinePlaylistRaw(id, tracks, signal);
    }
    catch (error) {
        await removeOfflinePlaylistRaw(id);
        throw error;
    }
});
export const removeOfflinePlaylist = (id: string) => withOfflineLock(id, () => removeOfflinePlaylistRaw(id));
export const offlineTrackSource = (id: string, track: AudioTrack) => withOfflineLock(id, () => offlineTrackSourceRaw(id, track));
