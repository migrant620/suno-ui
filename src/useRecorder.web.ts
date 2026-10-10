import { useEffect, useRef, useState } from 'react';
export type RecordedAudio = {
    uri: string;
    duration: number;
};
export function useRecorder(minimumSeconds = 6) {
    const [recording, setRecording] = useState(false);
    const [busy, setBusy] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [file, setFile] = useState<RecordedAudio | null>(null);
    const [error, setError] = useState('');
    const recorder = useRef<MediaRecorder | null>(null);
    const stream = useRef<MediaStream | null>(null);
    const started = useRef(0);
    const alive = useRef(true);
    const fileURL = useRef('');
    const retained = useRef(false);
    const pending = useRef(false);
    const stopTracks = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; };
    useEffect(() => {
        alive.current = true;
        const timer = setInterval(() => { if (recorder.current?.state === 'recording')
            setSeconds((performance.now() - started.current) / 1000); }, 200);
        return () => { alive.current = false; clearInterval(timer); if (recorder.current?.state === 'recording')
            recorder.current.stop(); stopTracks(); if (fileURL.current && !retained.current)
            URL.revokeObjectURL(fileURL.current); };
    }, []);
    const start = async () => {
        if (pending.current || recorder.current?.state === 'recording')
            return;
        pending.current = true;
        setBusy(true);
        setError('');
        try {
            if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined')
                throw new Error('Recording is unavailable in this browser. Try uploading an audio file.');
            const input = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!alive.current) {
                input.getTracks().forEach(track => track.stop());
                return;
            }
            stream.current = input;
            const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
            const next = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
            const chunks: Blob[] = [];
            next.ondataavailable = event => { if (event.data.size)
                chunks.push(event.data); };
            next.onerror = () => { stopTracks(); if (alive.current) {
                setRecording(false);
                setBusy(false);
                setError('Recording failed. Please try again.');
            } };
            next.onstop = () => {
                const duration = (performance.now() - started.current) / 1000;
                stopTracks();
                recorder.current = null;
                if (!alive.current)
                    return;
                setRecording(false);
                setBusy(false);
                const blob = new Blob(chunks, { type: next.mimeType });
                if (!blob.size) {
                    setError('No audio was recorded. Please try again.');
                    return;
                }
                if (duration < minimumSeconds) {
                    setError(`Audio too short. Record at least ${minimumSeconds} seconds.`);
                    setSeconds(0);
                    return;
                }
                const uri = URL.createObjectURL(blob);
                fileURL.current = uri;
                retained.current = false;
                setSeconds(duration);
                setFile({ uri, duration });
            };
            recorder.current = next;
            started.current = performance.now();
            setSeconds(0);
            next.start();
            setRecording(true);
        }
        catch (cause) {
            stopTracks();
            if (alive.current)
                setError(cause instanceof DOMException && ['NotAllowedError', 'PermissionDeniedError'].includes(cause.name) ? 'Microphone access was denied. Allow microphone access in your browser, or upload an audio file.' : cause instanceof Error ? cause.message : 'The microphone could not be opened.');
        }
        finally {
            pending.current = false;
            if (alive.current)
                setBusy(false);
        }
    };
    const stop = () => { if (recorder.current?.state === 'recording') {
        setBusy(true);
        recorder.current.stop();
    } };
    const discard = () => { if (fileURL.current)
        URL.revokeObjectURL(fileURL.current); fileURL.current = ''; retained.current = false; setFile(null); setSeconds(0); setError(''); };
    const take = () => { retained.current = true; return file; };
    return { recording, busy, seconds, file, error, start, stop, discard, take };
}
