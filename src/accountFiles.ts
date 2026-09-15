import * as FileSystem from 'expo-file-system/legacy';
export async function deleteAccountFiles() {
  if (!FileSystem.documentDirectory) throw new Error('Saved audio storage is unavailable.');
  for (const directory of ['draft-audio/', 'offline-playlists/', 'draft-photos/', 'draft-media/']) {
    const uri = `${FileSystem.documentDirectory}${directory}`;
    await FileSystem.deleteAsync(uri, { idempotent: true });
    if ((await FileSystem.getInfoAsync(uri)).exists) throw new Error('Saved audio could not be removed.');
  }
}
