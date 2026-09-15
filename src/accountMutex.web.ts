const pending = new Map<string, Promise<unknown>>();
export function withAccountMutex<T>(name: string, action: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(`suno-ui:${name}`, action);
  const next = (pending.get(name) || Promise.resolve()).catch(() => {}).then(action);
  pending.set(name, next);
  void next.finally(() => { if (pending.get(name) === next) pending.delete(name); }).catch(() => {});
  return next;
}
export function requireAccountDeletionSupport() {
  if (!navigator.locks) throw new Error('To delete local data, open this demo over HTTPS or localhost.');
}
