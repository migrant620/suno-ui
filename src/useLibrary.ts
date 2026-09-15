import { AudioTrack, exampleTracks } from './audioData';
import { SampleSong, sampleTrack } from './sampleSongs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { removeOfflinePlaylist } from './offlineStore';
import AsyncStorage, { withAccountMedia } from './accountStorage';
import { CreationSource } from './creationInputs';
import { prepareMedia, readMediaFile, removeMediaFile, saveMediaFile } from './mediaFiles';
import { readPhotoFile } from './photoFiles';
import { AppState, Platform } from 'react-native';
import { emptyLibrary, LibraryData, Playlist, readLibrary } from './libraryState';

const KEY = 'suno-ui:library:v1';
export function useLibrary() {
  const [data, setData] = useState<LibraryData>(emptyLibrary);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [shared, setShared] = useState<Playlist | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [likedOrigin, setLikedOrigin] = useState<'home' | 'playlists' | 'search'>('home');
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const apply = (next: LibraryData) => { dataRef.current = next; setData(next); };
  const queue = <T,>(operation: () => Promise<T>) => {
    const task = writes.current.catch(() => {}).then(operation);
    writes.current = task;
    return task;
  };
  const commit = (update: (current: LibraryData) => LibraryData) => queue(async () => {
    const raw = await AsyncStorage.updateItem(KEY, raw => JSON.stringify(update(raw ? readLibrary(raw) : emptyLibrary())));
    apply(readLibrary(raw)); setError('');
  });
  const edit = (update: (current: LibraryData) => LibraryData) => {
    void commit(update).catch(() => setError('Library changes could not be saved on this device. Try again.'));
  };
  const cleanupMedia = async () => {
    const raw = await AsyncStorage.getItem(KEY);
    const current = raw ? readLibrary(raw) : emptyLibrary();
    for (const media of current.removedMedia || []) {
      await removeMediaFile(media.id, media.kind);
      await AsyncStorage.updateItem(KEY, raw => {
        const latest = raw ? readLibrary(raw) : emptyLibrary();
        return JSON.stringify({ ...latest, removedMedia: latest.removedMedia?.filter(item => item.id !== media.id) });
      });
    }
  };
  const retryCleanup = () => queue(() => withAccountMedia(async () => {
    await cleanupMedia();
    const raw = await AsyncStorage.getItem(KEY); apply(raw ? readLibrary(raw) : emptyLibrary()); setError('');
  })).catch(() => setError('The song was removed, but its saved media could not be removed. Retry media cleanup.'));
  useEffect(() => {
    let active = true;
    const refresh = () => { void queue(async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (active) { const next = raw ? readLibrary(raw) : emptyLibrary(); apply(next); setReady(true); if (next.removedMedia?.length) void retryCleanup(); }
      } catch { if (active) setError('Your saved library could not be opened. Reload to retry.'); }
    }); };
    refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    const changed = (event: StorageEvent) => { if (event.key === KEY || event.key === null) refresh(); };
    if (Platform.OS === 'web') window.addEventListener('storage', changed);
    return () => { active = false; listener.remove(); if (Platform.OS === 'web') window.removeEventListener('storage', changed); };
  }, []);
  const create = useCallback((name: string, isPublic: boolean) => {
    if (!ready || !name.trim()) return null;
    const item: Playlist = { id: `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: name.trim(), isPublic, songIds: [], createdAt: Date.now() };
    edit(current => ({ ...current, playlists: [item, ...current.playlists] }));
    return item.id;
  }, [ready]);
  const update = useCallback((id: string, patch: Pick<Playlist, 'name' | 'isPublic' | 'description' | 'coverUri'>) => {
    if (!ready || !patch.name.trim()) return;
    edit(current => ({ ...current, playlists: current.playlists.map(item => item.id === id ? { ...item, ...patch, name: patch.name.trim() } : item) }));
  }, [ready]);
  const remove = useCallback(async (id: string) => {
    if (!ready) return false;
    try {
      await removeOfflinePlaylist(id);
      await commit(current => ({ ...current, playlists: current.playlists.filter(item => item.id !== id) }));
      return true;
    } catch { setError('The playlist could not be deleted because its offline files could not be removed. Try again.'); return false; }
  }, [ready]);
  const retainReceived = useCallback((current: LibraryData, songId: string): LibraryData => {
    if (current.songs?.some(song => song.id === songId) || current.receivedSongs?.some(song => song.id === songId)) return current;
    const song = shared?.songs?.find(song => song.id === songId);
    return song ? { ...current, receivedSongs: [...(current.receivedSongs || []), song] } : current;
  }, [shared]);
  const addSong = useCallback((playlistId: string, songId: string) => {
    if (!ready) return;
    edit(current => current.playlists.some(item => item.id === playlistId) ? ({ ...retainReceived(current, songId), playlists: current.playlists.map(item => item.id === playlistId && !item.songIds.includes(songId) ? { ...item, songIds: [...item.songIds, songId] } : item) }) : current);
  }, [ready, retainReceived]);
  const removeSong = useCallback((playlistId: string, songId: string) => {
    if (!ready) return;
    edit(current => ({ ...current, playlists: current.playlists.map(item => item.id === playlistId ? { ...item, songIds: item.songIds.filter(id => id !== songId) } : item) }));
  }, [ready]);
  const toggleLike = useCallback((songId: string) => {
    if (!ready) return;
    edit(current => ({ ...retainReceived(current, songId), likedIds: current.likedIds?.includes(songId) ? current.likedIds.filter(id => id !== songId) : [...(current.likedIds || []), songId] }));
  }, [ready, retainReceived]);
  const songs = (data.songs || []).map(sampleTrack);
  const tracks = [...songs, ...(data.receivedSongs || []).filter(song => !songs.some(own => own.id === song.id)).map(sampleTrack), ...exampleTracks];
  const createSample = async (templateId: string, title: string, styles: string, lyrics: string, voiceId?: string, isActive: () => boolean = () => true, source?: CreationSource) => {
    if (!ready || !exampleTracks.some(track => track.id === templateId)) throw new Error('Your library is not ready. Try again.');
    const song: SampleSong = { id: `local-song-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, templateId, title: title.trim().slice(0, 200) || 'Untitled', styles: styles.slice(0, 10000), lyrics: lyrics.slice(0, 30000), voiceId, isPublic: false, createdAt: Date.now(), ...(source ? { creation: { ...source.inputs, prompt: source.inputs.prompt.slice(0, 30000) } } : {}) };
    const attachment = source?.media ? { id: `media-song-${song.id.slice(11)}`, name: source.media.name.slice(0, 1000), kind: source.media.kind } : undefined;
    if (attachment) song.creation!.media = attachment;
    return queue(() => withAccountMedia(async () => {
      if (!isActive()) return null;
      let committed = false;
      try {
        if (source?.media && attachment) {
          const file = source.media.origin === 'photo' ? await readPhotoFile(source.media.id) : await readMediaFile(source.media.id, source.media.kind);
          try {
            await saveMediaFile(attachment.id, file.uri, attachment.kind);
            const copy = await readMediaFile(attachment.id, attachment.kind);
            try { const preview = await prepareMedia(copy.uri, attachment.kind); preview.release(); } finally { copy.release(); }
          } finally { file.release(); }
        }
        if (!isActive()) { if (attachment) await removeMediaFile(attachment.id, attachment.kind); return null; }
        let raw: string;
        try {
          raw = await AsyncStorage.updateItem(KEY, raw => {
            if (!isActive()) throw new Error('Saving canceled.');
            const current = raw ? readLibrary(raw) : emptyLibrary();
            return JSON.stringify({ ...current, songs: [song, ...(current.songs || [])] });
          });
          committed = true;
        } catch (cause) {
          const actual = await AsyncStorage.getItem(KEY);
          if (!actual || !readLibrary(actual).songs?.some(item => item.id === song.id)) throw cause;
          committed = true; raw = actual;
        }
        if (!isActive()) {
          raw = await AsyncStorage.updateItem(KEY, raw => {
            const current = raw ? readLibrary(raw) : emptyLibrary();
            return JSON.stringify({ ...current, songs: current.songs?.filter(item => item.id !== song.id), removedMedia: [...(current.removedMedia || []), ...(attachment ? [attachment] : [])] });
          });
          apply(readLibrary(raw)); await cleanupMedia(); return null;
        }
        apply(readLibrary(raw)); setError(''); return sampleTrack(song);
      } catch (cause) {
        if (!committed && attachment) {
          // Preserve the file when storage cannot establish whether its record committed.
          const raw = await AsyncStorage.getItem(KEY);
          if (!raw || !readLibrary(raw).songs?.some(item => item.id === song.id)) await removeMediaFile(attachment.id, attachment.kind);
        }
        throw cause;
      }
    }));
  };
  const deleteSong = (id: string) => queue(() => withAccountMedia(async () => {
    const raw = await AsyncStorage.updateItem(KEY, raw => {
      const current = raw ? readLibrary(raw) : emptyLibrary();
      const media = current.songs?.find(song => song.id === id)?.creation?.media;
      return JSON.stringify({ ...current, songs: current.songs?.filter(song => song.id !== id), likedIds: current.likedIds?.filter(songId => songId !== id), playlists: current.playlists.map(item => ({ ...item, songIds: item.songIds.filter(songId => songId !== id) })), removedMedia: [...(current.removedMedia || []), ...(media ? [media] : [])] });
    });
    apply(readLibrary(raw));
    try { await cleanupMedia(); const latest = await AsyncStorage.getItem(KEY); apply(latest ? readLibrary(latest) : emptyLibrary()); setError(''); }
    catch { setError('The song was removed, but its saved media could not be removed. Retry media cleanup.'); }
    return true;
  })).catch(() => { setError('The song could not be removed. Try again.'); return false; });
  const saveCollection = async (item: Playlist) => {
    if (!ready) return false;
    try {
      await commit(current => current.playlists.some(saved => saved.id === item.id) ? current : { ...current, playlists: [{ ...item, songIds: [...item.songIds] }, ...current.playlists] });
      return true;
    } catch { setError('The collection could not be saved. Try again.'); return false; }
  };
  return { data, ready, error, songs, tracks, createSample, deleteSong, retryCleanup, create, update, remove, addSong, removeSong, toggleLike, saveCollection, shared, setShared, view, setView, filter, setFilter, query, setQuery, searching, setSearching, likedOrigin, setLikedOrigin };
}
