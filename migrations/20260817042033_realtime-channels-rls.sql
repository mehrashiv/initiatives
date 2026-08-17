-- Restores the access-control policies that 20260623042053_tasks-realtime-channel.sql
-- and 20260623220210_task-activity-realtime-channel.sql originally intended, deferred
-- because project_admin did not own realtime.channels/messages on first deploy of this
-- self-hosted instance. Ownership was granted manually via psql, then this ran.

alter table realtime.channels enable row level security;
alter table realtime.messages enable row level security;

drop policy if exists tasks_channel_subscribe_authenticated on realtime.channels;
create policy tasks_channel_subscribe_authenticated
on realtime.channels for select
to authenticated
using (pattern = 'tasks');

drop policy if exists task_activity_channel_subscribe_authenticated on realtime.channels;
create policy task_activity_channel_subscribe_authenticated
on realtime.channels for select
to authenticated
using (pattern = 'task-activity:%');
