import { Asset } from 'expo-asset';
import { Playlist } from './libraryState';
import { exampleTracks } from './audioData';
export type HookCollectionId = 'best' | 'staff' | 'studio';
export const hookCollectionCards = [
    { id: 'best' as const, label: 'Best of v6', image: require('../assets/collection-v6.png') },
    { id: 'staff' as const, label: 'Staff Picks', image: require('../assets/collection-staff.png') },
    { id: 'studio' as const, label: 'Made with Studio', image: require('../assets/collection-studio.png') },
];
export function hookCollection(id: HookCollectionId): Playlist {
    const card = hookCollectionCards.find(item => item.id === id)!;
    return {
        id: `curated-${id}`, name: id === 'studio' ? 'Made in Suno Studio' : card.label,
        description: id === 'best' ? 'Explore a local selection of original example music.' : id === 'staff' ? 'Original recordings for your next listening session.' : 'A local example collection for exploring playback, sharing and your library.',
        coverUri: Asset.fromModule(card.image).uri, isPublic: true, createdAt: 0,
        songIds: (id === 'staff' ? [...exampleTracks].reverse() : exampleTracks).map(track => track.id),
    };
}
