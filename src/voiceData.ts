export type PublicVoice = {
    id: string;
    name: string;
    creatorId: string;
    trial: boolean;
    local?: boolean;
};
export const publicVoices: PublicVoice[] = [
    { id: 'm620-morning', name: 'Morning voice', creatorId: 'm620', trial: true },
    { id: 'm620-evening', name: 'Evening voice', creatorId: 'm620', trial: true },
    { id: 'northlight-soft', name: 'Soft light', creatorId: 'northlight', trial: true },
    { id: 'northlight-glow', name: 'Golden glow', creatorId: 'northlight', trial: true },
];
export const voiceById = (id?: string | null) => publicVoices.find(voice => voice.id === id);
