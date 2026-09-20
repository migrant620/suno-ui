import { useProfilePickerRecovery } from './useProfilePickerRecovery';
import { reuseDraft } from './reuseDraft';
import { useAttachmentCleanup } from './useAttachmentCleanup';
import { HookPlayer } from './HookPlayer';
import { exampleHooks, ExampleHook, decodeHook } from './hookData';
import { useHookPreferences } from './useHookPreferences';
import { InspirationRecorder } from './InspirationRecorder';
import { HookCollection } from './HookCollection';
import { HookCollectionId, hookCollection } from './hookCollections';
import { MainNavigation } from './MainNavigation';
import { PhotoToSong } from './PhotoToSong';
import { CreateModelMenu } from './CreateModelMenu';
import { ModelOffer } from './ModelOffer';
import { CreateHeader } from './CreateHeader';
import { useCreditPromotion } from './useCreditPromotion';
import { LocalSession } from './LocalSession';
import { ThemeProvider, ThemeColors, ThemedSurface, LightSurface, useTheme } from './Theme';
import { SubscriptionFlow } from './SubscriptionFlow';
import { useDemoEntitlements, MusicModel } from './useDemoEntitlements';
import { AddToPlaylist } from './AddToPlaylist';
import { Recorder } from './Recorder';
import { Voice } from './Voice';
import { PublicVoice, voiceById } from './voiceData';
import { AddToSongMenu } from './AddToSongMenu';
import { CreateOptions } from './CreateOptions';
import { MediaChip } from './MediaChip';
import { useMediaDraft } from './useMediaDraft';
import { readMediaFile, releaseMediaSource } from './mediaFiles';
import { MediaKind } from './mediaTypes';
import { useOwnVoices } from './useOwnVoices';
import { VoiceDetails } from './VoiceDetails';
import { VoiceAttachment } from './VoiceAttachment';
import { Discovery } from './Discovery';
import { Search, SearchPhase } from './Search';
import { useSearchHistory } from './useSearchHistory';
import { CreatorProfile } from './CreatorProfile';
import { ExampleCreator, creatorById, decodeSharedProfile, exampleCreators } from './creatorData';
import { Profile } from './Profile';
import { Notifications } from './Notifications';
import { useNotificationAccess } from './useNotificationAccess';
import { useLocalProfile } from './useLocalProfile';
import { useCommunity } from './useCommunity';
import { ExampleCreation } from './ExampleCreation';
import { SongActions } from './SongActions';
import { PlaylistShare } from './PlaylistShare';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Library, LibraryRoute } from './Library';
import { useLibrary } from './useLibrary';
import { useLibraryPlayback } from './useLibraryPlayback';
import { LibraryPlayer } from './LibraryPlayer';
import { LibraryMiniPlayer } from './LibraryMiniPlayer';
import * as Linking from 'expo-linking';
import { decodeSharedPlaylist } from './playlistSharing';
import AsyncStorage from './accountStorage';
import { CreationBackground } from './CreationBackground';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { EditorKind, hasContent, initialDraft, reducer } from './state';
import { useEnhancement } from './Enhancement';
import { AudioAttachment, AudioChip, AudioConfirm, SongPicker, useTrackPlayback } from './Audio';
import { AudioTrack } from './audioData';
import { useAudioDraft } from './useAudioDraft';
import { TextEditor } from './TextEditor';
import { Accent, C, Icon, IconButton, IconName, Label, Pill, S, Sheet } from './ui';
const DRAFT_KEY = 'suno-ui:local-draft:v1';
const suggestions = [['flute', 'male voice', 'piano', 'synthwave'], ['japanese', 'rap', 'dreamy', 'acoustic'], ['ambient', 'indie folk', 'warm bass', 'jazz']];
type Overlay = 'add' | 'create-options' | 'audio' | 'voice' | 'model' | 'model-offer' | 'upgrade' | 'help' | 'record' | 'generation' | null;
export default function App() {
    const [fontsLoaded, fontError] = useFonts({ InstrumentSerif: require('../assets/fonts/InstrumentSerif-Regular.ttf'), RobotoRegular: require('../assets/fonts/Roboto_400Regular.ttf'), RobotoMedium: require('../assets/fonts/Roboto_500Medium.ttf'), RobotoBold: require('../assets/fonts/Roboto_700Bold.ttf') });
    return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><ThemeProvider>
    <StatusBar style="dark"/>
    {fontsLoaded ? <LocalSession><CreationApp /></LocalSession> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface }}>{fontError ? <Label>Font loading failed. Reload to retry.</Label> : <ActivityIndicator color={C.ink}/>}</View>}
  </ThemeProvider></SafeAreaProvider></GestureHandlerRootView>;
}
function CreationApp() {
    const theme = useTheme();
    const C = theme.colors;
    const A = styles(C);
    const disc = theme.dark ? '#FFFFFF08' : '#1010120F';
    const menuInk = theme.dark ? C.ink : '#2E2E33';
    const [state, dispatch] = useReducer(reducer, undefined, initialDraft);
    const enhancement = useEnhancement(state, dispatch);
    const [ready, setReady] = useState(false);
    const [storageError, setStorageError] = useState(false);
    const draftPersisted = useRef<string | null>(null);
    const draftRestoreFailed = useRef(false);
    const [editor, setEditor] = useState<{
        kind: EditorKind;
        entry: 'editor' | 'saved' | 'save';
    } | null>(null);
    const [overlay, setOverlay] = useState<Overlay>(null);
    const addAnchor = useRef<View>(null);
    const [tab, setTab] = useState<'create' | 'library' | 'hooks' | 'search' | 'profile'>('create');
    const [libraryRoute, setLibraryRoute] = useState<LibraryRoute>('home');
    const library = useLibrary();
    const account = useLocalProfile();
    const profileRecovery = useProfilePickerRecovery(account.ready, account.profile.shareId, () => setTab('profile'));
    const entitlements = useDemoEntitlements();
    const promotion = useCreditPromotion();
    const community = useCommunity();
    const notificationAccess = useNotificationAccess();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilter, setSearchFilter] = useState('All');
    const [searchPhase, setSearchPhase] = useState<SearchPhase>('discover');
    const searchScroll = useRef<Record<string, number>>({});
    const searchHistory = useSearchHistory();
    const [creatorOpen, setCreatorOpen] = useState(false);
    const [voiceDetail, setVoiceDetail] = useState<PublicVoice | null>(null);
    const ownVoices = useOwnVoices();
    const selectedVoice = voiceById(state.voiceId) || ownVoices.voices.find(voice => voice.id === state.voiceId);
    const ownCreator: ExampleCreator = { id: 'local-owner', name: account.profile.name, handle: account.profile.handle || 'm620-demo', avatar: account.profile.avatarUri ? { uri: account.profile.avatarUri } : require('../assets/demo-avatar.png'), cover: account.profile.coverUri ? { uri: account.profile.coverUri } : require('../assets/creator-cover.png'), tracks: library.songs };
    const [creatorTarget, setCreatorTarget] = useState<ExampleCreator>(exampleCreators[0]);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => { show.remove(); hide.remove(); };
    }, []);
    const [searchPlaylistOrigin, setSearchPlaylistOrigin] = useState<LibraryRoute | null>(null);
    const [photoOpen, setPhotoOpen] = useState(false);
    const [photoInspiration, setPhotoInspiration] = useState<'photo' | 'love'>('photo');
    const [bedtimeOpen, setBedtimeOpen] = useState(false);
    const [hookCollectionId, setHookCollectionId] = useState<HookCollectionId | null>(null);
    const hooksScroll = useRef<Record<string, number>>({});
    const hookPositions = useRef<Record<string, number>>({});
    const hookPreferences = useHookPreferences();
    const [incomingHook, setIncomingHook] = useState<ExampleHook | null>(null);
    const [hookExpanded, setHookExpanded] = useState(false);
    const [hookCreator, setHookCreator] = useState(false);
    const [hookId, setHookId] = useState('');
    const ownHooks: ExampleHook[] = hookPreferences.data.created.map(item => {
        const template = exampleHooks.find(clip => clip.track.id === item.templateId);
        return template ? { ...template, id: item.id, creatorId: 'local-profile', caption: item.caption, track: library.tracks.find(track => track.id === item.songId) || { ...template.track, title: item.title } } : null;
    }).filter((clip): clip is ExampleHook => !!clip);
    const hooks = [...(incomingHook ? [incomingHook] : []), ...ownHooks, ...exampleHooks].filter(clip => !hookPreferences.data.hiddenCreators.includes(clip.creatorId) && !hookPreferences.data.skipped.includes(clip.id));
    const currentHook = hooks.find(clip => clip.id === hookId) || hooks[0];
    const moveHook = (direction: number) => { if (!currentHook || !hooks.length)
        return; const index = hooks.findIndex(clip => clip.id === currentHook.id); setHookId(hooks[(index + direction + hooks.length) % hooks.length].id); };
    const [searchNotifications, setSearchNotifications] = useState(false);
    useEffect(() => {
        if (Platform.OS !== 'web' || !searchNotifications)
            return;
        const escape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.isComposing || document.querySelector('[aria-modal="true"]'))
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            setSearchNotifications(false);
        };
        window.addEventListener('keydown', escape, true);
        return () => window.removeEventListener('keydown', escape, true);
    }, [searchNotifications]);
    const [globalSongOptions, setGlobalSongOptions] = useState<AudioTrack | null>(null);
    const [globalPlaylistTrack, setGlobalPlaylistTrack] = useState<AudioTrack | null>(null);
    const [globalSharing, setGlobalSharing] = useState<AudioTrack | null>(null);
    const [collapsed, setCollapsed] = useState({ lyrics: false, styles: false });
    const [suggestionSet, setSuggestionSet] = useState(0);
    const media = useMediaDraft();
    const [pickingMedia, setPickingMedia] = useState(false);
    const pickerPending = useRef(false);
    const pickerEpoch = useRef(0);
    const mediaAlive = useRef(true);
    useEffect(() => { pickerEpoch.current++; media.cancel(); }, [tab]);
    useEffect(() => { mediaAlive.current = true; return () => { mediaAlive.current = false; pickerEpoch.current++; }; }, []);
    const [notice, setNotice] = useState('');
    const [songPicker, setSongPicker] = useState(false);
    const { audio, setAudio, audioEdit, setAudioEdit, adoptSelection: adoptAudioSelection, snapshot: audioSnapshot, ready: audioReady, error: audioStorageError, unavailable: audioUnavailable, discarding: discardingAudio, discardUnavailableAudio } = useAudioDraft();
    const attachmentCleanup = useAttachmentCleanup();
    const [removingAudio, setRemovingAudio] = useState(false);
    const audioPlayback = useTrackPlayback(audio);
    const libraryPlayer = useLibraryPlayback(() => audioPlayback.player.pause());
    const [playerOpen, setPlayerOpen] = useState(false);
    useEffect(() => { if (audioPlayback.status.playing)
        libraryPlayer.player.pause(); }, [audioPlayback.status.playing]);
    const hookOwnsPlayback = tab === 'hooks' && hookExpanded && !hookCreator && !hookCollectionId && !playerOpen;
    useEffect(() => { if (hookOwnsPlayback) {
        audioPlayback.player.pause();
        libraryPlayer.player.pause();
    } }, [hookOwnsPlayback, audioPlayback.status.playing, libraryPlayer.status.playing]);
    const incomingURL = Linking.useLinkingURL();
    useEffect(() => {
        if (!incomingURL)
            return;
        const params = Linking.parse(incomingURL).queryParams;
        if (typeof params?.hook === 'string') {
            const clip = decodeHook(params.hook);
            if (!clip) {
                setNotice('This Hook link could not be opened.');
                return;
            }
            setIncomingHook(clip);
            setHookId(clip.id);
            setHookExpanded(true);
            setTab('hooks');
            return;
        }
        if (typeof params?.profile === 'string' || typeof params?.creator === 'string') {
            const target = typeof params.profile === 'string' ? decodeSharedProfile(params.profile) : creatorById(params.creator as string);
            if (!target) {
                setNotice('This profile link could not be opened.');
                return;
            }
            setCreatorTarget(target);
            setCreatorOpen(true);
            setTab('search');
            return;
        }
        const raw = Linking.parse(incomingURL).queryParams?.playlist;
        if (typeof raw !== 'string')
            return;
        const shared = decodeSharedPlaylist(raw);
        if (!shared) {
            setNotice('This shared playlist link could not be opened.');
            return;
        }
        library.setShared(shared);
        setLibraryRoute('shared');
        setTab('library');
    }, [incomingURL]);
    const [pendingAudio, setPendingAudio] = useState<AudioTrack | null>(null);
    const updateAudioEdit = useCallback((mode: 'Cover' | 'Extend', start: number) => setAudioEdit({ mode, start }), []);
    const selectAudio = (track: AudioTrack) => {
        setSongPicker(false);
        setAudio(track);
        if (track.styles || track.lyrics) {
            if (state.mode === 'Simple' && !state.lyrics.value && !state.styles.value) {
                dispatch({ type: 'edit', kind: 'lyrics', value: track.lyrics });
                dispatch({ type: 'edit', kind: 'styles', value: track.styles });
            }
            else
                setPendingAudio(track);
        }
    };
    useEffect(() => {
        let active = true;
        AsyncStorage.getItem(DRAFT_KEY).then(raw => {
            if (!active)
                return;
            draftPersisted.current = raw;
            if (!raw)
                return;
            const saved = JSON.parse(raw);
            if (saved && ['Simple', 'Advanced'].includes(saved.mode) && typeof saved.prompt === 'string' && Array.isArray(saved.saved) && saved.lyrics && saved.styles)
                dispatch({ type: 'restore', draft: saved });
        }).catch(() => { if (active) {
            draftRestoreFailed.current = true;
            setStorageError(true);
        } }).finally(() => { if (active)
            setReady(true); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (!ready || draftRestoreFailed.current)
            return;
        const raw = JSON.stringify(state);
        if (raw === draftPersisted.current)
            return;
        AsyncStorage.setItem(DRAFT_KEY, raw).then(() => { draftPersisted.current = raw; setStorageError(false); }).catch(() => setStorageError(true));
    }, [state, ready]);
    useEffect(() => {
        const listener = BackHandler.addEventListener('hardwareBackPress', () => {
            if (voiceDetail) {
                setVoiceDetail(null);
                return true;
            }
            if (overlay) {
                setOverlay(null);
                return true;
            }
            if (searchNotifications) {
                setSearchNotifications(false);
                return true;
            }
            if (tab === 'hooks' && currentHook && (hookCollectionId || hookExpanded || hookCreator))
                return false;
            if (tab === 'search' && creatorOpen) {
                setCreatorOpen(false);
                return true;
            }
            if (tab === 'hooks' && !currentHook) {
                setTab('create');
                return true;
            }
            if (tab === 'search' && searchPhase !== 'discover') {
                setSearchQuery('');
                setSearchFilter('All');
                setSearchPhase('discover');
                return true;
            }
            if (tab !== 'create' && (tab !== 'library' || libraryRoute === 'home')) {
                setTab('create');
                return true;
            }
            return false;
        });
        return () => listener.remove();
    }, [voiceDetail, overlay, tab, libraryRoute, creatorOpen, searchPhase, searchNotifications, hookCollectionId, hookExpanded, hookCreator, !!currentHook]);
    const switchMode = () => { Keyboard.dismiss(); dispatch({ type: 'mode' }); };
    const openEditor = (kind: EditorKind, entry: 'editor' | 'saved' | 'save' = 'editor') => { Keyboard.dismiss(); setEditor({ kind, entry }); };
    const openVoice = () => { Keyboard.dismiss(); audioPlayback.player.pause(); libraryPlayer.player.pause(); setOverlay('voice'); };
    const chooseDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
            if (!result.canceled) {
                const asset = result.assets[0];
                selectAudio({ id: `upload-${Date.now()}`, title: asset.name, source: { uri: asset.uri }, styles: '', lyrics: '' });
                setOverlay(null);
            }
        }
        catch {
            setNotice('The file could not be opened. Please try again.');
        }
    };
    const chooseMedia = async (kind: MediaKind) => {
        if (pickerPending.current || media.busy || !media.ready)
            return;
        pickerPending.current = true;
        media.setPickerOpen(true);
        const selection = ++pickerEpoch.current;
        setPickingMedia(true);
        setOverlay(null);
        const active = () => mediaAlive.current && selection === pickerEpoch.current;
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: [kind], quality: 1 });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                if (active())
                    await media.select(asset.uri, asset.fileName || (kind === 'images' ? 'Selected image' : 'Selected video'), kind, active);
                else
                    await releaseMediaSource(asset.uri);
            }
        }
        catch {
            if (active())
                setNotice('The media library could not be opened. Please try again.');
        }
        finally {
            pickerPending.current = false;
            media.setPickerOpen(false);
            if (mediaAlive.current)
                setPickingMedia(false);
        }
    };
    const clearDraft = async () => {
        if (media.busy || pickingMedia)
            return;
        if (!await media.discard())
            return;
        dispatch({ type: 'clear' });
        setAudio(null);
        setAudioEdit({ mode: 'Cover', start: 0 });
    };
    const reuseTrack = async (track: AudioTrack, withAudio: boolean, isActive: () => boolean = () => true) => {
        if (pickerPending.current || media.busy || !media.ready || !audioReady || !ready || draftRestoreFailed.current || !isActive())
            return false;
        setNotice('');
        libraryPlayer.player.pause();
        if (withAudio) {
            const selection = pickerEpoch.current;
            const active = () => mediaAlive.current && selection === pickerEpoch.current && isActive();
            try {
                const next = reducer(state, { type: 'remix', track });
                const saved = await reuseDraft(track, next, { [DRAFT_KEY]: draftPersisted.current, 'suno-ui:audio-draft:v1': audioSnapshot(), 'suno-ui:media-draft:v1': media.snapshot() }, active);
                draftPersisted.current = saved.records[DRAFT_KEY];
                adoptAudioSelection(saved.track, saved.edit, saved.records['suno-ui:audio-draft:v1']!);
                dispatch({ type: 'restore', draft: next });
                await media.refreshAfterReuse();
                await attachmentCleanup.refresh();
                if (!active())
                    return false;
            }
            catch (error) {
                if (active())
                    setNotice(error instanceof Error ? error.message : 'The remix could not be saved. Try again.');
                return false;
            }
        }
        else {
            dispatch({ type: 'edit', kind: 'lyrics', value: track.lyrics });
            dispatch({ type: 'edit', kind: 'styles', value: track.styles });
        }
        setVoiceDetail(null);
        setTab('create');
        return true;
    };
    const openPlaylist = (id: string) => { setLibraryRoute(id ? `playlist:${id}` : 'playlists'); setTab('library'); };
    const mediaBusy = media.busy || pickingMedia;
    const canCreate = (hasContent(state) || !!media.draft || !!audio) && !mediaBusy && !media.error;
    const mediaChip = media.draft && <MediaChip draft={media.draft} preview={media.preview} busy={mediaBusy} onReplace={() => void chooseMedia(media.draft!.kind)} onRemove={() => void media.discard()}/>;
    const hasDraft = hasContent(state) || !!media.draft || !!media.error || !!audio || !!state.title || !!selectedVoice || !!state.vocalGender;
    const section = (kind: EditorKind) => {
        const h = state[kind];
        const title = kind === 'lyrics' ? 'Lyrics' : 'Styles';
        return <View style={A.section} key={kind}>
      <View style={[S.row, A.sectionHeader]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${collapsed[kind] ? 'Expand' : 'Collapse'} ${title}`} onPress={() => setCollapsed(c => ({ ...c, [kind]: !c[kind] }))} style={[S.row, { flex: 1, gap: 6 }]}><Icon name={collapsed[kind] ? 'chevron-right' : 'chevron-down'} size={20}/><Label style={A.sectionTitle}>{title}</Label></Pressable>
        {h.past.length > 0 && <IconButton name="undo" label={`Undo ${title}`} onPress={() => dispatch({ type: 'undo', kind })} circle={disc}/>}
        {!!h.value.trim() && <>
          <IconButton name={state.saved.some(item => item.kind === kind && item.value === h.value) ? 'bookmark' : 'bookmark-outline'} label={`Save ${kind === 'lyrics' ? 'Lyrics' : 'Style'}`} onPress={() => openEditor(kind, 'save')} circle={disc}/>
          <IconButton name="delete" label={`Reset ${title}`} onPress={() => dispatch({ type: 'reset', kind })} circle={disc}/>
        </>}
        {enhancement.pending === kind ? <View style={A.circleTarget}><View style={[A.disc, { backgroundColor: disc }]}/><ActivityIndicator color={C.ink}/></View> : <IconButton name="auto-fix" label={`Enhance ${title}`} disabled={!!enhancement.pending} onPress={() => enhancement.request(kind)} color={C.surface} circle={C.ink}/>}
      </View>
      {collapsed[kind] ? <Label style={A.summary}>{kind === 'lyrics' && state.instrumental ? 'Instrumental track - Lyrics disabled' : h.value || (kind === 'lyrics' ? 'Write lyrics or a prompt' : 'Describe your style')}</Label> : <>
        <TextInput multiline accessibilityLabel={`${title} input`} value={h.value} onChangeText={value => dispatch({ type: 'edit', kind, value })} style={[A.input, { minHeight: 67, marginHorizontal: -5 }]} placeholder={kind === 'lyrics' ? 'Write lyrics or a prompt' : 'Describe what you want your song to sound like'} placeholderTextColor={theme.dark ? '#766964' : C.disabled} selectionColor={C.primary}/>
        <View style={[A.sectionFooter, kind === 'styles' && { marginTop: 5 }]}>
          <IconButton name="bookshelf" label={`Saved ${title}`} onPress={() => openEditor(kind, 'saved')} circle={disc}/>
          {kind === 'lyrics' ? <Pressable accessibilityRole="checkbox" accessibilityLabel="Instrumental" aria-checked={state.instrumental} accessibilityState={{ checked: state.instrumental }} onPress={() => { dispatch({ type: 'instrumental' }); if (!state.instrumental)
                    setCollapsed(c => ({ ...c, lyrics: true })); }} style={A.instrumentalTarget}><View style={[A.instrumental, state.instrumental && { backgroundColor: C.ink }]}><Icon name="check-circle" color={state.instrumental ? C.primary : C.ink} size={20}/><Label style={[A.sectionTitle, { fontSize: 14.75 }, state.instrumental && { color: C.surface }]}>Instrumental</Label></View></Pressable> : <>
            <IconButton name="autorenew" label="Shuffle suggestions" onPress={() => setSuggestionSet(i => (i + 1) % suggestions.length)} circle={disc} style={{ marginLeft: 4 }}/>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingLeft: 4, alignItems: 'center' }}>
              {suggestions[suggestionSet].filter(word => !state.styles.value.split(', ').includes(word)).map(word => <Pressable key={word} accessibilityRole="button" onPress={() => dispatch({ type: 'edit', kind: 'styles', value: [state.styles.value, word].filter(Boolean).join(', ') })} style={A.suggestionTarget}><View style={A.suggestion}><Label style={{ fontSize: 13, lineHeight: 16 }}>{word}</Label></View></Pressable>)}
            </ScrollView>
          </>}
          <View style={{ flex: kind === 'lyrics' ? 1 : 0 }}/>
          <IconButton name="fullscreen" label={`Expand ${title} editor`} onPress={() => openEditor(kind)} circle={disc}/>
        </View>
      </>}
    </View>;
    };
    const recoveryError = profileRecovery.error || (!profileRecovery.ready && account.error);
    if (recoveryError)
        return <View style={A.loading}><Label accessibilityRole="alert">{recoveryError}</Label><Pressable accessibilityRole="button" accessibilityLabel="Retry profile recovery" onPress={() => { if (!account.ready)
            account.retry();
        else
            void profileRecovery.retry(); }} style={{ padding: 16 }}><Label>Retry</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Discard unsaved profile recovery" onPress={() => void profileRecovery.discard()} style={{ padding: 16 }}><Label>Discard unsaved changes</Label></Pressable></View>;
    if (!ready || !audioReady || !media.ready || !profileRecovery.ready)
        return <View style={A.loading}><ActivityIndicator accessibilityLabel="Loading saved draft" color={C.ink}/></View>;
    return <View style={A.desktop}><View style={A.app}>
    {tab === 'create' && <CreationBackground dark={theme.dark} reduceMotion={account.profile.reduceMotion}/>}
    <ThemedSurface><SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: tab === 'hooks' && !hookCollectionId && !hookCreator && !searchNotifications ? '#101012' : (tab === 'profile' || searchNotifications) ? theme.colors.surface : 'transparent' }}>
      <StatusBar style={(tab === 'hooks' && !hookCollectionId && !hookCreator && !searchNotifications) || theme.dark ? 'light' : 'dark'}/>
      <View style={{ flex: 1 }}><View style={{ flex: 1 }} pointerEvents={searchNotifications ? 'none' : 'auto'} importantForAccessibility={searchNotifications ? 'no-hide-descendants' : 'auto'} aria-hidden={searchNotifications}>
      {tab === 'create' ? <>
        <CreateHeader modelOpen={overlay === 'model'} mode={state.mode} model={entitlements.data.model} freePlan={entitlements.ready && entitlements.data.plan === 'Free'} promotion={promotion} onMode={switchMode} onModel={() => { Keyboard.dismiss(); setOverlay('model'); }} onOffer={() => { Keyboard.dismiss(); setOverlay('upgrade'); }}/>
        {state.mode === 'Simple' ? <View style={A.simpleCard}>
          <View style={A.chips}>
            <View ref={addAnchor} collapsable={false} style={A.addTarget}><View pointerEvents="none" style={A.addCircle}/><IconButton name="plus" label="Add to Song" onPress={() => { Keyboard.dismiss(); setOverlay('add'); }}/></View>
            {mediaChip}
            {selectedVoice && <Pill title={selectedVoice.name} icon="account-voice" active onPress={() => setVoiceDetail(selectedVoice)} onRemove={() => dispatch({ type: 'voice', id: null })}/>}
            {audio && <AudioChip track={audio} playback={audioPlayback} onRemove={() => setRemovingAudio(true)}/>}
            {!!state.vocalGender && <Pill title={`${state.vocalGender} vocal`} icon="tune-vertical" active onPress={() => setOverlay('create-options')} onRemove={() => dispatch({ type: 'gender', value: null })}/>}
            {!!state.title && <Pill title={state.title} icon="music-note" active onPress={() => setOverlay('create-options')} onRemove={() => dispatch({ type: 'field', field: 'title', value: '' })}/>}
            {(['lyrics', 'styles'] as EditorKind[]).sort((a, b) => Number(!!state[b].value) - Number(!!state[a].value)).map(kind => <Pill key={kind} title={kind === 'lyrics' ? 'Lyrics' : 'Styles'} icon={kind === 'lyrics' ? 'playlist-music' : 'music-circle-outline'} active={!!state[kind].value} onPress={() => openEditor(kind)} onRemove={() => dispatch({ type: 'reset', kind })}/>)}
            {!audio && <Pill title="Audio" icon="waveform" onPress={() => { audioPlayback.player.pause(); setOverlay('audio'); }}/>}
          </View>
          <TextInput accessibilityLabel="Song description" multiline value={state.prompt} onChangeText={value => dispatch({ type: 'field', field: 'prompt', value })} style={[A.input, { flex: 1, marginTop: 8 }]} placeholder={media.draft?.kind === 'images' ? 'Take my vacation photo and turn into a song' : media.draft?.kind === 'videos' ? 'Turn my night out video into an anthem' : 'An acoustic love song'} placeholderTextColor={theme.dark ? '#766964' : C.disabled} selectionColor={C.primary}/>
          <IconButton name="help-circle" label="Learn what Create can do" onPress={() => setOverlay('help')} style={A.help} color={theme.dark ? C.handle : '#5B5B62'}/>
        </View> : <ScrollView style={{ flex: 1 }} contentContainerStyle={A.advancedContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {mediaChip && <View style={{ alignSelf: 'flex-start' }}>{mediaChip}</View>}
          {(!audio || !selectedVoice) && <View style={{ flexDirection: 'row', gap: 8 }}>{!audio && <Pressable accessibilityRole="button" onPress={() => setOverlay('audio')} style={A.attachment}><Icon name="plus" size={24}/><Label>Audio</Label></Pressable>}{!selectedVoice && <Pressable accessibilityRole="button" onPress={() => openVoice()} style={A.attachment}><Icon name="plus" size={24}/><Label>Voice</Label></Pressable>}</View>}
          {audio && <AudioAttachment key={audio.id} track={audio} playback={audioPlayback} mode={audioEdit.mode} start={audioEdit.start} onRemove={() => { setAudio(null); setAudioEdit({ mode: 'Cover', start: 0 }); }} onExtendChange={updateAudioEdit}/>}
          {selectedVoice && <VoiceAttachment voice={selectedVoice} onRemove={() => dispatch({ type: 'voice', id: null })}/>}
          {section('lyrics')}{section('styles')}
          <View style={[A.titleInput, S.row]}><Icon name="music-note" color={C.disabled}/><TextInput accessibilityLabel="Song Title" value={state.title} onChangeText={value => dispatch({ type: 'field', field: 'title', value })} style={[A.input, { flex: 1, height: 46, fontSize: 14, lineHeight: 17, textAlignVertical: 'center' }]} placeholder="Song Title" placeholderTextColor={theme.dark ? '#766964' : C.disabled} selectionColor={C.primary}/></View>
        </ScrollView>}

        <View style={[A.createRow, state.mode === 'Advanced' && { marginTop: 0 }]}>
          {hasDraft && <IconButton name="delete" label="Clear all" disabled={mediaBusy} onPress={() => void clearDraft()} style={A.clear}/>}
          <Pressable accessibilityRole="button" accessibilityLabel="Create" disabled={!canCreate} accessibilityState={{ disabled: !canCreate }} onPress={() => setOverlay('generation')} style={{ flex: 1 }}>
            {canCreate ? <Accent style={A.create}><Icon name="music-note-plus" color={C.white} size={20}/><Label style={A.createText}>Create</Label></Accent> : <View style={[A.create, { backgroundColor: '#4D4D4D' }]}><Icon name="music-note-plus" color={C.disabled} size={20}/><Label style={[A.createText, { color: C.disabled }]}>Create</Label></View>}
          </Pressable>
        </View>
      </> : tab === 'hooks' ? hookCollectionId ? <LightSurface><HookCollection key={hookCollectionId} item={hookCollection(hookCollectionId)} library={library} player={libraryPlayer} onBack={() => setHookCollectionId(null)} onCreate={() => { setHookCollectionId(null); setTab('create'); }} onSongOptions={setGlobalSongOptions}/></LightSurface> : hookCreator ? <LightSurface><CreatorProfile scrollOffsets={hooksScroll} creator={currentHook?.creatorName ? { ...exampleCreators[0], id: currentHook.creatorId, name: currentHook.creatorName, shared: true, tracks: [currentHook.track] } : exampleCreators[0]} backLabel="Back to Hooks" account={account} player={libraryPlayer} onVoice={setVoiceDetail} onClose={() => setHookCreator(false)} onSongOptions={setGlobalSongOptions} onOpenPlayer={() => setPlayerOpen(true)}/></LightSurface> : !currentHook ? <View style={{ flex: 1, backgroundColor: '#101012', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}><Label style={{ color: '#FFFFFF' }}>No more local Hooks</Label><Pressable accessibilityRole="button" accessibilityLabel="Restore hidden Hooks" onPress={() => void hookPreferences.resetHidden()} style={{ padding: 16 }}><Label style={{ color: '#FFFFFF' }}>Restore hidden Hooks</Label></Pressable>{!!hookPreferences.error && <Label accessibilityRole="alert">{hookPreferences.error}</Label>}</View> : hookExpanded ? <LightSurface><HookPlayer key={currentHook.id} clip={currentHook} preferences={hookPreferences} account={account} community={community} library={library} active={!playerOpen && !searchNotifications && !globalSongOptions && !globalPlaylistTrack && !globalSharing} position={hookPositions} onBack={() => setHookExpanded(false)} onNext={() => moveHook(1)} onPrevious={() => moveHook(-1)} onSong={track => { void libraryPlayer.start(track, library.tracks, 'hooks-song'); setPlayerOpen(true); }} onCreator={() => currentHook.creatorId === 'local-profile' ? setTab('profile') : setHookCreator(true)} onRemix={reuseTrack} onCreated={id => setHookId(id)}/></LightSurface> : <LightSurface><Discovery clip={currentHook} active={!searchNotifications && !bedtimeOpen && !photoOpen && !playerOpen} videoPositions={hookPositions} onOpen={() => { audioPlayback.player.pause(); libraryPlayer.player.pause(); setHookExpanded(true); }} scrollOffsets={hooksScroll} onInspiration={kind => { Keyboard.dismiss(); if (kind === 'bedtime') {
            audioPlayback.player.pause();
            libraryPlayer.player.pause();
            setBedtimeOpen(true);
        }
        else {
            setPhotoInspiration(kind);
            setPhotoOpen(true);
        } }} onCollection={setHookCollectionId} onNotifications={() => setSearchNotifications(true)}/></LightSurface> : tab === 'search' ? creatorOpen ? <LightSurface><CreatorProfile scrollOffsets={searchScroll} onVoice={setVoiceDetail} key={creatorTarget.id} creator={creatorTarget} account={account} player={libraryPlayer} onClose={() => setCreatorOpen(false)} onSongOptions={setGlobalSongOptions} onOpenPlayer={() => setPlayerOpen(true)}/></LightSurface> : <Search history={searchHistory} commentCounts={Object.fromEntries(library.tracks.map(track => [track.id, community.data.comments.filter(comment => comment.trackId === track.id).length]))} library={library} player={libraryPlayer} query={searchQuery} setQuery={setSearchQuery} filter={searchFilter} setFilter={setSearchFilter} phase={searchPhase} setPhase={setSearchPhase} scrollOffsets={searchScroll} onSongOptions={setGlobalSongOptions} onProfile={creator => { setCreatorTarget(creator || exampleCreators[0]); setCreatorOpen(true); }} onPlaylist={id => { setSearchPlaylistOrigin(libraryRoute); openPlaylist(id); }} onInspiration={kind => { if (kind === 'photo') {
            Keyboard.dismiss();
            setPhotoInspiration('photo');
            setPhotoOpen(true);
        }
        else {
            setTab('create');
            setOverlay('record');
        } }} onNotifications={() => setSearchNotifications(true)} onOpenPlayer={() => setPlayerOpen(true)}/> : tab === 'profile' ? <Profile recovery={profileRecovery.session} onRecoveryClosed={profileRecovery.clear} ownVoices={ownVoices} onVoice={setVoiceDetail} account={account} entitlements={entitlements} library={library} player={libraryPlayer} onCreate={() => setTab('create')} onNotifications={() => setSearchNotifications(true)} onOpenPlayer={() => setPlayerOpen(true)} onSongOptions={setGlobalSongOptions}/> : <Library onDetailBack={searchPlaylistOrigin !== null ? () => { setLibraryRoute(searchPlaylistOrigin); setSearchPlaylistOrigin(null); setTab('search'); } : undefined} route={libraryRoute} onRoute={setLibraryRoute} onCreate={() => setTab('create')} library={library} player={libraryPlayer} onReuse={(track, withAudio) => { void reuseTrack(track, withAudio); }}/>}
      </View>{searchNotifications && <View style={StyleSheet.absoluteFill}><Notifications hooks={tab === 'hooks'} onCreate={() => { setSearchNotifications(false); setTab('create'); }} access={notificationAccess} songs={library.songs} onClose={() => setSearchNotifications(false)} onOpenSong={song => { void libraryPlayer.start(song, library.songs, 'activity'); setPlayerOpen(true); }}/></View>}</View>
      {libraryPlayer.track && tab !== 'create' && !(tab === 'hooks' && hookExpanded && !hookCreator) && <LibraryMiniPlayer player={libraryPlayer} onOpen={() => setPlayerOpen(true)}/>}
      {!((tab === 'search' || (tab === 'library' && libraryRoute === 'search')) && keyboardVisible) && !(tab === 'library' && (libraryRoute === 'liked' || libraryRoute === 'shared' || libraryRoute.startsWith('playlist:'))) && !(tab === 'hooks' && hookCollectionId) && <MainNavigation playback={libraryPlayer.track ? { track: libraryPlayer.track, playing: libraryPlayer.status.playing, onOpen: () => setPlayerOpen(true), onToggle: () => { void libraryPlayer.toggle(); } } : undefined} tab={tab} dark={(tab === 'hooks' && !searchNotifications && !hookCreator) || theme.dark} avatarUri={account.profile.avatarUri} onSelect={next => { Keyboard.dismiss(); setSearchNotifications(false); if (next === 'library')
        setSearchPlaylistOrigin(null); setTab(next); }}/>}
      {!!(storageError || audioStorageError || notice || media.error || mediaBusy || attachmentCleanup.error) && <View style={A.notice}>
        <Label accessibilityLiveRegion="polite" style={{ fontSize: 12 }}>{media.error || (mediaBusy ? 'Opening and saving media…' : notice || audioStorageError || attachmentCleanup.error || 'Draft storage is unavailable in this session.')}</Label>
        {!!attachmentCleanup.error && <Pressable accessibilityRole="button" accessibilityLabel="Retry attachment cleanup" accessibilityState={{ disabled: attachmentCleanup.busy, busy: attachmentCleanup.busy }} disabled={attachmentCleanup.busy} onPress={() => void attachmentCleanup.retry()} style={A.noticeAction}><Label style={{ fontSize: 13 }}>{attachmentCleanup.busy ? 'Cleaning up…' : 'Retry cleanup'}</Label></Pressable>}
        {!!media.error && <View style={{ flexDirection: 'row', gap: 12 }}><Pressable accessibilityRole="button" accessibilityLabel="Retry media change" onPress={() => void media.retry()} style={A.noticeAction}><Label style={{ fontSize: 13 }}>Retry</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Discard unavailable media" onPress={() => void media.discard()} style={A.noticeAction}><Label style={{ fontSize: 13 }}>Remove media</Label></Pressable></View>}
        {mediaBusy && <Pressable accessibilityRole="button" accessibilityLabel="Cancel media change" onPress={() => { pickerEpoch.current++; media.cancel(); }} style={A.noticeAction}><Label style={{ fontSize: 13 }}>Cancel</Label></Pressable>}
        {audioUnavailable && <Pressable accessibilityRole="button" accessibilityLabel="Discard unavailable audio" accessibilityState={{ disabled: discardingAudio }} disabled={discardingAudio} onPress={() => void discardUnavailableAudio()} style={A.noticeAction}><Label style={{ fontSize: 13 }}>{discardingAudio ? 'Discarding…' : 'Discard unavailable audio'}</Label></Pressable>}
        {!!notice && <IconButton name="close" label="Dismiss notice" onPress={() => setNotice('')} style={{ width: 32, height: 32, alignSelf: 'flex-end' }}/>}
      </View>}
    </SafeAreaView></ThemedSurface>

    {photoOpen && <LightSurface><PhotoToSong inspiration={photoInspiration} canSave={library.ready} onClose={() => setPhotoOpen(false)} onCreate={async (template, draft, prompt, isActive) => { const track = await library.createSample(template, draft.place, draft.style, prompt, undefined, isActive, { inputs: { mode: 'Simple', prompt, instrumental: false }, media: { id: draft.id, name: draft.name, kind: 'images', origin: 'photo' } }); if (!track)
        return false; setTab('library'); setLibraryRoute('home'); return true; }}/></LightSurface>}
    {playerOpen && <LibraryPlayer player={libraryPlayer} library={library} community={community} author={account.profile.name} onClose={() => { if (tab === 'hooks' && hookExpanded)
        libraryPlayer.player.pause(); setPlayerOpen(false); }} onReuse={(track, withAudio) => { void reuseTrack(track, withAudio); }}/>}
    {enhancement.dialog}
    {songPicker && <SongPicker songs={library.songs} likedSongs={library.tracks.filter(track => library.data.likedIds?.includes(track.id))} publicSongs={library.songs.filter(track => library.data.songs?.find(song => song.id === track.id)?.isPublic)} onClose={() => setSongPicker(false)} onSelect={selectAudio}/>}
    {removingAudio && <AudioConfirm title="Remove Audio?" description="Are you sure you want to remove and discard your audio?" confirm="Discard" cancel="Keep audio" onConfirm={() => { setAudio(null); setAudioEdit({ mode: 'Cover', start: 0 }); setRemovingAudio(false); }} onCancel={() => setRemovingAudio(false)}/>}
    {pendingAudio && <AudioConfirm title="Overwrite Lyrics & Styles?" description="This song has lyrics and styles. Do you want to replace your current lyrics and styles?" confirm="Overwrite" cancel="Keep Current" onCancel={() => setPendingAudio(null)} onConfirm={() => { dispatch({ type: 'edit', kind: 'lyrics', value: pendingAudio.lyrics }); dispatch({ type: 'edit', kind: 'styles', value: pendingAudio.styles }); setPendingAudio(null); }}/>}
    {editor && <ThemedSurface><TextEditor kind={editor.kind} entry={editor.entry} state={state} dispatch={dispatch} onClose={() => setEditor(null)}/></ThemedSurface>}
    {globalPlaylistTrack && <AddToPlaylist track={globalPlaylistTrack} library={library} onClose={() => setGlobalPlaylistTrack(null)}/>}
    {globalSongOptions && <SongActions track={globalSongOptions} liked={!!library.data.likedIds?.includes(globalSongOptions.id)} canRemove={false} onClose={() => setGlobalSongOptions(null)} onRemove={() => setGlobalSongOptions(null)} onLike={() => library.toggleLike(globalSongOptions.id)} onShare={() => { setGlobalSharing(globalSongOptions); setGlobalSongOptions(null); }} onReuse={audio => { void reuseTrack(globalSongOptions, audio); setGlobalSongOptions(null); }} onRadio={() => { void libraryPlayer.start(globalSongOptions, [globalSongOptions, ...library.tracks.filter(track => track.id !== globalSongOptions.id)], 'radio'); setGlobalSongOptions(null); }}/>}
    {globalSharing && <PlaylistShare tracks={[globalSharing]} playlist={{ id: 'shared-song', name: globalSharing.title, description: 'Local example song', songIds: [globalSharing.id], isPublic: false, createdAt: 0 }} onClose={() => setGlobalSharing(null)}/>}
    {overlay === 'model' && <ThemedSurface><CreateModelMenu model={entitlements.data.model} onClose={() => setOverlay(null)} onSelect={model => { if (model !== 'v6-mini' && entitlements.data.plan === 'Free')
        setOverlay('model-offer');
    else
        void entitlements.selectModel(model).then(() => setOverlay(null)).catch(() => setNotice('The model selection could not be saved. Try again.')); }}/></ThemedSurface>}
    {overlay === 'model-offer' && <ModelOffer onClose={() => setOverlay(null)} onUpgrade={() => setOverlay('upgrade')}/>}
    {overlay === 'upgrade' && <SubscriptionFlow initialRoute="plans" entitlements={entitlements} onClose={() => setOverlay(null)}/>}
    {voiceDetail && <LightSurface><VoiceDetails voice={voiceDetail} creator={voiceDetail.local ? ownCreator : creatorById(voiceDetail.creatorId)!} ownVoice={ownVoices.voices.find(voice => voice.id === voiceDetail.id)} account={account} songs={library.tracks} player={libraryPlayer} onClose={() => setVoiceDetail(null)} onUse={() => { audioPlayback.player.pause(); libraryPlayer.player.pause(); dispatch({ type: 'voice', id: voiceDetail.id }); setVoiceDetail(null); setTab('create'); }} onCreator={() => { if (voiceDetail.local) {
        setVoiceDetail(null);
        setTab('profile');
        return;
    } if (tab === 'profile') {
        setVoiceDetail(null);
        return;
    } setCreatorTarget(creatorById(voiceDetail.creatorId)!); setCreatorOpen(true); setVoiceDetail(null); setTab('search'); }} onSongOptions={setGlobalSongOptions}/></LightSurface>}
    {overlay === 'voice' && <LightSurface><Voice canCreate={ownVoices.ready} onCreate={async (track, isActive) => { const voice = await ownVoices.create(track, isActive); if (isActive()) {
        dispatch({ type: 'voice', id: voice.id });
        setOverlay(null);
        setTab('create');
        setNotice('Local Voice saved to your profile. No voice model was trained.');
    } }} ownerName={account.profile.handle || account.profile.name} songs={library.songs} publicSongs={library.songs.filter(track => library.data.songs?.find(song => song.id === track.id)?.isPublic)} likedSongs={library.tracks.filter(track => library.data.likedIds?.includes(track.id))} onClose={() => setOverlay(null)} onUse={track => { selectAudio(track); setOverlay(null); setNotice('Voice sample attached as local audio. Voice cloning is not connected.'); }}/></LightSurface>}
    {bedtimeOpen && <InspirationRecorder onClose={() => setBedtimeOpen(false)} onUse={track => { selectAudio(track); setBedtimeOpen(false); setTab('create'); }}/>}
    {overlay === 'record' && <Recorder onClose={() => setOverlay(null)} onUse={track => { selectAudio(track); setOverlay(null); }}/>}
    {overlay === 'generation' && <ExampleCreation mediaName={media.draft?.name} voiceName={selectedVoice?.name} title={state.title || state.prompt.trim().slice(0, 70) || 'Untitled'} ready={library.ready} onClose={() => setOverlay(null)} onCreate={async (templateId, isActive) => { const track = await library.createSample(templateId, state.title || state.prompt.trim().slice(0, 70) || 'Untitled', state.styles.value, state.lyrics.value, selectedVoice?.id, isActive, { inputs: { mode: state.mode, prompt: state.prompt, instrumental: state.instrumental, vocalGender: state.vocalGender }, media: media.draft ? { ...media.draft, origin: 'media' } : undefined }); if (track) {
        setOverlay(null);
        setTab('library');
        setLibraryRoute('home');
    } }}/>}
    {overlay === 'add' && <ThemedSurface><AddToSongMenu anchor={addAnchor} onClose={() => setOverlay(null)} onVoice={openVoice} onImage={() => void chooseMedia('images')} onVideo={() => void chooseMedia('videos')} onAdvanced={() => setOverlay('create-options')}/></ThemedSurface>}
    {overlay === 'create-options' && <ThemedSurface><CreateOptions gender={state.vocalGender} title={state.title} onGender={value => dispatch({ type: 'gender', value })} onTitle={value => dispatch({ type: 'field', field: 'title', value })} onClose={() => setOverlay(null)}/></ThemedSurface>}
    {overlay && overlay !== 'add' && overlay !== 'create-options' && overlay !== 'generation' && overlay !== 'model' && overlay !== 'model-offer' && overlay !== 'upgrade' && overlay !== 'record' && overlay !== 'voice' && <ThemedSurface><Sheet onClose={() => setOverlay(null)} compact handleHeight={48}>
      {overlay === 'audio' ? <View style={{ paddingBottom: 15 }}>{menuItem('Browse', 'music-box-multiple-outline', () => { setOverlay(null); setSongPicker(true); }, menuInk)}<View style={A.menuDivider}/>{menuItem('Upload', 'upload', chooseDocument, menuInk)}<View style={A.menuDivider}/>{menuItem('Record', 'microphone', () => { audioPlayback.player.pause(); libraryPlayer.player.pause(); setOverlay('record'); }, menuInk)}</View>
                : <View style={A.overlayMessage}><Label style={[S.heading, { marginBottom: 16 }]}>What can I do?</Label><Label>Describe a song in Simple mode, or shape your lyrics and styles in Advanced. Attach audio or media, then save a clearly labeled local example to your Library.</Label><Pressable accessibilityRole="button" onPress={() => setOverlay(null)} style={A.closeMessage}><Label>Close</Label></Pressable></View>}
    </Sheet></ThemedSurface>}
  </View></View>;
}
function menuItem(title: string, icon: IconName, onPress: () => void, color: string) {
    return <Pressable accessibilityRole="button" onPress={onPress} style={{ height: 56, marginHorizontal: 16, paddingHorizontal: 16, gap: 10, flexDirection: 'row', alignItems: 'center' }}><Icon name={icon} color={color}/><Label style={{ fontFamily: 'RobotoMedium', fontSize: 14, lineHeight: 17, color }}>{title}</Label></Pressable>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface },
    desktop: { flex: 1, backgroundColor: '#222126', alignItems: 'center' },
    app: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: C.surface, overflow: 'hidden' },
    simpleCard: { flex: 1, marginHorizontal: 16, borderWidth: 1, borderColor: C.surface === '#101012' ? '#FFFFFF20' : '#1010121A', borderRadius: 20, padding: 15, paddingBottom: 3 },
    addTarget: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    addCircle: { position: 'absolute', width: 40, height: 40, borderRadius: 999, backgroundColor: C.surface === '#101012' ? '#FFFFFF08' : '#1010120A' },
    help: { position: 'absolute', right: 3, bottom: 3 },
    chips: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 0, marginTop: -4 },
    input: { fontFamily: 'RobotoRegular', fontSize: 16, lineHeight: 20, color: C.ink, padding: 0, textAlignVertical: 'top', ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
    circle: { width: 40, height: 40, backgroundColor: C.surface === '#101012' ? '#FFFFFF08' : '#10101206', borderRadius: 999 },
    advancedContent: { paddingHorizontal: 16, gap: 16, paddingBottom: 16 },
    attachment: { flex: 1, height: 56, borderWidth: 1, borderColor: C.surface === '#101012' ? '#FFFFFF20' : '#1010121A', backgroundColor: C.surface === '#101012' ? '#FFFFFF08' : '#1010120D', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    section: { borderWidth: 1, borderColor: C.surface === '#101012' ? '#FFFFFF20' : '#1010121A', borderRadius: 20, padding: 20 },
    sectionTitle: { fontFamily: 'RobotoMedium', fontSize: 14, lineHeight: 17 },
    sectionHeader: { height: 48, marginTop: -4, marginLeft: -6, marginRight: -12, marginBottom: 15 },
    sectionFooter: { flexDirection: 'row', alignItems: 'center', height: 48, marginTop: 21, marginBottom: -5, marginHorizontal: -5 },
    circleTarget: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    disc: { position: 'absolute', width: 40, height: 40, borderRadius: 999 },
    instrumentalTarget: { height: 48, justifyContent: 'center', marginLeft: 8 },
    instrumental: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 40, paddingLeft: 14, paddingRight: 12, borderWidth: 1, borderColor: C.surface === '#101012' ? '#FFFFFF20' : '#1010121A', borderRadius: 999 },
    suggestionTarget: { height: 48, justifyContent: 'center' },
    suggestion: { borderRadius: 999, backgroundColor: C.surface === '#101012' ? C.control : '#1010120F', height: 40, paddingHorizontal: 16, justifyContent: 'center' },
    summary: { color: C.muted, fontSize: 14 },
    titleInput: { gap: 2, borderRadius: 20, height: 48, paddingLeft: 21, paddingRight: 16, borderWidth: 1, borderColor: C.surface === '#101012' ? '#FFFFFF20' : '#1010121A' },
    createRow: { margin: 16, marginBottom: 6, flexDirection: 'row', gap: 8 },
    create: { height: 56, borderRadius: 999, flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center' },
    createText: { color: C.white, fontFamily: 'RobotoMedium', fontSize: 19, lineHeight: 22 },
    clear: { width: 56, height: 56, borderRadius: 999, backgroundColor: C.surface === '#101012' ? C.control : '#10101230' },
    library: { flex: 1, backgroundColor: C.surface, padding: 24 },
    fileNote: { flexDirection: 'row', gap: 8, alignItems: 'center', marginHorizontal: 20, marginTop: 8 },
    notice: { padding: 8, backgroundColor: C.toolbar },
    noticeAction: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8 },
    menuRow: { height: 52, paddingHorizontal: 24, gap: 16, flexDirection: 'row', alignItems: 'center' },
    menuDivider: { height: 1, marginHorizontal: 16, backgroundColor: C.surface === '#101012' ? '#FFFFFF26' : '#B3B3B2' },
    pro: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, fontSize: 10 },
    overlayTitle: { paddingHorizontal: 24, marginBottom: 24 },
    overlayMessage: { padding: 24 },
    closeMessage: { marginTop: 24, backgroundColor: C.toolbar, borderRadius: 99, padding: 16, alignItems: 'center' },
});
