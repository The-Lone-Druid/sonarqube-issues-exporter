import type { EditorId } from '../../../core/types';
import { Select } from '../ui/select';
import { useConfig } from '../../hooks/use-queries';
import { setEditorPref, useEditorPref } from '../../lib/editor-pref';

const EDITORS: Array<{ value: EditorId; label: string }> = [
  { value: 'vscode', label: 'VS Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'jetbrains', label: 'JetBrains' },
];

/** Choose which editor "Open in IDE" targets (persisted locally). */
export function EditorPicker() {
  const { data: config } = useConfig();
  const pref = useEditorPref();
  const value = pref ?? config?.ide.editor ?? 'vscode';

  return (
    <Select
      value={value}
      onChange={(e) => setEditorPref(e.target.value as EditorId)}
      aria-label="Editor for Open in IDE"
      title="Editor for Open in IDE"
      className="hidden md:block"
    >
      {EDITORS.map((ed) => (
        <option key={ed.value} value={ed.value}>
          {ed.label}
        </option>
      ))}
    </Select>
  );
}
