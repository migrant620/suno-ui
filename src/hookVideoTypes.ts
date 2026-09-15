export type HookVideoState = { playing: boolean; current: number; duration: number; loading: boolean; error: string };
export type HookVideoControl = { play: () => void; pause: () => void; seek: (seconds: number) => void };
export type HookVideoProps = { source: number; active: boolean; muted?: boolean; initialTime?: number; onState: (state: HookVideoState) => void };
