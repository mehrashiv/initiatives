alter table storage.objects enable row level security;

create policy storage_objects_task_attachments_select on storage.objects
  for select to authenticated
  using (bucket = 'task-attachments');

create policy storage_objects_task_attachments_insert on storage.objects
  for insert to authenticated
  with check (bucket = 'task-attachments' and uploaded_by = (select auth.jwt() ->> 'sub'));

create policy storage_objects_task_attachments_delete on storage.objects
  for delete to authenticated
  using (bucket = 'task-attachments' and uploaded_by = (select auth.jwt() ->> 'sub'));

grant select, insert, delete on storage.objects to authenticated;
grant usage on schema storage to authenticated;
