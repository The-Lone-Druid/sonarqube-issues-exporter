import { useSyncExternalStore } from 'react';
import type { EditorId } from '../../core/types';

const KEY = 'sq-editor';
const listeners = new Set<() => void>();

function read(): EditorId | null {
  return (localStorage.getItem(KEY) as EditorId | null) ?? null;
}

export function setEditorPref(editor: EditorId): void {
  localStorage.setItem(KEY, editor);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** User-chosen editor override (localStorage), or null to use the server default. */
export function useEditorPref(): EditorId | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
