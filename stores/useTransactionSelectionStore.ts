import { create } from 'zustand';
import type { Href } from 'expo-router';
import type { Category } from '@/lib/types';

export type TransactionOption = Pick<Category, 'name' | 'label' | 'icon'>;

export type TransactionSelection = {
  owner: symbol;
  title: string;
  options: TransactionOption[];
  selected: string | null | undefined;
  accent: 'primary' | 'tertiary';
  onSelect: (value: string) => void;
  manageRoute?: Href;
  layout?: 'list' | 'grid';
};

// Transient bridge between a mounted form and its native selection sheet.
// Callbacks and draft values are never persisted or passed through route params.
export const useTransactionSelectionStore = create<{
  selection: TransactionSelection | null;
  open: (selection: TransactionSelection) => void;
  clear: (owner: symbol) => void;
}>((set) => ({
  selection: null,
  open: (selection) => set({ selection }),
  clear: (owner) => set((state) => state.selection?.owner === owner ? { selection: null } : state),
}));
