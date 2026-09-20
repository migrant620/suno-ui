import { ImageSourcePropType } from 'react-native';
import { AudioTrack, exampleTracks } from './audioData';
import { LocalProfile } from './useLocalProfile';
export type ExampleCreator = {
    id: string;
    name: string;
    handle: string;
    avatar: ImageSourcePropType;
    cover: ImageSourcePropType;
    bio?: string;
    tracks: AudioTrack[];
    shared?: boolean;
};
export const exampleCreators: ExampleCreator[] = [
    { id: 'm620', name: 'M620', handle: 'm620', avatar: require('../assets/demo-avatar.png'), cover: require('../assets/creator-cover.png'), tracks: exampleTracks },
    { id: 'northlight', name: 'Northlight', handle: 'northlight-demo', avatar: require('../assets/morning-light-cover.png'), cover: require('../assets/morning-light-player-background.png'), tracks: [] },
    { id: 'afterglow', name: 'Afterglow', handle: 'afterglow-demo', avatar: require('../assets/evening-drift-cover.png'), cover: require('../assets/evening-drift-player-background.png'), tracks: [] },
];
export const creatorById = (id: string) => exampleCreators.find(creator => creator.id === id);
export function encodeSharedProfile(profile: LocalProfile): string {
    return JSON.stringify({ version: 1, id: profile.shareId || 'local-listener', name: profile.name, handle: profile.handle || 'm620-demo', bio: profile.bio });
}
export function decodeSharedProfile(raw: string): ExampleCreator | null {
    if (raw.length > 3000)
        return null;
    try {
        const value = JSON.parse(raw);
        if (value?.version !== 1 || typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.id) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 60 || typeof value.handle !== 'string' || !/^[a-zA-Z0-9_-]{3,30}$/.test(value.handle) || typeof value.bio !== 'string' || value.bio.length > 200)
            return null;
        return { ...exampleCreators[0], id: `shared-${value.id}`, name: value.name, handle: value.handle, bio: value.bio, tracks: [], shared: true };
    }
    catch {
        return null;
    }
}
