import { useEffect, useRef, useState } from 'react';
import AsyncStorage from './accountStorage';
import { ProfileLinks, socialFields } from './profileData';
import { PROFILE_PICKER_KEY } from './profilePickerSession';

export type LocalProfile = { name: string; bio: string; reduceMotion: boolean; followedCreatorIds?: string[]; likedVoiceIds?: string[]; handle?: string; avatarUri?: string; coverUri?: string; links?: ProfileLinks; shareId?: string; hiddenRecommendations?: boolean; dismissedCreatorIds?: string[]; completionStep?: number };
const initial: LocalProfile = { name: 'M620', bio: 'Making room for a little more music.', reduceMotion: false };

const key = 'suno-ui:profile:v1';
const newProfile = (): LocalProfile => ({ ...initial, shareId: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` });
function readProfile(raw: string | null): LocalProfile {
  if (!raw) return newProfile();
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid profile');
  if (typeof value.name !== 'string' || !value.name.trim() || typeof value.bio !== 'string' || typeof value.reduceMotion !== 'boolean') throw new Error('Invalid profile');
  if (value.followedCreatorIds !== undefined && (!Array.isArray(value.followedCreatorIds) || !value.followedCreatorIds.every((id: unknown) => typeof id === 'string'))) throw new Error('Invalid following list');
  if (value.likedVoiceIds !== undefined && (!Array.isArray(value.likedVoiceIds) || !value.likedVoiceIds.every((id: unknown) => typeof id === 'string'))) throw new Error('Invalid liked Voices');
  for (const key of ['handle', 'avatarUri', 'coverUri', 'shareId']) if (value[key] !== undefined && typeof value[key] !== 'string') throw new Error('Invalid profile field');
  if (value.links !== undefined && (!value.links || typeof value.links !== 'object' || Array.isArray(value.links) || !Object.entries(value.links).every(([key, link]) => socialFields.some(field => field.key === key) && typeof link === 'string'))) throw new Error('Invalid profile links');
  if (value.hiddenRecommendations !== undefined && typeof value.hiddenRecommendations !== 'boolean') throw new Error('Invalid recommendations state');
  if (value.dismissedCreatorIds !== undefined && (!Array.isArray(value.dismissedCreatorIds) || !value.dismissedCreatorIds.every((id: unknown) => typeof id === 'string'))) throw new Error('Invalid recommendation exclusions');
  if (value.completionStep !== undefined && (!Number.isInteger(value.completionStep) || value.completionStep < 0 || value.completionStep > 4)) throw new Error('Invalid profile completion');
  return value;
}
type ProfilePatch = Partial<LocalProfile> | ((current: LocalProfile) => Partial<LocalProfile>);
export function useLocalProfile() {
  const [profile, setProfile] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [loadVersion, setLoadVersion] = useState(0);
  const mounted = useRef(true);
  const revision = useRef(0);
  useEffect(() => {
    let active = true; mounted.current = true; setReady(false); setError('');
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        let current = readProfile(raw);
        if (!raw || !current.shareId) {
          current = readProfile(await AsyncStorage.updateItem(key, latest => {
            if (!active) throw new Error('Profile closed');
            const value = readProfile(latest);
            return JSON.stringify({ ...value, shareId: value.shareId || current.shareId || newProfile().shareId });
          }));
        }
        if (active) { setProfile(current); setReady(true); }
      } catch { if (active) setError('Your local profile could not be loaded. Reload to retry.'); }
    })();
    return () => { active = false; mounted.current = false; };
  }, [loadVersion]);
  const update = async (patch: ProfilePatch, isActive: () => boolean = () => true, pickerSessionId?: string): Promise<boolean> => {
    if (!ready || !mounted.current || !isActive()) return false;
    const attempt = ++revision.current;
    try {
      const committed = await AsyncStorage.updateItem(key, raw => {
        if (!mounted.current || !isActive()) throw new Error('Profile save cancelled');
        const current = readProfile(raw);
        const next = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) };
        return JSON.stringify(readProfile(JSON.stringify(next)));
      }, pickerSessionId ? { key: PROFILE_PICKER_KEY, id: pickerSessionId } : undefined);
      if (mounted.current) {
        setProfile(readProfile(committed));
        if (attempt === revision.current) setError('');
      }
      return true;
    } catch {
      if (mounted.current && isActive() && attempt === revision.current) setError('Profile changes could not be saved. Please try again.');
      return false;
    }
  };
  return { profile, ready, error, update, retry: () => setLoadVersion(version => version + 1) };
}
