import type { ImageProps } from 'expo-image';
export type MediaKind = 'images' | 'videos';
export type MediaDraft = {
    id: string;
    name: string;
    kind: MediaKind;
};
export type MediaPreview = {
    source: ImageProps['source'];
    release: () => void;
};
