insert into realtime.channels (pattern, description, enabled)
values ('tasks', 'Task INSERT/UPDATE events for the Kanban board', true)
on conflict (pattern) do update
set description = excluded.description,
    enabled = excluded.enabled;

-- Self-hosted note: project_admin does not own realtime.channels/messages here,
-- so RLS on those tables cannot be enabled from a migration. Subscribe/publish
-- are open to anon+authenticated (InsForge's documented default) until DB
-- ownership is granted and this restriction can be added back.

create or replace function public.notify_task_changed()
returns trigger as $$
begin
  perform realtime.publish(
    'tasks',
    'task_changed',
    jsonb_build_object(
      'op', lower(tg_op),
      'id', new.id,
      'project_id', new.project_id,
      'name', new.name,
      'status', new.status,
      'end_date', new.end_date,
      'progress', new.progress,
      'blocker_owner', new.blocker_owner,
      'owner', new.owner
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger task_changed_realtime
after insert or update of project_id, name, status, end_date, progress, blocker_owner, owner
on public.tasks
for each row execute function public.notify_task_changed();
