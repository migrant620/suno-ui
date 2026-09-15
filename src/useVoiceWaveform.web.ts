import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { AudioTrack } from './audioData';
export type VoiceWaveform = { peaks: number[]; duration: number; loading: boolean; error: string };
export function useVoiceWaveform(track: AudioTrack | null): VoiceWaveform {
  const [state, setState] = useState<VoiceWaveform>({ peaks: [], duration: 0, loading: false, error: '' });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let context: AudioContext | undefined;
    let closed = false;
    const close = () => { if (context && !closed) { closed = true; void context.close().catch(() => {}); } };
    if (!track) { setState({ peaks: [], duration: 0, loading: false, error: '' }); return; }
    if (track.waveform?.length && track.duration) { setState({ peaks: track.waveform, duration: track.duration, loading: false, error: '' }); return; }
    setState({ peaks: [], duration: 0, loading: true, error: '' });
    void (async () => {
      const uri = typeof track.source === 'string' ? track.source : typeof track.source === 'number' ? Asset.fromModule(track.source).uri : track.source?.uri;
      if (!uri) throw new Error('Missing audio');
      const response = await fetch(uri, { signal: controller.signal });
      if (!response.ok) throw new Error('Audio is unavailable');
      context = new AudioContext();
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      if (!buffer.length || !buffer.duration) throw new Error('Audio is empty');
      const peaks = Array.from({ length: 64 }, () => 0);
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        for (let index = 0; index < data.length; index++) {
          const bin = Math.min(63, Math.floor(index / data.length * 64));
          peaks[bin] = Math.max(peaks[bin], Math.abs(data[index]));
        }
      }
      const max = Math.max(...peaks);
      if (active) setState({ peaks: max > 0 ? peaks.map(value => value / max) : peaks, duration: buffer.duration, loading: false, error: '' });
    })().catch(() => { if (active) setState({ peaks: [], duration: 0, loading: false, error: 'This audio could not load. Choose another sample.' }); })
      .finally(() => { close(); });
    return () => { active = false; controller.abort(); close(); };
  }, [track?.id]);
  return state;
}
