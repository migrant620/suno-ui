import { SampleSong, isSampleSong } from './sampleSongs';
import type { MediaDraft } from './mediaTypes';
export type Playlist = {
    id: string;
    name: string;
    isPublic: boolean;
    songIds: string[];
    description?: string;
    coverUri?: string;
    createdAt: number;
    songs?: SampleSong[];
};
export type LibraryData = {
    playlists: Playlist[];
    likedIds?: string[];
    songs?: SampleSong[];
    receivedSongs?: SampleSong[];
    removedMedia?: MediaDraft[];
};
export const emptyLibrary = (): LibraryData => ({ playlists: [], likedIds: [] });
export function readLibrary(raw: string): LibraryData {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('playlists' in value) || !Array.isArray(value.playlists))
        throw new Error('Invalid library');
    if ('likedIds' in value && (!Array.isArray(value.likedIds) || !value.likedIds.every(id => typeof id === 'string')))
        throw new Error('Invalid liked songs');
    if ('songs' in value && (!Array.isArray(value.songs) || !value.songs.every(isSampleSong) || new Set(value.songs.map(song => song.id)).size !== value.songs.length))
        throw new Error('Invalid local songs');
    if ('receivedSongs' in value && (!Array.isArray(value.receivedSongs) || !value.receivedSongs.every(isSampleSong) || new Set(value.receivedSongs.map(song => song.id)).size !== value.receivedSongs.length))
        throw new Error('Invalid received songs');
    if ('removedMedia' in value && (!Array.isArray(value.removedMedia) || !value.removedMedia.every(item => item && /^media-song-[a-z0-9-]+$/.test(item.id) && typeof item.name === 'string' && ['images', 'videos'].includes(item.kind))))
        throw new Error('Invalid removed media');
    const ids = new Set<string>();
    for (const item of value.playlists) {
        if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) || typeof item.name !== 'string' || !item.name.trim() || typeof item.isPublic !== 'boolean' || (item.description !== undefined && (typeof item.description !== 'string' || item.description.length > 200)) || (item.coverUri !== undefined && typeof item.coverUri !== 'string') || !Number.isFinite(item.createdAt) || !Array.isArray(item.songIds) || !item.songIds.every((id: unknown) => typeof id === 'string'))
            throw new Error('Invalid playlist');
        ids.add(item.id);
    }
    return value as LibraryData;
}
