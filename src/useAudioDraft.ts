import { useEffect, useRef, useState } from 'react';
import AsyncStorage from './accountStorage';
import { AudioTrack, exampleTracks } from './audioData';
import { readDraftAudioFile, removeDraftAudioFile, saveDraftAudioFile } from './draftAudioFiles';
import { withOfflineLock } from './offlineQueue';

const key = 'suno-ui:audio-draft:v1';
type AudioEdit = { mode: 'Cover' | 'Extend'; start: number };
type SavedAudio = { track: Omit<AudioTrack, 'source' | 'cover'>; edit: AudioEdit };

export function useAudioDraft() {
  const [audio, setAudio] = useState<AudioTrack | null>(null);
  const [audioEdit, setAudioEdit] = useState<AudioEdit>({ mode: 'Cover', start: 0 });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [discarding, setDiscarding] = useState(false);
  const restorationFailed = useRef(false);
  const stored = useRef<string | null>(null);
  const release = useRef(() => {});
  const persisted = useRef<string | null>(null);
  const adoptSelection = (track: AudioTrack, edit: AudioEdit, raw: string) => {
    persisted.current = raw; stored.current = track.id; restorationFailed.current = false;
    setAudio(track); setAudioEdit(edit); setError('');
  };
  useEffect(() => {
    let active = true;
    void withOfflineLock(key, async () => {
      const raw = await AsyncStorage.getItem(key);
      persisted.current = raw;
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedAudio;
      if (typeof saved?.track?.id !== 'string' || !saved.track.id || typeof saved.track.title !== 'string' || !['Cover', 'Extend'].includes(saved.edit?.mode) || !Number.isFinite(saved.edit.start) || saved.edit.start < 0) throw new Error('Invalid audio draft');
      stored.current = saved.track.id;
      const base = exampleTracks.find(track => track.id === saved.track.id || track.id === saved.track.templateId);
      const example = base ? { ...base, ...saved.track, source: base.source, cover: base.cover } : null;
      const file = example ? null : await readDraftAudioFile(saved.track.id);
      if (!active) { file?.release(); return; }
      release.current = file?.release || (() => {});
      stored.current = saved.track.id;
      setAudio(example || { ...saved.track, source: file!.source });
      setAudioEdit(saved.edit);
    }).catch(() => { if (active) { restorationFailed.current = true; setError('Your saved audio could not be restored. Select the file again to retry.'); } })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; release.current(); };
  }, []);
  useEffect(() => {
    if (!ready || (restorationFailed.current && !audio)) return;
    const serialized = audio ? JSON.stringify({ track: (({ source, cover, ...track }) => track)(audio), edit: audioEdit }) : null;
    if (serialized === persisted.current) return;
    let active = true;
    void withOfflineLock(key, async () => {
      const oldId = stored.current;
      if (audio) {
        if (audio.id !== oldId && !exampleTracks.some(track => track.id === audio.id || track.id === audio.templateId)) await saveDraftAudioFile(audio.id, audio.source);
        const { source, cover, ...track } = audio;
        await AsyncStorage.setItem(key, JSON.stringify({ track, edit: audioEdit }));
      } else await AsyncStorage.removeItem(key);
      persisted.current = serialized;
      stored.current = audio?.id || null;
      restorationFailed.current = false;
      if (oldId && oldId !== audio?.id && !exampleTracks.some(track => track.id === oldId)) await removeDraftAudioFile(oldId);
      if (active) setError('');
    }).catch(() => { if (active) setError('Audio changes could not be saved on this device. Keep this page open and try again.'); });
    return () => { active = false; };
  }, [audio, audioEdit, ready]);
  const discardUnavailableAudio = async () => {
    if (!restorationFailed.current || discarding) return;
    setDiscarding(true);
    try {
      await withOfflineLock(key, async () => {
        // A newly selected attachment may already have repaired the draft.
        if (!restorationFailed.current) return;
        const id = stored.current;
        if (id && !exampleTracks.some(track => track.id === id)) await removeDraftAudioFile(id);
        await AsyncStorage.removeItem(key);
        stored.current = null;
        restorationFailed.current = false;
      });
      setError('');
    } catch {
      setError('The unavailable audio could not be discarded. Please try again.');
    } finally { setDiscarding(false); }
  };
  return { audio, setAudio, audioEdit, setAudioEdit, adoptSelection, snapshot: () => persisted.current, ready, error, unavailable: restorationFailed.current && !audio, discarding, discardUnavailableAudio };
}
