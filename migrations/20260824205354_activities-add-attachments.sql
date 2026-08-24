alter table activities
  add column attachments jsonb not null default '[]'::jsonb;

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
      'attachments', new.attachments,
      'created_at', new.created_at
    )
  );
  return new;
end;
$$ language plpgsql security definer;
