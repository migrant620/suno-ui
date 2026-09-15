import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from './accountStorage';

const KEY = 'suno-ui:credit-promotion:v1';
const DEMO_DURATION = 24 * 60 * 60 * 1000;
export function promotionTime(expiresAt: number, now: number) {
  const minutes = Math.max(0, Math.ceil((expiresAt - now) / 60000));
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor(minutes % 1440 / 60)}h`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function useCreditPromotion() {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const resetting = useRef(false);
  const [loading, setLoading] = useState(true);
  const initialDeadline = useRef<number | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    void (async () => {
      try {
        const raw = resetting.current ? null : await AsyncStorage.getItem(KEY);
        let deadline: number;
        if (raw === null) {
          deadline = initialDeadline.current ?? (Date.now() + DEMO_DURATION);
          initialDeadline.current = deadline;
          await AsyncStorage.setItem(KEY, JSON.stringify({ expiresAt: deadline }));
        } else {
          try {
            const stored = JSON.parse(raw);
            if (!stored || !Number.isSafeInteger(stored.expiresAt) || stored.expiresAt <= 0) throw new Error('Invalid offer clock');
            deadline = stored.expiresAt;
          } catch { if (active) setInvalid(true); throw new Error('Invalid offer clock'); }

        }
        if (active) { resetting.current = false; setInvalid(false); setExpiresAt(deadline); setNow(Date.now()); }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      if (timer) clearTimeout(timer);
      const stamp = Date.now(); setNow(stamp);
      if (expiresAt !== null && expiresAt > stamp) {
        const remainder = (expiresAt - stamp) % 60000;
        timer = setTimeout(update, (remainder || 60000) + 10);
      }
    };
    update();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { if (timer) clearTimeout(timer); subscription.remove(); };
  }, [expiresAt]);
  return { active: expiresAt !== null && expiresAt > now, label: expiresAt === null ? '' : promotionTime(expiresAt, now), error, invalid, loading, retry: () => { if (invalid && !resetting.current) { resetting.current = true; initialDeadline.current = null; } setAttempt(value => value + 1); } };
}
