import { workStatusClasses, workStatusLabels } from '../work-formatters';
import type { WorkStatus } from '../models';

export function WorkStatusBadge({ status }: { status: WorkStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${workStatusClasses[status]}`}
    >
      {workStatusLabels[status]}
    </span>
  );
}
