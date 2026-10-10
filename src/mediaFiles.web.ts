import { MediaKind, MediaPreview } from './mediaTypes';
const cacheName = 'suno-ui:draft-media:v1';
const key = (id: string) => new URL(`/__draft_media__/${encodeURIComponent(id)}`, location.origin).href;
export async function prepareMedia(uri: string, kind: MediaKind): Promise<MediaPreview> {
    if (kind === 'images') {
        const image = new Image();
        image.src = uri;
        try {
            await image.decode();
            if (!image.naturalWidth || !image.naturalHeight)
                throw new Error();
        }
        catch {
            throw new Error('The image could not be opened. Choose another file.');
        }
        return { source: { uri }, release: () => { } };
    }
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;
    try {
        await new Promise<void>((resolve, reject) => {
            const finish = (error?: Error) => { clearTimeout(timer); video.onloadeddata = null; video.onerror = null; error ? reject(error) : resolve(); };
            const timer = setTimeout(() => finish(new Error('The video took too long to open. Try again.')), 15000);
            video.onloadeddata = () => finish();
            video.onerror = () => finish(new Error('The video could not be opened. Choose another file.'));
            video.src = uri;
        });
        if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration) || video.duration <= 0)
            throw new Error('Choose a video that can be opened.');
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 256 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('The video preview could not be opened.');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return { source: { uri: canvas.toDataURL('image/jpeg', 0.85) }, release: () => { } };
    }
    finally {
        video.pause();
        video.removeAttribute('src');
        video.load();
    }
}
export async function saveMediaFile(id: string, uri: string, kind: MediaKind) {
    const response = await fetch(uri);
    if (!response.ok)
        throw new Error('The selected media could not be opened.');
    const blob = await response.blob();
    if (!blob.size || !blob.type.startsWith(kind === 'images' ? 'image/' : 'video/'))
        throw new Error('Choose a media file that is not empty.');
    await (await caches.open(cacheName)).put(key(id), new Response(blob, { headers: { 'Content-Type': blob.type } }));
}
export async function readMediaFile(id: string, _kind: MediaKind) {
    if (!(await caches.has(cacheName)))
        throw new Error('Your saved media could not be opened. Retry or remove it.');
    const response = await (await caches.open(cacheName)).match(key(id));
    if (!response)
        throw new Error('Your saved media could not be opened. Retry or remove it.');
    const blob = await response.blob();
    if (!blob.size)
        throw new Error('Your saved media is empty.');
    const uri = URL.createObjectURL(blob);
    return { uri, release: () => URL.revokeObjectURL(uri) };
}
export async function removeMediaFile(id: string, _kind: MediaKind) {
    if (!(await caches.has(cacheName)))
        return;
    const cache = await caches.open(cacheName);
    await cache.delete(key(id));
    if (await cache.match(key(id)))
        throw new Error('The saved media could not be removed. Try again.');
}
export async function releaseMediaSource(_uri: string) { }
