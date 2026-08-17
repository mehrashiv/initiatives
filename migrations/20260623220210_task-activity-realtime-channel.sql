insert into realtime.channels (pattern, description, enabled)
values ('task-activity:%', 'Per-task activity (system events + notes) INSERT/UPDATE events for Task Detail', true)
on conflict (pattern) do update
set description = excluded.description,
    enabled = excluded.enabled;

-- Self-hosted note: project_admin does not own realtime.channels/messages here,
-- so RLS on that table cannot be enabled from a migration. Subscribe/publish
-- are open to anon+authenticated (InsForge's documented default) until DB
-- ownership is granted and this restriction can be added back.

create or replace function public.notify_activity_changed()
returns trigger as $$
begin
  perform realtime.publish(
    'task-activity:' || new.task_id::text,
    'activity_changed',
    jsonb_build_object(
      'op', lower(tg_op),
      'id', new.id,
      'task_id', new.task_id,
      'kind', new.kind,
      'who', new.who,
      'text', new.text,
      'edited', new.edited,
      'pinned', new.pinned,
      'created_at', new.created_at
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger activity_changed_realtime
after insert or update of text, edited, pinned
on public.activities
for each row execute function public.notify_activity_changed();
