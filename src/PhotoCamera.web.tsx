import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import type { CameraViewProps } from 'expo-camera';

export type CameraView = {
  takePictureAsync: (options?: { quality?: number }) => Promise<{ uri: string; width: number; height: number }>;
};

export const CameraView = forwardRef<CameraView, CameraViewProps>(function PhotoCamera({ facing = 'back', style, onCameraReady, onMountError }, ref) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const callbacks = useRef({ onCameraReady, onMountError });
  callbacks.current = { onCameraReady, onMountError };

  useEffect(() => {
    let canceled = false; let failed = false; let acquired: MediaStream | null = null;
    const element = video.current;
    const stop = (value: MediaStream | null) => value?.getTracks().forEach(track => track.stop());
    const fail = () => {
      if (canceled || failed) return;
      failed = true; callbacks.current.onMountError?.({ message: 'The camera could not be opened.' });
    };
    const ready = () => {
      if (!canceled && !failed && acquired && element && element.readyState >= 2) callbacks.current.onCameraReady?.();
    };
    element?.addEventListener('loadeddata', ready);
    element?.addEventListener('error', fail);
    void (async () => {
      try {
        const next = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing === 'front' ? 'user' : 'environment' } } });
        acquired = next;
        // A permission dialog or camera startup can finish after this view closes.
        if (canceled || !element) { stop(next); return; }
        stream.current = next;
        next.getTracks().forEach(track => track.addEventListener('ended', fail));
        element.srcObject = next;
        await element.play(); ready();
      } catch { fail(); }
    })();
    return () => {
      canceled = true;
      element?.removeEventListener('loadeddata', ready);
      element?.removeEventListener('error', fail);
      acquired?.getTracks().forEach(track => track.removeEventListener('ended', fail));
      stop(acquired);
      if (stream.current === acquired) stream.current = null;
      if (element) { element.pause(); element.srcObject = null; }
    };
  }, [facing]);

  useImperativeHandle(ref, () => ({
    async takePictureAsync(options = {}) {
      const element = video.current;
      if (!element || element.readyState < 2 || !element.videoWidth || !element.videoHeight || !stream.current?.getVideoTracks().some(track => track.readyState === 'live')) throw new Error('The camera is not ready. Try again.');
      const canvas = document.createElement('canvas');
      canvas.width = element.videoWidth; canvas.height = element.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('The photo could not be captured. Try again.');
      context.drawImage(element, 0, 0, canvas.width, canvas.height);
      return { uri: canvas.toDataURL('image/jpeg', options.quality ?? 0.85), width: canvas.width, height: canvas.height };
    },
  }), []);

  return <View style={style}>{React.createElement('video', { ref: video, autoPlay: true, playsInline: true, muted: true, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'front' ? 'scaleX(-1)' : undefined } })}</View>;
});
