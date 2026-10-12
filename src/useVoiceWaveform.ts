import { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import { AudioTrack } from './audioData';
export type VoiceWaveform = { peaks: number[]; duration: number; loading: boolean; error: string };
export function useVoiceWaveform(track: AudioTrack | null): VoiceWaveform {
  const [state, setState] = useState<VoiceWaveform>({ peaks: [], duration: 0, loading: false, error: '' });
  useEffect(() => {
    let active = true;
    const id = `wave-${Date.now()}-${Math.random()}`;
    if (!track) { setState({ peaks: [], duration: 0, loading: false, error: '' }); return; }
    if (track.waveform?.length && track.duration) { setState({ peaks: track.waveform, duration: track.duration, loading: false, error: '' }); return; }
    const uri = typeof track.source === 'string' ? track.source : typeof track.source === 'object' ? track.source?.uri : null;
    setState({ peaks: [], duration: 0, loading: true, error: '' });
    if (!uri || !NativeModules.SunoAudio) { setState({ peaks: [], duration: 0, loading: false, error: 'Audio waveform decoding is unavailable on this platform.' }); return; }
    NativeModules.SunoAudio.decodeWaveform(uri, 64, id).then((result: { peaks: number[]; duration: number }) => {
      if (active) setState({ ...result, loading: false, error: '' });
    }).catch(() => { if (active) setState({ peaks: [], duration: 0, loading: false, error: 'This audio could not load. Choose another sample.' }); });
    return () => { active = false; NativeModules.SunoAudio.cancelWaveform(id); };
  }, [track?.id]);
  return state;
}
