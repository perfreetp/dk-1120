import { VotingSession, HistoryRecord, UserPreference, Member } from '../types';

const STORAGE_KEYS = {
  CURRENT_SESSION: 'voting:current',
  HISTORY: 'voting:history',
  PREFERENCES: 'voting:preferences',
  MEMBERS: 'voting:members',
} as const;

export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

export const currentSessionStorage = {
  get: (): VotingSession | null => storage.get(STORAGE_KEYS.CURRENT_SESSION),
  set: (session: VotingSession) => storage.set(STORAGE_KEYS.CURRENT_SESSION, session),
  remove: () => storage.remove(STORAGE_KEYS.CURRENT_SESSION),
};

export const historyStorage = {
  get: (): HistoryRecord[] => storage.get(STORAGE_KEYS.HISTORY) ?? [],
  add: (record: HistoryRecord) => {
    const history = historyStorage.get();
    history.unshift(record);
    storage.set(STORAGE_KEYS.HISTORY, history);
  },
  clear: () => storage.set(STORAGE_KEYS.HISTORY, []),
};

export const preferencesStorage = {
  get: (): UserPreference => {
    const defaultPrefs: UserPreference = {
      favoriteCandidates: [],
      commonMembers: [],
      defaultMaxVotes: 3,
      blacklistThreshold: 2,
    };
    return storage.get(STORAGE_KEYS.PREFERENCES) ?? defaultPrefs;
  },
  set: (prefs: UserPreference) => storage.set(STORAGE_KEYS.PREFERENCES, prefs),
};

export const membersStorage = {
  get: (): Member[] => storage.get(STORAGE_KEYS.MEMBERS) ?? [],
  set: (members: Member[]) => storage.set(STORAGE_KEYS.MEMBERS, members),
};
