import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Storage, { accountEpoch } from './accountStorage';
import type { LocalProfile } from './useLocalProfile';
import { ProfileLinks, socialFields } from './profileData';
import { profileImageUri } from './profileImage';
import { withOfflineLock } from './offlineQueue';
export const PROFILE_PICKER_KEY = 'suno-ui:profile-picker:v1';
export type ProfileForm = {
    name: string;
    handle: string;
    bio: string;
    avatarUri: string;
    coverUri: string;
    links: ProfileLinks;
};
export type ProfilePickerSession = {
    version: 1;
    id: string;
    epoch: string;
    accountId: string;
    screen: 'editor' | 'setup';
    origin: 'profile' | 'settings';
    target: 'avatar' | 'cover';
    original: ProfileForm;
    draft: ProfileForm;
    step: number;
    pending: boolean;
    error?: string;
};
export const profileForm = (profile: LocalProfile): ProfileForm => ({
    name: profile.name, handle: profile.handle || 'm620-demo', bio: profile.bio,
    avatarUri: profile.avatarUri || '', coverUri: profile.coverUri || '', links: { ...profile.links },
});
function isForm(value: any): value is ProfileForm {
    return value && ['name', 'handle', 'bio', 'avatarUri', 'coverUri'].every(key => typeof value[key] === 'string')
        && value.links && typeof value.links === 'object' && !Array.isArray(value.links)
        && Object.entries(value.links).every(([key, link]) => socialFields.some(field => field.key === key) && typeof link === 'string');
}
function parse(raw: string | null): ProfilePickerSession | null {
    if (!raw)
        return null;
    const value = JSON.parse(raw);
    if (value === null)
        return null;
    if (value.version !== 1 || !['id', 'epoch', 'accountId'].every(key => typeof value[key] === 'string' && value[key])
        || !['editor', 'setup'].includes(value.screen) || !['profile', 'settings'].includes(value.origin)
        || !['avatar', 'cover'].includes(value.target) || !isForm(value.original) || !isForm(value.draft)
        || ![0, 1].includes(value.step) || typeof value.pending !== 'boolean'
        || (value.error !== undefined && typeof value.error !== 'string'))
        throw new Error('Saved profile changes could not be opened.');
    return value;
}
export function newProfilePickerSession(fields: Omit<ProfilePickerSession, 'version' | 'id' | 'epoch' | 'pending'>): ProfilePickerSession {
    return { ...fields, version: 1, id: `profile-edit-${Date.now()}-${Math.random().toString(36).slice(2)}`, epoch: accountEpoch(), pending: true };
}
export async function persistProfilePicker(session: ProfilePickerSession, active: () => boolean, create = false) {
    if (Platform.OS !== 'android')
        return;
    await Storage.updateItem(PROFILE_PICKER_KEY, raw => {
        if (!active() || session.epoch !== accountEpoch())
            throw new Error('Profile selection cancelled');
        const previous = parse(raw);
        if (!previous && !create)
            throw new Error('Profile changes were already closed.');
        if (previous && previous.id !== session.id)
            throw new Error('Other profile changes are still open.');
        return JSON.stringify(session);
    });
}
export async function clearProfilePicker(id?: string) {
    if (Platform.OS !== 'android')
        return;
    await Storage.updateItem(PROFILE_PICKER_KEY, raw => {
        if (!id)
            return 'null';
        const value = parse(raw);
        return value?.id === id ? 'null' : raw || 'null';
    });
    if (id)
        pendingResults.delete(id);
    else
        pendingResults.clear();
}
const pendingResults = new Map<string, ReturnType<typeof ImagePicker.getPendingResultAsync>>();
export async function recoverProfilePicker(accountId: string, active: () => boolean): Promise<ProfilePickerSession | null> {
    if (Platform.OS !== 'android')
        return null;
    return withOfflineLock(PROFILE_PICKER_KEY, () => recoverPendingPicker(accountId, active));
}
async function recoverPendingPicker(accountId: string, active: () => boolean): Promise<ProfilePickerSession | null> {
    let session = parse(await Storage.getItem(PROFILE_PICKER_KEY));
    if (!active() || !session)
        return null;
    if (session.epoch !== accountEpoch() || session.accountId !== accountId) {
        await clearProfilePicker(session.id);
        return null;
    }
    if (session.pending) {
        let error = '';
        try {
            if (!pendingResults.has(session.id))
                pendingResults.set(session.id, ImagePicker.getPendingResultAsync());
            const result = await pendingResults.get(session.id)!;
            if (result && 'code' in result)
                error = 'The photo could not be recovered. Your other changes are still here. Choose the photo again.';
            else if (result && !result.canceled) {
                const uri = await profileImageUri(result.assets[0]);
                session = { ...session, draft: { ...session.draft, [session.target === 'avatar' ? 'avatarUri' : 'coverUri']: uri } };
            }
        }
        catch {
            error = 'The photo could not be recovered. Your other changes are still here. Choose the photo again.';
        }
        session = { ...session, pending: false, error };
        const expectedEpoch = session.epoch;
        await persistProfilePicker(session, () => expectedEpoch === accountEpoch());
        pendingResults.delete(session.id);
    }
    return active() ? session : null;
}
