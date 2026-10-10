import { AudioTrack, exampleTracks } from './audioData';
import { CreationInputs, isCreationInputs } from './creationInputs';
export type SampleSong = {
    id: string;
    templateId: string;
    title: string;
    styles: string;
    lyrics: string;
    createdAt: number;
    isPublic: boolean;
    voiceId?: string;
    creation?: CreationInputs;
};
export function isSampleSong(value: any): value is SampleSong {
    return !!value && typeof value.id === 'string' && value.id.startsWith('local-song-') &&
        exampleTracks.some(track => track.id === value.templateId) &&
        typeof value.title === 'string' && !!value.title.trim() && value.title.length <= 200 &&
        typeof value.styles === 'string' && value.styles.length <= 10000 &&
        typeof value.lyrics === 'string' && value.lyrics.length <= 30000 &&
        Number.isFinite(value.createdAt) && typeof value.isPublic === 'boolean' &&
        (value.voiceId === undefined || (typeof value.voiceId === 'string' && value.voiceId.length <= 100)) &&
        (value.creation === undefined || isCreationInputs(value.creation));
}
export function sampleTrack(song: SampleSong): AudioTrack {
    const template = exampleTracks.find(track => track.id === song.templateId)!;
    return { ...template, id: song.id, title: song.title, styles: song.styles, lyrics: song.lyrics, templateId: song.templateId, voiceId: song.voiceId, creation: song.creation, artist: 'M620', example: true };
}
export function savedSample(track: AudioTrack): SampleSong | null {
    return track.templateId ? { id: track.id, templateId: track.templateId, title: track.title, styles: track.styles, lyrics: track.lyrics, voiceId: track.voiceId, createdAt: 0, isPublic: false } : null;
}
