import { useEffect, useRef, useState } from 'react';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
export type RecordedAudio = {
    uri: string;
    duration: number;
};
export function useRecorder(minimumSeconds = 6) {
    const [busy, setBusy] = useState(false);
    const [file, setFile] = useState<RecordedAudio | null>(null);
    const [error, setError] = useState('');
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const state = useAudioRecorderState(recorder, 200);
    const alive = useRef(true);
    const pending = useRef(false);
    useEffect(() => { alive.current = true; return () => { alive.current = false; void setAudioModeAsync({ allowsRecording: false }).catch(() => { }); }; }, [recorder]);
    const start = async () => {
        if (pending.current || recorder.isRecording)
            return;
        pending.current = true;
        setBusy(true);
        setError('');
        try {
            const permission = await requestRecordingPermissionsAsync();
            if (!alive.current)
                return;
            if (!permission.granted)
                throw new Error('Microphone access was denied. Allow it in device settings, or upload an audio file.');
            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            await recorder.prepareToRecordAsync();
            if (!alive.current)
                return;
            recorder.record();
        }
        catch (cause) {
            if (alive.current)
                setError(cause instanceof Error ? cause.message : 'The microphone could not be opened.');
        }
        finally {
            pending.current = false;
            if (alive.current)
                setBusy(false);
        }
    };
    const stop = async () => {
        if (pending.current || !recorder.isRecording)
            return;
        pending.current = true;
        setBusy(true);
        const duration = recorder.getStatus().durationMillis / 1000;
        try {
            await recorder.stop();
            await setAudioModeAsync({ allowsRecording: false });
            if (!alive.current)
                return;
            if (duration < minimumSeconds) {
                setError(`Audio too short. Record at least ${minimumSeconds} seconds.`);
                return;
            }
            if (!recorder.uri)
                throw new Error('No audio was recorded. Please try again.');
            setFile({ uri: recorder.uri, duration });
        }
        catch (cause) {
            if (alive.current)
                setError(cause instanceof Error ? cause.message : 'Recording could not be saved.');
        }
        finally {
            pending.current = false;
            if (alive.current)
                setBusy(false);
        }
    };
    return { recording: state.isRecording, busy, seconds: file?.duration || state.durationMillis / 1000, file, error, start, stop, discard: () => { setFile(null); setError(''); }, take: () => file };
}
