const cacheName = 'suno-ui:draft-photos:v1';
const key = (id: string) => new URL(`/__draft_photo__/${encodeURIComponent(id)}`, location.origin).href;
export async function savePhotoFile(id: string, uri: string) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('The photo could not be opened.');
  const blob = await response.blob();
  if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Choose an image file that is not empty.');
  await (await caches.open(cacheName)).put(key(id), new Response(blob, { headers: { 'Content-Type': blob.type } }));
}
export async function readPhotoFile(id: string) {
  if (!(await caches.has(cacheName))) throw new Error('Your saved photo could not be opened.');
  const response = await (await caches.open(cacheName)).match(key(id));
  if (!response) throw new Error('Your saved photo could not be opened.');
  const uri = URL.createObjectURL(await response.blob());
  return { uri, release: () => URL.revokeObjectURL(uri) };
}
export async function removePhotoFile(id: string) {
  if (!(await caches.has(cacheName))) return;
  const cache = await caches.open(cacheName); await cache.delete(key(id));
  if (await cache.match(key(id))) throw new Error('The photo could not be removed. Try again.');
  if (!(await cache.keys()).length) await caches.delete(cacheName);
}

export async function removeAllPhotoFiles() {
  await caches.delete(cacheName);
  if (await caches.has(cacheName)) throw new Error('Your photo files could not be removed. Try again.');
}

export async function releasePhotoSource(_uri: string) { /* Browser picker/camera returns in-memory data; no native temporary file. */ }
