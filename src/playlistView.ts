import { AudioTrack } from './audioData';
export const playlistSorts = ['Default', 'Date Added', 'Most Liked', 'Most Played', 'Alphabetical'] as const;
export type PlaylistSort = typeof playlistSorts[number];
export type SortDirection = 'Ascending' | 'Descending';
export function sortedPlaylistTracks(tracks: AudioTrack[], sort: PlaylistSort, direction: SortDirection): AudioTrack[] {
    if (sort === 'Default')
        return tracks;
    const factor = direction === 'Ascending' ? 1 : -1;
    return tracks.map((track, index) => ({ track, index })).sort((a, b) => {
        const difference = sort === 'Alphabetical' ? a.track.title.localeCompare(b.track.title, 'en', { sensitivity: 'base' })
            : sort === 'Most Played' ? (a.track.plays || 0) - (b.track.plays || 0)
                : sort === 'Most Liked' ? (a.track.likes || 0) - (b.track.likes || 0)
                    : a.index - b.index;
        return difference * factor || a.index - b.index;
    }).map(entry => entry.track);
}
