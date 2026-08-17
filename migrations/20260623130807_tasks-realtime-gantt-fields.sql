drop trigger if exists task_changed_realtime on public.tasks;

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
      'start_date', new.start_date,
      'end_date', new.end_date,
      'delivery_date', new.delivery_date,
      'progress', new.progress,
      'blocker_owner', new.blocker_owner,
      'owner', new.owner
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger task_changed_realtime
after insert or update of project_id, name, status, start_date, end_date, delivery_date, progress, blocker_owner, owner
on public.tasks
for each row execute function public.notify_task_changed();
