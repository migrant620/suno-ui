import { useEffect, useMemo, useState } from 'react';
import { Asset } from 'expo-asset';
import type { AudioSource } from 'expo-audio';
import { Playback, PlaybackControls, PlaybackStatus } from './playbackTypes';

const emptyStatus = (): PlaybackStatus => ({ playing: false, isLoaded: false, didJustFinish: false, duration: 0, currentTime: 0, error: null });
const sourceURI = (source: AudioSource) => typeof source === 'string' ? source : typeof source === 'number' ? Asset.fromModule(source).uri : source?.uri || (source?.assetId ? Asset.fromModule(source.assetId).uri : '');

export function usePlayback(source: AudioSource, updateInterval = 200): Playback {
  const [status, setStatus] = useState(emptyStatus);
  const transport = useMemo(() => {
    const media = new Audio();
    media.preload = 'auto';
    let request = 0;
    let error: string | null = null;
    let publish = () => {};
    const snapshot = (): PlaybackStatus => ({
      playing: !media.paused && !media.ended,
      isLoaded: media.readyState >= 2,
      didJustFinish: media.ended,
      duration: Number.isFinite(media.duration) ? media.duration : 0,
      currentTime: media.currentTime,
      error,
    });
    const player: PlaybackControls = {
      async play() {
        const current = ++request;
        error = null;
        try { await media.play(); }
        catch (reason) {
          // A later pause, replacement or unmount intentionally cancels this request.
          // Current failures, including autoplay denial, remain visible and retryable.
          if (current === request) error = reason instanceof Error ? reason.message : 'This audio could not be played. Try again.';
        }
        publish();
      },
      pause() { request += 1; media.pause(); publish(); },
      replace(next) {
        request += 1; media.pause(); error = null;
        const uri = sourceURI(next);
        if (uri) media.src = uri;
        else media.removeAttribute('src');
        media.load(); publish();
      },
      async seekTo(seconds) { media.currentTime = seconds; publish(); },
    };
    return {
      player,
      connect() {
        const update = () => setStatus(snapshot());
        const failed = () => { error = media.error?.message || 'This audio could not load. Try again.'; update(); };
        const events = ['play', 'playing', 'pause', 'ended', 'timeupdate', 'durationchange', 'loadeddata', 'emptied', 'seeked'];
        publish = update;
        events.forEach(event => media.addEventListener(event, update));
        media.addEventListener('error', failed);
        const timer = window.setInterval(() => { if (!media.paused) update(); }, updateInterval);
        update();
        return () => {
          publish = () => {};
          events.forEach(event => media.removeEventListener(event, update));
          media.removeEventListener('error', failed);
          window.clearInterval(timer);
          request += 1; media.pause(); media.removeAttribute('src'); media.load();
        };
      },
    };
  }, [updateInterval]);
  useEffect(() => transport.connect(), [transport]);
  const sourceKey = JSON.stringify(source);
  useEffect(() => { transport.player.replace(source); }, [transport, sourceKey]);
  return { player: transport.player, status };
}
