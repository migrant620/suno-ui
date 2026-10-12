const pending = new Map<string, Promise<unknown>>();
export function withAccountMutex<T>(name: string, action: () => Promise<T>): Promise<T> {
  const next = (pending.get(name) || Promise.resolve()).catch(() => {}).then(action);
  pending.set(name, next);
  void next.finally(() => { if (pending.get(name) === next) pending.delete(name); }).catch(() => {});
  return next;
}
export function requireAccountDeletionSupport() {}
