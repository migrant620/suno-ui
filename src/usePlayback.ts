import { AudioSource, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Playback } from './playbackTypes';
export function usePlayback(source: AudioSource, updateInterval = 200): Playback {
    const player = useAudioPlayer(source, { updateInterval });
    const status = useAudioPlayerStatus(player);
    return { player, status };
}
