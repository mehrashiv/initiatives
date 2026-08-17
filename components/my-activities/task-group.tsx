import { TaskRow } from "./task-row";
import { accentKeyFor, BUCKET_BORDER_CLASS, BUCKET_DOT_CLASS, BUCKET_TITLE, type Bucket } from "./task-helpers";
import type { ActivityTask } from "./types";

interface TaskGroupProps {
  bucket: Bucket;
  tasks: ActivityTask[];
  today: Date;
  showOwner: boolean;
  onMarkDone: (id: string) => void;
  onToggleFollowUp: (id: string) => void;
  onAddNote: (id: string, text: string) => Promise<boolean>;
}

export function TaskGroup({ bucket, tasks, today, showOwner, onMarkDone, onToggleFollowUp, onAddNote }: TaskGroupProps) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2.25 border-y border-border bg-surface-subtle px-[20px] py-2.75">
        <span className={`h-2.25 w-2.25 rounded-full ${BUCKET_DOT_CLASS[bucket]}`} />
        <span className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          {BUCKET_TITLE[bucket]}
        </span>
        <span className="text-xs font-semi text-text-faint">{tasks.length}</span>
      </div>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          today={today}
          showOwner={showOwner}
          borderClassName={BUCKET_BORDER_CLASS[accentKeyFor(task, bucket)]}
          onMarkDone={onMarkDone}
          onToggleFollowUp={onToggleFollowUp}
          onAddNote={onAddNote}
        />
      ))}
    </div>
  );
}
