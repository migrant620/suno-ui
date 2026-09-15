import { AudioSource } from 'expo-audio';

const cacheName = 'suno-ui:draft-audio:v1';
const key = (id: string) => new URL(`/__draft_audio__/${encodeURIComponent(id)}`, location.origin).href;
export async function saveDraftAudioFile(id: string, source: AudioSource) {
  const uri = typeof source === 'string' ? source : typeof source === 'object' ? source?.uri : null;
  if (!uri) throw new Error('Missing audio file');
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Audio file could not be read');
  const blob = await response.blob();
  if (!blob.size) throw new Error('Audio file is empty');
  await (await caches.open(cacheName)).put(key(id), new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/mpeg' } }));
}
export async function readDraftAudioFile(id: string) {
  if (!(await caches.has(cacheName))) throw new Error('Saved audio is missing');
  const response = await (await caches.open(cacheName)).match(key(id));
  if (!response) throw new Error('Saved audio is missing');
  const uri = URL.createObjectURL(await response.blob());
  return { source: { uri }, release: () => URL.revokeObjectURL(uri) };
}
export async function removeDraftAudioFile(id: string) {
  if (!(await caches.has(cacheName))) return;
  const cache = await caches.open(cacheName);
  await cache.delete(key(id));
  if (!(await cache.keys()).length) await caches.delete(cacheName);
}
