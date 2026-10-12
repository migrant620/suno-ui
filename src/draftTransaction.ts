import Storage from '@react-native-async-storage/async-storage';

export const DRAFT_TRANSACTION_KEY = 'suno-ui:draft-transaction:v1';
export const DRAFT_CLEANUP_KEY = 'suno-ui:draft-cleanup:v1';
export const DRAFT_KEYS = ['suno-ui:local-draft:v1', 'suno-ui:audio-draft:v1', 'suno-ui:media-draft:v1'] as const;
export type DraftKey = typeof DRAFT_KEYS[number];
export type DraftRecords = Record<DraftKey, string | null>;
export type CleanupChange = { before: string | null; after: string | null };
type Journal = { version: 1; before: DraftRecords; after: DraftRecords; cleanup?: CleanupChange };

const apply = async (key: string, value: string | null) => {
  if (value === null) await Storage.removeItem(key);
  else await Storage.setItem(key, value);
};
function records(value: unknown): value is DraftRecords {
  return !!value && typeof value === 'object' && Object.keys(value).length === DRAFT_KEYS.length && DRAFT_KEYS.every(key => (value as DraftRecords)[key] === null || typeof (value as DraftRecords)[key] === 'string');
}

// The caller owns account-storage. Files referenced by either side remain intact
// until the journal has been removed; a interrupted commit can restore its input.
export async function recoverDraftTransaction() {
  const raw = await Storage.getItem(DRAFT_TRANSACTION_KEY);
  if (!raw) return;
  const journal = JSON.parse(raw) as Journal;
  if (journal?.version !== 1 || !records(journal.before) || !records(journal.after)) throw new Error('Your previous draft could not be recovered. Keep this session and retry.');
  if (journal.cleanup && ![journal.cleanup.before, journal.cleanup.after].every(value => value === null || typeof value === 'string')) throw new Error('Your attachment cleanup could not be recovered. Keep this session and retry.');
  for (const key of DRAFT_KEYS) {
    const current = await Storage.getItem(key);
    if (current !== journal.before[key]) await apply(key, journal.before[key]);
  }
  if (journal.cleanup && await Storage.getItem(DRAFT_CLEANUP_KEY) !== journal.cleanup.before) await apply(DRAFT_CLEANUP_KEY, journal.cleanup.before);
  await Storage.removeItem(DRAFT_TRANSACTION_KEY);
}

export async function commitDraftTransaction(after: DraftRecords, expected: DraftRecords, isActive: () => boolean, cleanup?: CleanupChange) {
  const check = () => { if (!isActive()) throw new Error('Remix cancelled'); };
  check();
  const before = {} as DraftRecords;
  for (const key of DRAFT_KEYS) {
    before[key] = await Storage.getItem(key);
    if (before[key] !== expected[key]) throw new Error('Your draft changed. Reopen Remix before trying again.');
  }
  if (cleanup && await Storage.getItem(DRAFT_CLEANUP_KEY) !== cleanup.before) throw new Error('Attachment cleanup changed. Try Remix again.');
  check();
  try {
    await Storage.setItem(DRAFT_TRANSACTION_KEY, JSON.stringify({ version: 1, before, after, cleanup } satisfies Journal));
    for (const key of DRAFT_KEYS) {
      check();
      if (before[key] !== after[key]) await apply(key, after[key]);
    }
    check();
    if (cleanup && cleanup.before !== cleanup.after) await apply(DRAFT_CLEANUP_KEY, cleanup.after);
    check();
    await Storage.removeItem(DRAFT_TRANSACTION_KEY);
  } catch (error) {
    // Also covers a provider that throws after writing. Recovery never deletes
    // the old files, and an unsuccessful rollback keeps its durable journal.
    if (await Storage.getItem(DRAFT_TRANSACTION_KEY) === null) {
      const committed = await Promise.all(DRAFT_KEYS.map(async key => await Storage.getItem(key) === after[key]));
      if (committed.every(Boolean) && (!cleanup || await Storage.getItem(DRAFT_CLEANUP_KEY) === cleanup.after)) return;
    }
    await recoverDraftTransaction();
    throw error;
  }
}
