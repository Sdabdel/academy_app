-- Called by the admin-users edge function (service_role) to invalidate all sessions for a user
create or replace function public.delete_user_sessions(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  delete from auth.sessions where user_id = p_user_id;
end;
$$;

revoke execute on function public.delete_user_sessions(uuid) from public, anon, authenticated;
grant  execute on function public.delete_user_sessions(uuid) to service_role;
