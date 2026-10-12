import { useEffect, useRef, useState } from 'react';
import Storage from './accountStorage';
import { AudioTrack, exampleTracks } from './audioData';
import { PublicVoice } from './voiceData';
import { saveDraftAudioFile, removeDraftAudioFile } from './draftAudioFiles';
import { withOfflineLock } from './offlineQueue';

const key = 'suno-ui:own-voices:v1';
export type OwnVoice = PublicVoice & { local: true; sample: { fileId?: string; templateId?: string; clip: { start: number; end: number } } };
function parse(raw: string | null): OwnVoice[] {
  if (!raw) return [];
  const values = JSON.parse(raw);
  if (!Array.isArray(values) || !values.every(v => v?.local === true && /^local-voice-[a-z0-9-]+$/.test(v.id) && v.creatorId === 'local-owner' && typeof v.name === 'string' && v.name.trim() && v.name.length <= 100 && v.trial === false && Number.isFinite(v.sample?.clip?.start) && v.sample.clip.start >= 0 && Number.isFinite(v.sample.clip.end) && v.sample.clip.end - v.sample.clip.start >= 14.99 && (v.sample.fileId === v.id || exampleTracks.some(t => t.id === v.sample.templateId)))) throw new Error('Your saved Voices could not be read.');
  return values;
}

export function useOwnVoices() {
  const [voices, setVoices] = useState<OwnVoice[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let current = true;
    setReady(false);
    void Storage.getItem(key).then(raw => { if (current) { setVoices(parse(raw)); setError(''); setReady(true); } }).catch(() => { if (current) setError('Your saved Voices could not be read. Retry to restore them.'); });
    return () => { current = false; };
  }, [attempt]);
  const create = async (track: AudioTrack, isActive: () => boolean): Promise<OwnVoice> => {
    if (!ready || !track.clip || track.clip.end - track.clip.start < 14.99) throw new Error('Choose at least 15 seconds of audio.');
    const id = `local-voice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const template = exampleTracks.find(t => t.id === track.id || t.id === track.templateId);
    const voice: OwnVoice = { id, name: track.title.trim().slice(0, 100) || 'My voice', creatorId: 'local-owner', trial: false, local: true, sample: { ...(template ? { templateId: template.id } : { fileId: id }), clip: { ...track.clip } } };
    return withOfflineLock(key, async () => {
      let copied = false;
      let committed = false;
      try {
        if (!isActive() || !alive.current) throw new Error('Voice creation canceled.');
        if (!template) { copied = true; await saveDraftAudioFile(id, track.source); }
        if (!isActive() || !alive.current) throw new Error('Voice creation canceled.');
        const raw = await Storage.updateItem(key, old => {
          if (!isActive() || !alive.current) throw new Error('Voice creation canceled.');
          return JSON.stringify([...parse(old), voice]);
        });
        committed = true;
        if (alive.current) { setVoices(parse(raw)); setError(''); }
        return voice;
      } catch (cause) {
        if (copied && !committed) await removeDraftAudioFile(id);
        throw cause;
      }
    });
  };
  return { voices, ready, error, create, retry: () => setAttempt(value => value + 1) };
}
