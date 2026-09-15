import { withAccountMedia } from './accountStorage';
const pending = new Map<string, Promise<unknown>>();

export function withOfflineLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  const task = (pending.get(id) || Promise.resolve()).catch(() => {}).then(() => withAccountMedia(operation));
  pending.set(id, task);
  void task.finally(() => { if (pending.get(id) === task) pending.delete(id); }).catch(() => {});
  return task;
}
