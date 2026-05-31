import { useSyncExternalStore } from 'react';
import type { EditorId } from '../../core/types';

/** 'default' = open with the OS default app; an EditorId = exact-line deep link. */
export type EditorChoice = EditorId | 'default';

const KEY = 'sq-editor';
const listeners = new Set<() => void>();

function read(): EditorChoice | null {
  return (localStorage.getItem(KEY) as EditorChoice | null) ?? null;
}

export function setEditorPref(choice: EditorChoice): void {
  localStorage.setItem(KEY, choice);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** User-chosen editor override (localStorage), or null to use the server default. */
export function useEditorPref(): EditorChoice | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
