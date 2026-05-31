import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Ref } from '../lib/api-client';

export interface Selection {
  project: string | null;
  ref: Ref;
  setProject: (project: string) => void;
  setRef: (ref: Ref) => void;
}

/** Project + branch/PR selection, backed by URL search params (shareable). */
export function useSelection(): Selection {
  const [params, setParams] = useSearchParams();

  const project = params.get('project');
  const branch = params.get('branch');
  const pr = params.get('pr');
  const ref: Ref = pr
    ? { type: 'pr', value: pr }
    : branch
      ? { type: 'branch', value: branch }
      : undefined;

  const setProject = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('project', next);
          // Reset branch/PR + project-specific issue filters on project change.
          p.delete('branch');
          p.delete('pr');
          p.delete('issue');
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setRef = useCallback(
    (next: Ref) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete('branch');
          p.delete('pr');
          if (next?.type === 'branch') p.set('branch', next.value);
          if (next?.type === 'pr') p.set('pr', next.value);
          p.delete('issue');
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { project, ref, setProject, setRef };
}
