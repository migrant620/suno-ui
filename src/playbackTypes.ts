import type { AudioSource } from 'expo-audio';

export type PlaybackStatus = {
  playing: boolean; isLoaded: boolean; didJustFinish: boolean;
  duration: number; currentTime: number; error: string | null;
};
export type PlaybackControls = {
  play: () => void | Promise<void>;
  pause: () => void;
  replace: (source: AudioSource) => void;
  seekTo: (seconds: number) => Promise<void>;
};
export type Playback = { player: PlaybackControls; status: PlaybackStatus };
