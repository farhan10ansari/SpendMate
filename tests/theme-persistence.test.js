import { beforeEach, expect, mock, test } from 'bun:test';

const saved = new Map();
mock.module('expo-sqlite/kv-store', () => ({ default: {
  getItemSync: key => saved.get(key) ?? null,
  setItemSync: (key, value) => saved.set(key, value),
  removeItemSync: key => saved.delete(key),
} }));
mock.module('expo-localization', () => ({
  getLocales: () => [{ currencyCode: 'INR', languageTag: 'en-IN' }],
}));

const { default: store } = await import('../stores/usePersistentAppStore');

beforeEach(() => {
  saved.clear();
  store.getState().resetPersistentStore();
});

test('collection persists independently of appearance and rehydrates', async () => {
  store.getState().setTheme('dark');
  store.getState().setThemeCollection('ocean');
  const persisted = saved.get('app-storage');
  expect(JSON.parse(persisted).state.themeCollection).toBe('ocean');
  store.getState().resetPersistentStore();
  saved.set('app-storage', persisted);
  await store.persist.rehydrate();
  expect(store.getState().themeCollection).toBe('ocean');
  expect(store.getState().theme).toBe('dark');
  store.getState().setThemeCollection('rose');
  expect(store.getState().theme).toBe('dark');
  expect(JSON.parse(saved.get('app-storage')).state.themeCollection).toBe('rose');
});

test('older preferences retain their mode and default to Mint', async () => {
  saved.set('app-storage', JSON.stringify({ state: { theme: 'light' }, version: 0 }));
  await store.persist.rehydrate();
  expect(store.getState().themeCollection).toBe('mint');
  expect(store.getState().theme).toBe('light');
  expect(typeof store.getState().setThemeCollection).toBe('function');
});

test('reset restores the original collection and system mode', () => {
  store.getState().setThemeCollection('rose');
  store.getState().setTheme('dark');
  store.getState().resetPersistentStore();
  expect(store.getState().themeCollection).toBe('mint');
  expect(store.getState().theme).toBe('system');
});
