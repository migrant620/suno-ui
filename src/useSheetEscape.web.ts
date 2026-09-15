import { useEffect, useRef } from 'react';

type Entry = { close: () => void; root: { current: unknown } };
const sheets: Entry[] = [];
let installed = false;
let consumingEscape = false;

// Native Modal owns Android/iOS Back. Web must also accept Escape during entrance.
export function useSheetEscape(onClose: () => void, root: { current: unknown }): void {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const entry: Entry = { close: () => close.current(), root };
    sheets.push(entry);
    if (!installed) {
      installed = true;
      document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || event.isComposing) return;
        const top = sheets[sheets.length - 1];
        if (!top && !consumingEscape) return;
        if (top && !consumingEscape) {
          const modals = document.querySelectorAll('[aria-modal="true"]');
          const element = top.root.current;
          // A naming/permission/account Modal can be above the registered Sheet.
          if (!(element instanceof HTMLElement) || !modals[modals.length - 1]?.contains(element)) return;
        }
        event.preventDefault(); event.stopImmediatePropagation();
        if (!consumingEscape && !event.repeat) { consumingEscape = true; top?.close(); }
      }, true);
      document.addEventListener('keyup', event => {
        if (event.key !== 'Escape' || !consumingEscape) return;
        // Do not let Modal's keyup handler dismiss the newly revealed parent.
        event.preventDefault(); event.stopImmediatePropagation(); consumingEscape = false;
      }, true);
      window.addEventListener('blur', () => { consumingEscape = false; });
    }
    return () => { const index = sheets.indexOf(entry); if (index >= 0) sheets.splice(index, 1); };
  }, []);
}
