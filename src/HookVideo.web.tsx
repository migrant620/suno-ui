import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Asset } from 'expo-asset';
import { HookVideoControl, HookVideoProps, HookVideoState } from './hookVideoTypes';

export const HookVideo = forwardRef<HookVideoControl, HookVideoProps>(({ source, active, muted = false, initialTime = 0, onState }, ref) => {
  const video = useRef<HTMLVideoElement>(null);
  const alive = useRef(true); const callback = useRef(onState); callback.current = onState;
  const wanted = useRef(active); wanted.current = active;
  const state = useRef<HookVideoState>({ playing: false, current: initialTime, duration: 0, loading: true, error: '' });
  const report = (patch: Partial<HookVideoState> = {}) => {
    const v = video.current;
    state.current = { ...state.current, playing: !!v && !v.paused, current: v?.currentTime || 0, duration: v && Number.isFinite(v.duration) ? v.duration : 0, ...patch };
    if (alive.current) callback.current(state.current);
  };
  const play = () => { const v = video.current; if (!v) return; report({ error: '' }); void v.play().catch(error => { if (alive.current && error?.name !== 'AbortError') report({ loading: false, error: error?.name === 'NotAllowedError' ? 'Tap the video to start playback.' : 'This video could not play. Tap to retry.' }); }); };
  useImperativeHandle(ref, () => ({ play, pause: () => video.current?.pause(), seek: seconds => { const v = video.current; if (v && Number.isFinite(v.duration)) v.currentTime = Math.max(0, Math.min(v.duration, seconds)); } }));
  useEffect(() => {
    alive.current = true;
    const media = video.current;
    const visibility = () => { if (document.hidden) video.current?.pause(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { alive.current = false; media?.pause(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => { if (active) play(); else video.current?.pause(); }, [active, source]);
  return <video ref={video} src={Asset.fromModule(source).uri} playsInline loop muted={muted} preload="auto" controls={false}
    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
    onLoadedMetadata={() => { if (video.current) video.current.currentTime = Math.min(initialTime, video.current.duration || 0); report({ loading: false }); if (wanted.current) play(); }}
    onCanPlay={() => report({ loading: false })} onWaiting={() => report({ loading: true })} onPlaying={() => report({ loading: false, error: '' })} onPause={() => report()} onTimeUpdate={() => report()} onError={() => report({ loading: false, error: 'This video could not load. Return and try again.' })} />;
});
