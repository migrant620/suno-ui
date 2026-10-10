import Storage from './accountStorage';
import { AudioTrack, exampleTracks } from './audioData';
import { DraftRecords, DRAFT_CLEANUP_KEY } from './draftTransaction';
import { AttachmentCleanup, flushAttachmentCleanupLocked, parseAttachmentCleanup, serializeAttachmentCleanup } from './draftCleanup';
import { readDraftAudioFile, removeDraftAudioFile, saveDraftAudioFile } from './draftAudioFiles';
import { MediaDraft } from './mediaTypes';
import { prepareMedia, readMediaFile, removeMediaFile, saveMediaFile } from './mediaFiles';
import { withOfflineLock } from './offlineQueue';
import { Draft } from './state';
const audioKey = 'suno-ui:audio-draft:v1';
const mediaKey = 'suno-ui:media-draft:v1';
const textKey = 'suno-ui:local-draft:v1';
const example = (track: Pick<AudioTrack, 'id' | 'templateId'>) => exampleTracks.some(item => item.id === track.id || item.id === track.templateId);
export async function reuseDraft(track: AudioTrack, draft: Draft, expected: DraftRecords, isActive: () => boolean) {
    return withOfflineLock('remix-draft', async () => {
        const check = () => { if (!isActive())
            throw new Error('Remix cancelled'); };
        check();
        for (const key of [textKey, audioKey, mediaKey] as const) {
            if (await Storage.getItem(key) !== expected[key])
                throw new Error('Your draft changed. Reopen Remix before trying again.');
        }
        const cleanupBefore = await Storage.getItem(DRAFT_CLEANUP_KEY);
        const cleanup: AttachmentCleanup[] = parseAttachmentCleanup(cleanupBefore);
        let nextMedia: MediaDraft | null = null;
        let oldMedia: MediaDraft | null = null;
        let oldAudio: {
            track: AudioTrack;
        } | null = null;
        try {
            oldMedia = expected[mediaKey] ? JSON.parse(expected[mediaKey]!) : null;
        }
        catch { }
        try {
            oldAudio = expected[audioKey] ? JSON.parse(expected[audioKey]!) : null;
        }
        catch { }
        let copiedAudio = false;
        let committed = false;
        const edit = { mode: 'Cover' as const, start: 0 };
        const { source, cover, ...savedTrack } = track;
        const audioRecord = JSON.stringify({ track: savedTrack, edit });
        try {
            const attached = track.creation?.media;
            if (attached) {
                nextMedia = { id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: attached.name, kind: attached.kind };
                const borrowed = await readMediaFile(attached.id, attached.kind);
                try {
                    check();
                    const preview = await prepareMedia(borrowed.uri, attached.kind);
                    preview.release();
                    await saveMediaFile(nextMedia.id, borrowed.uri, attached.kind);
                    const saved = await readMediaFile(nextMedia.id, attached.kind);
                    try {
                        const decoded = await prepareMedia(saved.uri, attached.kind);
                        decoded.release();
                    }
                    finally {
                        saved.release();
                    }
                }
                finally {
                    borrowed.release();
                }
            }
            check();
            if (!example(track) && oldAudio?.track?.id !== track.id) {
                copiedAudio = true;
                await saveDraftAudioFile(track.id, track.source);
                const saved = await readDraftAudioFile(track.id);
                saved.release();
            }
            check();
            const records: DraftRecords = { [textKey]: JSON.stringify(draft), [audioKey]: audioRecord, [mediaKey]: nextMedia ? JSON.stringify(nextMedia) : null };
            if (oldMedia?.id && oldMedia.id !== nextMedia?.id)
                cleanup.push({ type: 'media', id: oldMedia.id, kind: oldMedia.kind });
            if (oldAudio?.track?.id && oldAudio.track.id !== track.id && !example(oldAudio.track))
                cleanup.push({ type: 'audio', id: oldAudio.track.id });
            await Storage.commitDraft(records, expected, isActive, { before: cleanupBefore, after: serializeAttachmentCleanup(cleanup) });
            committed = true;
            try {
                await flushAttachmentCleanupLocked();
            }
            catch { }
            return { track, edit, media: nextMedia, records };
        }
        catch (error) {
            if (!committed) {
                const actualMedia = await Storage.getItem(mediaKey);
                const actualAudio = await Storage.getItem(audioKey);
                if (nextMedia && actualMedia !== JSON.stringify(nextMedia))
                    await removeMediaFile(nextMedia.id, nextMedia.kind);
                if (copiedAudio && actualAudio !== audioRecord)
                    await removeDraftAudioFile(track.id);
            }
            throw error;
        }
    });
}
