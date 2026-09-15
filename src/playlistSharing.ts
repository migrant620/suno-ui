import { Playlist } from './libraryState';
import { AudioTrack, exampleTracks } from './audioData';
import { isSampleSong, savedSample, sampleTrack } from './sampleSongs';

export function encodeSharedPlaylist(playlist: Playlist, tracks: AudioTrack[] = exampleTracks): string {
  const selected = playlist.songIds.map(id => tracks.find(track => track.id === id)).filter((track): track is AudioTrack => !!track);
  return JSON.stringify({ version: 1, name: playlist.name, description: playlist.description || '', songIds: selected.map(track => track.id), songs: selected.map(savedSample).filter(Boolean) });
}
export function decodeSharedPlaylist(raw: string): Playlist | null {
  if (raw.length > 100000) return null;
  try {
    const value = JSON.parse(raw);
    const incomingSongs = value.songs || [];
    if (!Array.isArray(incomingSongs) || incomingSongs.length > 100 || !incomingSongs.every(isSampleSong)) return null;
    // A received link cannot claim ownership of files saved on this device.
    const songs = incomingSongs.map(song => savedSample(sampleTrack(song))!);
    if (!Array.isArray(songs) || songs.length > 100 || !songs.every(isSampleSong)) return null;
    const allowed = new Set([...exampleTracks.map(track => track.id), ...songs.map(song => song.id)]);
    if (value?.version !== 1 || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 2000 || typeof value.description !== 'string' || value.description.length > 200 || !Array.isArray(value.songIds) || value.songIds.length > 100 || !value.songIds.every((id: unknown) => typeof id === 'string' && allowed.has(id))) return null;
    return { id: 'shared-playlist', name: value.name, description: value.description, songIds: [...new Set<string>(value.songIds)], songs, isPublic: false, createdAt: 0 };
  } catch { return null; }
}
