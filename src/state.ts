import type { AudioTrack } from './audioData';
export type EditorKind = 'lyrics' | 'styles';
export type History = {
    past: string[];
    value: string;
    future: string[];
};
export type SavedText = {
    id: string;
    kind: EditorKind;
    name: string;
    value: string;
    createdAt: number;
};
export type Draft = {
    mode: 'Simple' | 'Advanced';
    prompt: string;
    title: string;
    instrumental: boolean;
    lyrics: History;
    styles: History;
    saved: SavedText[];
    voiceId?: string | null;
    vocalGender?: 'Male' | 'Female' | null;
};
export const history = (value = ''): History => ({ past: [], value, future: [] });
export const initialDraft = (): Draft => ({
    mode: 'Simple', prompt: '', title: '', instrumental: false,
    lyrics: history(), styles: history(), saved: [],
});
export type Action = {
    type: 'field';
    field: 'prompt' | 'title';
    value: string;
} | {
    type: 'voice';
    id: string | null;
} | {
    type: 'gender';
    value: 'Male' | 'Female' | null;
} | {
    type: 'edit';
    kind: EditorKind;
    value: string;
} | {
    type: 'undo' | 'redo' | 'reset';
    kind: EditorKind;
} | {
    type: 'mode' | 'clear' | 'instrumental';
} | {
    type: 'save';
    item: SavedText;
} | {
    type: 'rename';
    id: string;
    name: string;
} | {
    type: 'delete';
    id: string;
} | {
    type: 'restore';
    draft: Draft;
} | {
    type: 'remix';
    track: AudioTrack;
};
function change(h: History, value: string): History {
    if (h.value === value)
        return h;
    return { past: [...h.past, h.value], value, future: [] };
}
export function reducer(state: Draft, action: Action): Draft {
    switch (action.type) {
        case 'field': return { ...state, [action.field]: action.value };
        case 'gender': return { ...state, vocalGender: action.value };
        case 'voice': return { ...state, voiceId: action.id, mode: action.id ? 'Advanced' : state.mode };
        case 'mode': return { ...state, mode: state.mode === 'Simple' ? 'Advanced' : 'Simple' };
        case 'instrumental': return { ...state, instrumental: !state.instrumental };
        case 'clear': return { ...state, prompt: '', title: '', instrumental: false, voiceId: null, vocalGender: null,
            lyrics: change(state.lyrics, ''), styles: change(state.styles, '') };
        case 'edit': return { ...state, [action.kind]: change(state[action.kind], action.value) };
        case 'reset': return { ...state, [action.kind]: change(state[action.kind], '') };
        case 'undo': {
            const h = state[action.kind];
            if (!h.past.length)
                return state;
            return { ...state, [action.kind]: { past: h.past.slice(0, -1), value: h.past[h.past.length - 1], future: [h.value, ...h.future] } };
        }
        case 'redo': {
            const h = state[action.kind];
            if (!h.future.length)
                return state;
            return { ...state, [action.kind]: { past: [...h.past, h.value], value: h.future[0], future: h.future.slice(1) } };
        }
        case 'save': return action.item.name.trim() && action.item.value.trim()
            ? { ...state, saved: [action.item, ...state.saved] } : state;
        case 'rename': return action.name.trim() ? { ...state, saved: state.saved.map(item => item.id === action.id ? { ...item, name: action.name.trim() } : item) } : state;
        case 'delete': return { ...state, saved: state.saved.filter(item => item.id !== action.id) };
        case 'restore': return action.draft;
        case 'remix': {
            const { track } = action;
            return { ...state, mode: track.creation?.mode || 'Advanced', prompt: track.creation?.prompt || '', title: track.title,
                instrumental: track.creation?.instrumental || false, vocalGender: track.creation?.vocalGender || null, voiceId: track.voiceId || null,
                lyrics: change(state.lyrics, track.lyrics), styles: change(state.styles, track.styles) };
        }
    }
}
export function hasContent(state: Draft): boolean {
    return !!(state.prompt.trim() || state.lyrics.value.trim() || state.styles.value.trim());
}
