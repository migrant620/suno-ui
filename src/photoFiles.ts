import * as FileSystem from 'expo-file-system/legacy';
const directory = () => {
    if (!FileSystem.documentDirectory)
        throw new Error('Photo storage is unavailable.');
    return `${FileSystem.documentDirectory}draft-photos/`;
};
const file = (id: string) => `${directory()}${encodeURIComponent(id)}.jpg`;
export async function savePhotoFile(id: string, uri: string) {
    await FileSystem.makeDirectoryAsync(directory(), { intermediates: true });
    await FileSystem.copyAsync({ from: uri, to: file(id) });
    await readPhotoFile(id);
}
export async function readPhotoFile(id: string) {
    const uri = file(id);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.isDirectory || !info.size)
        throw new Error('Your saved photo could not be opened.');
    return { uri, release: () => { } };
}
export async function removePhotoFile(id: string) {
    const uri = file(id);
    await FileSystem.deleteAsync(uri, { idempotent: true });
    if ((await FileSystem.getInfoAsync(uri)).exists)
        throw new Error('The photo could not be removed. Try again.');
}
export async function removeAllPhotoFiles() {
    const uri = directory();
    await FileSystem.deleteAsync(uri, { idempotent: true });
    if ((await FileSystem.getInfoAsync(uri)).exists)
        throw new Error('Your photo files could not be removed. Try again.');
}
export async function releasePhotoSource(uri: string) {
    const cache = FileSystem.cacheDirectory;
    if (!cache)
        return;
    const owned = ['Camera/', 'ImagePicker/'].some(folder => {
        const prefix = `${cache}${folder}`;
        if (!uri.startsWith(prefix))
            return false;
        const name = uri.slice(prefix.length);
        return /^[a-zA-Z0-9-]+\.(png|jpe?g|heic|webp)$/i.test(name);
    });
    if (!owned)
        return;
    await FileSystem.deleteAsync(uri, { idempotent: true });
    if ((await FileSystem.getInfoAsync(uri)).exists)
        throw new Error('The temporary photo could not be removed. Try again.');
}
