import { useEffect, useRef } from 'react';
type Entry = {
    close: () => void;
    root: {
        current: unknown;
    };
};
const sheets: Entry[] = [];
let installed = false;
let consumingEscape = false;
export function useSheetEscape(onClose: () => void, root: {
    current: unknown;
}): void {
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        const entry: Entry = { close: () => close.current(), root };
        sheets.push(entry);
        if (!installed) {
            installed = true;
            document.addEventListener('keydown', event => {
                if (event.key !== 'Escape' || event.isComposing)
                    return;
                const top = sheets[sheets.length - 1];
                if (!top && !consumingEscape)
                    return;
                if (top && !consumingEscape) {
                    const modals = document.querySelectorAll('[aria-modal="true"]');
                    const element = top.root.current;
                    if (!(element instanceof HTMLElement) || !modals[modals.length - 1]?.contains(element))
                        return;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                if (!consumingEscape && !event.repeat) {
                    consumingEscape = true;
                    top?.close();
                }
            }, true);
            document.addEventListener('keyup', event => {
                if (event.key !== 'Escape' || !consumingEscape)
                    return;
                event.preventDefault();
                event.stopImmediatePropagation();
                consumingEscape = false;
            }, true);
            window.addEventListener('blur', () => { consumingEscape = false; });
        }
        return () => { const index = sheets.indexOf(entry); if (index >= 0)
            sheets.splice(index, 1); };
    }, []);
}
