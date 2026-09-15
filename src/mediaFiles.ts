import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { createVideoPlayer } from 'expo-video';
import { MediaKind, MediaPreview } from './mediaTypes';
const directory = () => {
  if (!FileSystem.documentDirectory) throw new Error('Media storage is unavailable.');
  return `${FileSystem.documentDirectory}draft-media/`;
};
const path = (id: string, kind: MediaKind) => `${directory()}${encodeURIComponent(id)}.${kind === 'images' ? 'jpg' : 'mp4'}`;
export async function prepareMedia(uri: string, kind: MediaKind): Promise<MediaPreview> {
  if (kind === 'images') {
    await new Promise<void>((resolve, reject) => Image.getSize(uri, (w, h) => w > 0 && h > 0 ? resolve() : reject(new Error('Choose an image that can be opened.')), () => reject(new Error('The image could not be opened. Choose another file.'))));
    return { source: { uri }, release: () => {} };
  }
  const player = createVideoPlayer(null);
  player.muted = true;
  player.audioMixingMode = 'mixWithOthers';
  try {
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => { clearTimeout(timer); listener.remove(); error ? reject(error) : resolve(); };
      const listener = player.addListener('statusChange', event => {
        if (event.status === 'readyToPlay') finish();
        else if (event.status === 'error') finish(new Error('The video could not be opened. Choose another file.'));
      });
      const timer = setTimeout(() => finish(new Error('The video took too long to open. Try again.')), 15000);
      void player.replaceAsync({ uri, useCaching: false }).catch(() => finish(new Error('The video could not be opened.')));
    });
    const [thumbnail] = await player.generateThumbnailsAsync([0], { maxWidth: 256, maxHeight: 256 });
    if (!thumbnail || !thumbnail.width || !thumbnail.height) throw new Error('The video preview could not be opened.');
    return { source: thumbnail, release: () => thumbnail.release() };
  } finally { player.release(); }
}
export async function saveMediaFile(id: string, uri: string, kind: MediaKind) {
  await FileSystem.makeDirectoryAsync(directory(), { intermediates: true });
  await FileSystem.copyAsync({ from: uri, to: path(id, kind) });
  const info = await FileSystem.getInfoAsync(path(id, kind));
  if (!info.exists || info.isDirectory || !info.size) throw new Error('The media file could not be saved.');
}
export async function readMediaFile(id: string, kind: MediaKind) {
  const uri = path(id, kind); const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || info.isDirectory || !info.size) throw new Error('Your saved media could not be opened. Retry or remove it.');
  return { uri, release: () => {} };
}
export async function removeMediaFile(id: string, kind: MediaKind) {
  const uri = path(id, kind); await FileSystem.deleteAsync(uri, { idempotent: true });
  if ((await FileSystem.getInfoAsync(uri)).exists) throw new Error('The saved media could not be removed. Try again.');
}
export async function releaseMediaSource(uri: string) {
  const prefix = `${FileSystem.cacheDirectory || ''}ImagePicker/`;
  if (!FileSystem.cacheDirectory || !uri.startsWith(prefix) || !/^[a-z0-9-]+\.(png|jpe?g|heic|webp|mp4|mov|m4v|webm)$/i.test(uri.slice(prefix.length))) return;
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
