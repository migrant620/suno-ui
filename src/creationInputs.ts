import type { MediaDraft } from './mediaTypes';

export type CreationInputs = {
  mode: 'Simple' | 'Advanced'; prompt: string; instrumental: boolean;
  vocalGender?: 'Male' | 'Female' | null;
  media?: MediaDraft;
};
export type CreationSource = { inputs: Omit<CreationInputs, 'media'>; media?: MediaDraft & { origin: 'media' | 'photo' } };
export function isCreationInputs(value: any): value is CreationInputs {
  return !!value && ['Simple', 'Advanced'].includes(value.mode) &&
    typeof value.prompt === 'string' && value.prompt.length <= 30000 && typeof value.instrumental === 'boolean' &&
    (value.vocalGender == null || ['Male', 'Female'].includes(value.vocalGender)) &&
    (value.media === undefined || (!!value.media && /^media-song-[a-z0-9-]+$/.test(value.media.id) &&
      typeof value.media.name === 'string' && value.media.name.length <= 1000 && ['images', 'videos'].includes(value.media.kind)));
}
