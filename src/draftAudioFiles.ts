import { AudioSource } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

function file(id: string) {
  if (!FileSystem.documentDirectory) throw new Error('Audio storage is unavailable');
  return `${FileSystem.documentDirectory}draft-audio/${encodeURIComponent(id)}`;
}
export async function saveDraftAudioFile(id: string, source: AudioSource) {
  const uri = typeof source === 'string' ? source : typeof source === 'object' ? source?.uri : null;
  if (!uri) throw new Error('Missing audio file');
  const target = file(id);
  await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}draft-audio/`, { intermediates: true });
  if (uri !== target) await FileSystem.copyAsync({ from: uri, to: target });
  const info = await FileSystem.getInfoAsync(target);
  if (!info.exists || info.isDirectory || !info.size) throw new Error('Audio file is empty');
}
export async function readDraftAudioFile(id: string) {
  const uri = file(id);
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || info.isDirectory || !info.size) throw new Error('Saved audio is missing');
  return { source: { uri }, release: () => {} };
}
export async function removeDraftAudioFile(id: string) {
  await FileSystem.deleteAsync(file(id), { idempotent: true });
}
