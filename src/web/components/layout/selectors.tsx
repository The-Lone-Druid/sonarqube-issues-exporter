import { useEffect } from 'react';
import { Select } from '../ui/select';
import { useSelection } from '../../hooks/use-selection';
import { useBranches, useProjects } from '../../hooks/use-queries';
import { useConfig } from '../../hooks/use-queries';

export function ProjectSwitcher() {
  const { project, setProject } = useSelection();
  const { data: config } = useConfig();
  const { data, isLoading } = useProjects();
  const projects = data?.projects ?? [];

  // Default to the configured project (or first available) when none is selected.
  useEffect(() => {
    if (project || projects.length === 0) return;
    const fallback =
      (config?.defaultProjectKey &&
        projects.find((p) => p.key === config.defaultProjectKey)?.key) ||
      projects[0]?.key;
    if (fallback) setProject(fallback);
  }, [project, projects, config, setProject]);

  return (
    <Select
      value={project ?? ''}
      onChange={(e) => setProject(e.target.value)}
      disabled={isLoading || projects.length === 0}
      aria-label="Project"
      className="max-w-[260px]"
    >
      {projects.length === 0 && <option value="">No projects</option>}
      {projects.map((p) => (
        <option key={p.key} value={p.key}>
          {p.name}
        </option>
      ))}
    </Select>
  );
}

export function BranchPrSelector() {
  const { project, ref, setRef } = useSelection();
  const { data } = useBranches(project);
  const branches = data?.branches ?? [];
  const pullRequests = data?.pullRequests ?? [];

  if (!project || (branches.length <= 1 && pullRequests.length === 0)) return null;

  const current = ref ? `${ref.type}:${ref.value}` : '';

  return (
    <Select
      value={current}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) return setRef(undefined);
        const [type, ...rest] = v.split(':');
        const value = rest.join(':');
        setRef(type === 'pr' ? { type: 'pr', value } : { type: 'branch', value });
      }}
      aria-label="Branch or pull request"
      className="max-w-[220px]"
    >
      <option value="">Main branch</option>
      {branches.length > 0 && (
        <optgroup label="Branches">
          {branches.map((b) => (
            <option key={b.name} value={`branch:${b.name}`}>
              {b.name}
              {b.isMain ? ' (main)' : ''}
            </option>
          ))}
        </optgroup>
      )}
      {pullRequests.length > 0 && (
        <optgroup label="Pull requests">
          {pullRequests.map((pr) => (
            <option key={pr.key} value={`pr:${pr.key}`}>
              #{pr.key} {pr.title}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}
