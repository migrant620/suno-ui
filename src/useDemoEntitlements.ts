import { useEffect, useRef, useState } from 'react';
import AsyncStorage from './accountStorage';

export type DemoPlan = 'Free' | 'Pro' | 'Premier';
export type Billing = 'Monthly' | 'Annual';
export type MusicModel = 'v6' | 'v6-wild' | 'v6-mini';
export type DemoOrder = { kind: 'plan'; plan: 'Pro' | 'Premier'; billing: Billing } | { kind: 'pack'; count: 1 | 3 | 5 | 10 };
type Entitlements = { plan: DemoPlan; billing: Billing; downloads: number; model: MusicModel; transactions: string[] };
const KEY = 'suno-ui:demo-entitlements:v1';
const initial: Entitlements = { plan: 'Free', billing: 'Annual', downloads: 0, model: 'v6-mini', transactions: [] };
export function useDemoEntitlements() {
  const [data, setData] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const current = useRef(initial);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    AsyncStorage.getItem(KEY).then(raw => {
      const saved = raw ? JSON.parse(raw) : initial;
      if (!saved || !['Free', 'Pro', 'Premier'].includes(saved.plan) || !['Monthly', 'Annual'].includes(saved.billing) || !Number.isSafeInteger(saved.downloads) || saved.downloads < 0 || !['v6', 'v6-wild', 'v6-mini'].includes(saved.model) || !Array.isArray(saved.transactions) || !saved.transactions.every((id: unknown) => typeof id === 'string')) throw new Error('Invalid demo plan');
      if (active.current) { current.current = saved; setData(saved); setReady(true); }
    }).catch(() => { if (active.current) setError('Your demo plan could not be loaded. Reload to retry.'); });
    return () => { active.current = false; };
  }, []);
  const commit = (transform: (value: Entitlements) => Entitlements) => {
    if (!ready) return Promise.reject(new Error('Your demo plan is not ready.'));
    const task = queue.current.catch(() => {}).then(async () => {
      const next = transform(current.current);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      current.current = next;
      if (active.current) { setData(next); setError(''); }
    });
    queue.current = task;
    return task;
  };
  const purchase = (order: DemoOrder, transaction: string) => commit(value => {
    if (value.transactions.includes(transaction)) return value;
    return { ...value, ...(order.kind === 'plan' ? { plan: order.plan, billing: order.billing } : {}), downloads: value.downloads + (order.kind === 'pack' ? order.count : order.plan === 'Pro' ? 20 : 60), transactions: [...value.transactions, transaction] };
  });
  const selectModel = (model: MusicModel) => commit(value => {
    if (value.plan === 'Free' && model !== 'v6-mini') throw new Error('This model requires a demo Pro or Premier plan.');
    return { ...value, model };
  });
  return { data, ready, error, purchase, selectModel };
}
