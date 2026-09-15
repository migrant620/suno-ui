import { useEffect, useRef, useState } from 'react';
import { AudioTrack } from './audioData';
import { useTrackPlayback } from './Audio';
import { offlineTrackSource } from './offlineStore';

export function useLibraryPlayback(onStart: () => void) {
  const playback = useTrackPlayback(null);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [playlistId, setPlaylistId] = useState('');
  const [queue, setQueue] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const request = useRef(0);
  const release = useRef<() => void>(() => {});
  const start = async (song: AudioTrack, songs: AudioTrack[], id: string) => {
    const version = ++request.current;
    onStart(); playback.player.pause(); setLoading(true); playback.setError('');
    try {
      const offline = await offlineTrackSource(id, song).catch(() => null);
      if (version !== request.current) { offline?.release(); return; }
      playback.player.replace(offline?.source || song.source);
      release.current(); release.current = offline?.release || (() => {});
      setTrack(song); setQueue(songs); setPlaylistId(id); await playback.player.play();
    } catch { if (version === request.current) playback.setError('This song could not be played. Try again.'); }
    finally { if (version === request.current) setLoading(false); }
  };
  const toggle = async () => { onStart(); await playback.play(); };
  const playTrack = async (song: AudioTrack, songs: AudioTrack[], id: string) => {
    if (song.id === track?.id && id === playlistId) await toggle();
    else await start(song, songs, id);
  };
  const next = (automatic = false) => {
    const index = queue.findIndex(song => song.id === track?.id);
    if (automatic && repeat === 'one' && track) { void start(track, queue, playlistId); return; }
    if (shuffle && queue.length > 1) {
      const others = queue.filter(song => song.id !== track?.id);
      void start(others[Math.floor(Math.random() * others.length)], queue, playlistId);
    } else if (index >= 0 && index + 1 < queue.length) void start(queue[index + 1], queue, playlistId);
    else if (repeat === 'all' && queue.length) void start(queue[0], queue, playlistId);
  };
  const previous = () => {
    const index = queue.findIndex(song => song.id === track?.id);
    if (playback.current > 3 || index <= 0) void playback.seek(0);
    else void start(queue[index - 1], queue, playlistId);
  };
  useEffect(() => { if (playback.status.didJustFinish) next(true); }, [playback.status.didJustFinish]);
  useEffect(() => () => { request.current += 1; release.current(); }, []);
  const canNext = queue.length > 0 && (repeat === 'all' || (shuffle && queue.length > 1) || queue.findIndex(song => song.id === track?.id) + 1 < queue.length);
  const clear = () => { request.current += 1; playback.player.pause(); playback.player.replace(null); release.current(); release.current = () => {}; setTrack(null); setQueue([]); setPlaylistId(''); setLoading(false); };
  return { ...playback, clear, track, playlistId, queue, loading, start, toggle, playTrack, next, previous, canNext, shuffle, setShuffle, repeat, setRepeat };
}
