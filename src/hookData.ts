import { AudioTrack, exampleTracks } from './audioData';
export type ExampleHook = { id: string; track: AudioTrack; video: number; creatorId: string; creatorName?: string; caption: string };
export const exampleHooks: ExampleHook[] = [
  { id: 'morning-light-hook', track: exampleTracks[0], video: require('../assets/morning-light-hook.mp4'), creatorId: 'm620', caption: 'A quiet moment in Morning Light. Original artwork and music.' },
  { id: 'evening-drift-hook', track: exampleTracks[1], video: require('../assets/evening-drift-hook.mp4'), creatorId: 'm620', caption: 'Let the evening settle. Original artwork and music.' },
];

export function encodeHook(clip: ExampleHook, creator: string): string {
  return JSON.stringify({ version: 1, id: clip.id, template: clip.track.templateId || clip.track.id, title: clip.track.title, caption: clip.caption, creator });
}
export function decodeHook(raw: string): ExampleHook | null {
  const existing = exampleHooks.find(clip => clip.id === raw);
  if (existing) return existing;
  if (raw.length > 3000) return null;
  try {
    const value = JSON.parse(raw); const template = exampleHooks.find(clip => clip.track.id === value.template);
    if (value?.version !== 1 || !template || typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.id) || typeof value.title !== 'string' || !value.title.trim() || value.title.length > 200 || typeof value.caption !== 'string' || value.caption.length > 500 || typeof value.creator !== 'string' || value.creator.length > 60) return null;
    return { ...template, id: 'shared-' + value.id, track: { ...template.track, title: value.title }, caption: value.caption, creatorId: 'shared-creator', creatorName: value.creator };
  } catch { return null; }
}
