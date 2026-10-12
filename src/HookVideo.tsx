import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { HookVideoControl, HookVideoProps, HookVideoState } from './hookVideoTypes';

export const HookVideo = forwardRef<HookVideoControl, HookVideoProps>(({ source, active, muted = false, initialTime = 0, onState }, ref) => {
  const callback = useRef(onState); callback.current = onState;
  const wanted = useRef(active); wanted.current = active;
  const state = useRef<HookVideoState>({ playing: false, current: initialTime, duration: 0, loading: true, error: '' });
  const player = useVideoPlayer(source, current => { current.loop = true; current.muted = muted; current.timeUpdateEventInterval = 0.2; current.staysActiveInBackground = false; current.showNowPlayingNotification = false; });
  const report = (patch: Partial<HookVideoState>) => { state.current = { ...state.current, ...patch }; callback.current(state.current); };
  useImperativeHandle(ref, () => ({ play: () => player.play(), pause: () => player.pause(), seek: seconds => { player.currentTime = Math.max(0, Math.min(state.current.duration || seconds, seconds)); } }), [player]);
  useEffect(() => {
    let restored = false;
    const loaded = (duration: number) => {
      report({ duration });
      if (!restored && duration > 0) { restored = true; if (initialTime > 0) player.currentTime = Math.min(initialTime, duration); }
    };
    const sourceLoaded = player.addListener('sourceLoad', event => loaded(event.duration));
    const time = player.addListener('timeUpdate', event => report({ current: event.currentTime }));
    const status = player.addListener('statusChange', event => report({ loading: event.status === 'loading' || event.status === 'idle', error: event.status === 'error' ? 'This video could not play. Return and try again.' : '' }));
    const playing = player.addListener('playingChange', event => report({ playing: event.isPlaying }));
    const app = AppState.addEventListener('change', next => { if (next !== 'active') player.pause(); });
    loaded(player.duration);
    report({ playing: player.playing, loading: player.status === 'loading' || player.status === 'idle' });
    return () => { sourceLoaded.remove(); time.remove(); status.remove(); playing.remove(); app.remove(); };
  }, [player]);
  useEffect(() => { player.muted = muted; if (active) player.play(); else player.pause(); }, [player, active, muted]);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="cover" surfaceType="surfaceView" allowsPictureInPicture={false} />
  </View>;
});
