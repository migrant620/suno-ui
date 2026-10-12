import Storage from '@react-native-async-storage/async-storage';
import { withAccountMutex, requireAccountDeletionSupport } from './accountMutex';
import { deleteAccountFiles } from './accountFiles';
import { commitDraftTransaction, recoverDraftTransaction, DRAFT_KEYS, DRAFT_TRANSACTION_KEY, DRAFT_CLEANUP_KEY, DraftRecords, CleanupChange } from './draftTransaction';

export const ACCOUNT_CONTROL = 'suno-ui:account-state:v1';
export const SESSION_KEY = 'suno-ui:session:v1';
const THEME_KEY = 'suno-ui:theme:v1';
const accountKeys = [
  DRAFT_TRANSACTION_KEY, DRAFT_CLEANUP_KEY,
  'suno-ui:library:v1', 'suno-ui:profile:v1', 'suno-ui:local-draft:v1',
  'suno-ui:profile-picker:v1',
  'suno-ui:audio-draft:v1', 'suno-ui:community:v1', 'suno-ui:comment-reports:v1', 'suno-ui:notifications:v1',
  'suno-ui:demo-entitlements:v1', 'suno-ui:credit-promotion:v1', 'suno-ui:problem-report:v1',
  'suno-ui:media-draft:v1', 'suno-ui:search-history:v1', 'suno-ui:photo-draft:v1', 'suno-ui:own-voices:v1', 'suno-ui:hooks:v1',
];
export type AccountState = { phase: 'active' | 'closing' | 'closed'; epoch: string };
let epoch = 'legacy';
export const accountEpoch = () => epoch;
export async function readAccountState(): Promise<AccountState> {
  const raw = await Storage.getItem(ACCOUNT_CONTROL);
  if (!raw) return { phase: 'active', epoch: 'legacy' };
  const value = JSON.parse(raw);
  if (!['active', 'closing', 'closed'].includes(value?.phase) || typeof value.epoch !== 'string' || !value.epoch) throw new Error('Your local account state could not be read.');
  return value;
}
export function bindAccount(state: AccountState) { epoch = state.epoch; }
async function assertActive(expected: string) {
  const current = await readAccountState();
  if (current.phase !== 'active' || current.epoch !== expected) throw new Error('This local account changed. Reopen the demo before saving.');
}
const draftKey = (key: string) => (DRAFT_KEYS as readonly string[]).includes(key) || key === DRAFT_CLEANUP_KEY;
function write<T>(key: string, operation: () => Promise<T>) {
  const expected = epoch;
  return withAccountMutex('account-storage', async () => {
    if (key !== THEME_KEY) await assertActive(expected);
    if (draftKey(key)) await recoverDraftTransaction();
    return operation();
  });
}
const accountStorage = {
  recoverDraft: () => write(DRAFT_KEYS[0], async () => {}),
  getItem: (key: string) => draftKey(key) ? write(key, () => Storage.getItem(key)) : Storage.getItem(key),
  commitDraft: (after: DraftRecords, expected: DraftRecords, isActive: () => boolean, cleanup?: CleanupChange) => write(DRAFT_KEYS[0], () => commitDraftTransaction(after, expected, isActive, cleanup)),
  setItem: (key: string, value: string) => write(key, () => Storage.setItem(key, value)),
  removeItem: (key: string) => write(key, () => Storage.removeItem(key)),
  updateItem: (key: string, update: (raw: string | null) => string, clearMatching?: { key: string; id: string }) => write(key, async () => {
    const raw = await Storage.getItem(key);
    if (clearMatching) {
      const companion = await Storage.getItem(clearMatching.key);
      if (!companion || JSON.parse(companion)?.id !== clearMatching.id) throw new Error('The pending edit changed.');
      const value = update(raw);
      // Android AsyncStorage commits multiSet in one SQLite transaction.
      await Storage.multiSet([[key, value], [clearMatching.key, 'null']]);
      return value;
    }
    const value = update(raw);
    await Storage.setItem(key, value);
    return value;
  }),
};
export default accountStorage;
export function withAccountMedia<T>(operation: () => Promise<T>): Promise<T> {
  const expected = epoch;
  return withAccountMutex('account-media', async () => { await assertActive(expected); return operation(); });
}
export async function beginAccountDeletion() {
  requireAccountDeletionSupport();
  const expected = epoch;
  return withAccountMutex('account-storage', async () => {
    await assertActive(expected);
    await Storage.setItem(ACCOUNT_CONTROL, JSON.stringify({ phase: 'closing', epoch: expected }));
  });
}
export async function finishAccountDeletion() {
  requireAccountDeletionSupport();
  // Existing media jobs finish/abort before removing files; all new writes see closing.
  await withAccountMutex('account-media', () => withAccountMutex('account-storage', async () => {
    const state = await readAccountState();
    if (state.phase === 'closed') return;
    if (state.phase !== 'closing') throw new Error('Account deletion has not been confirmed.');
    await deleteAccountFiles();
    await Storage.multiRemove(accountKeys);
    for (const key of accountKeys) if (await Storage.getItem(key) !== null) throw new Error('Some saved data could not be removed.');
    await Storage.setItem(SESSION_KEY, 'signed-out');
    await Storage.setItem(ACCOUNT_CONTROL, JSON.stringify({ ...state, phase: 'closed' }));
  }));
}
export async function openLocalAccount() {
  return withAccountMutex('account-storage', async () => {
    const state = await readAccountState();
    if (state.phase === 'closing') throw new Error('Finish removing the previous local account first.');
    const next = state.phase === 'closed' ? { phase: 'active' as const, epoch: `${Date.now()}-${Math.random().toString(36).slice(2)}` } : state;
    await Storage.setItem(SESSION_KEY, 'active');
    if (state.phase === 'closed') await Storage.setItem(ACCOUNT_CONTROL, JSON.stringify(next));
    bindAccount(next);
  });
}
