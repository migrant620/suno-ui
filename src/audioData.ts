import { AudioSource } from 'expo-audio';
import { ImageSourcePropType } from 'react-native';
import type { CreationInputs } from './creationInputs';
import waveform from '../assets/morning-light-waveform.json';
import eveningWaveform from '../assets/evening-drift-waveform.json';

export type AudioTrack = {
  id: string; title: string; styles: string; lyrics: string; source: AudioSource;
  cover?: ImageSourcePropType; duration?: number; waveform?: number[]; example?: boolean;
  clip?: { start: number; end: number };
  voiceId?: string;
  creation?: CreationInputs;
  templateId?: string; artist?: string; model?: string; plays?: number; likes?: number;
};
export const exampleTracks: AudioTrack[] = [{
  id: 'morning-light', title: 'Morning Light', styles: 'Gentle piano, warm acoustic texture, instrumental', lyrics: '',
  source: require('../assets/morning-light.mp3'), cover: require('../assets/morning-light-cover.png'),
  duration: 22.2, waveform, example: true, artist: 'M620', model: 'EXAMPLE', plays: 0, likes: 0,
}, {
  id: 'evening-drift', title: 'Evening Drift', styles: 'Soft keys, mellow arpeggios, instrumental', lyrics: '',
  source: require('../assets/evening-drift.mp3'), cover: require('../assets/evening-drift-cover.png'),
  duration: 25.8, waveform: eveningWaveform, example: true, artist: 'M620', model: 'EXAMPLE', plays: 0, likes: 0,
}];
export function clockTime(seconds: number) {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}
