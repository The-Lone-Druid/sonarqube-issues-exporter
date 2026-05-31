import { Select } from '../ui/select';
import { useConfig } from '../../hooks/use-queries';
import { setEditorPref, useEditorPref, type EditorChoice } from '../../lib/editor-pref';

const CHOICES: Array<{ value: EditorChoice; label: string }> = [
  { value: 'default', label: 'Default app' },
  { value: 'vscode', label: 'VS Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'jetbrains', label: 'JetBrains' },
];

/** Choose how "Open in IDE" behaves: OS default app, or a specific editor (exact line). */
export function EditorPicker() {
  const { data: config } = useConfig();
  const pref = useEditorPref();
  const value: EditorChoice = pref ?? config?.ide.editor ?? 'default';

  return (
    <Select
      value={value}
      onChange={(e) => setEditorPref(e.target.value as EditorChoice)}
      aria-label="Open in IDE target"
      title="How 'Open in IDE' opens files"
      className="hidden md:block"
    >
      {CHOICES.map((ed) => (
        <option key={ed.value} value={ed.value}>
          {ed.label}
        </option>
      ))}
    </Select>
  );
}
