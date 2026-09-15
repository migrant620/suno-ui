export async function deleteAccountFiles() {
  if (!('caches' in globalThis)) return;
  for (const name of await caches.keys()) {
    if (name === 'suno-ui:draft-audio:v1' || name === 'suno-ui:draft-photos:v1' || name === 'suno-ui:draft-media:v1' || name.startsWith('suno-ui:offline:v1:')) {
      await caches.delete(name);
      if (await caches.has(name)) throw new Error('Saved audio could not be removed.');
    }
  }
}
