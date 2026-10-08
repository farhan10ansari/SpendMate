import { beforeEach, expect, test } from 'bun:test';
import { useTransactionSelectionStore as store } from '../stores/useTransactionSelectionStore';

beforeEach(() => store.setState({ selection: null }));

test('selection sheet carries cached options and updates the owning form', () => {
  let category = null;
  const options = [{ name: 'food', label: 'Food', icon: 'food' }];
  store.getState().open({
    owner: Symbol('expense'), title: 'Category', options, selected: category,
    accent: 'primary', layout: 'grid', onSelect: (value) => { category = value; },
  });
  expect(store.getState().selection.options).toBe(options);
  expect(store.getState().selection.layout).toBe('grid');
  store.getState().selection.onSelect('food');
  expect(category).toBe('food');
});

test('dismissing a sheet releases its callback without changing the draft', () => {
  const owner = Symbol('income');
  let source = 'salary';
  store.getState().open({
    owner, title: 'Income source', options: [], selected: source,
    accent: 'tertiary', onSelect: (value) => { source = value; },
  });
  store.getState().clear(owner);
  expect(store.getState().selection).toBeNull();
  expect(source).toBe('salary');
});

test('cleanup of an old dropdown cannot clear another dropdown selection', () => {
  const oldOwner = Symbol('old');
  const owner = Symbol('current');
  store.getState().open({
    owner, title: 'Payment method', options: [], selected: 'cash',
    accent: 'tertiary', onSelect: () => {},
  });
  store.getState().clear(oldOwner);
  expect(store.getState().selection.owner).toBe(owner);
  expect(store.getState().selection.selected).toBe('cash');
  store.getState().clear(owner);
  expect(store.getState().selection).toBeNull();
});
