import { useEffect, useRef, useState } from 'react';
import { AudioTrack } from './audioData';
import { hasOfflinePlaylist, removeOfflinePlaylist, saveOfflinePlaylist } from './offlineStore';

export function usePlaylistDownload(playlistId: string, tracks: AudioTrack[]) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
  const [error, setError] = useState('');
  const task = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const scope = useRef(0);
  const membership = tracks.map(track => track.id).join('|');
  useEffect(() => {
    mounted.current = true;
    scope.current += 1;
    let active = true;
    hasOfflinePlaylist(playlistId, tracks).then(saved => { if (active) setStatus(saved ? 'downloaded' : 'idle'); }).catch(() => { if (active) setError('Offline storage could not be checked.'); });
    return () => { active = false; mounted.current = false; task.current?.abort(); };
  }, [playlistId, membership]);
  const download = async () => {
    if (task.current || !tracks.length) return;
    const controller = new AbortController();
    const version = scope.current;
    task.current = controller; setStatus('downloading'); setError('');
    try {
      await saveOfflinePlaylist(playlistId, tracks, controller.signal);
      if (mounted.current && scope.current === version) setStatus('downloaded');
    } catch {
      if (mounted.current && scope.current === version) { setStatus('idle'); if (!controller.signal.aborted) setError('The playlist could not be downloaded. Check your connection and retry.'); }
    } finally { if (task.current === controller) task.current = null; }
  };
  const remove = async () => {
    try { await removeOfflinePlaylist(playlistId); setStatus('idle'); setError(''); }
    catch { setError('Offline audio could not be removed. Try again.'); }
  };
  return { status, error, download, remove, cancel: () => task.current?.abort() };
}
