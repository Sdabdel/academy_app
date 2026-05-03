-- ============================================================
-- Tables
-- ============================================================

create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text not null,
  full_name  text,
  role       text not null default 'etudiant'
             check (role in ('admin', 'professeur', 'etudiant')),
  created_at timestamptz default now()
);

create table public.courses (
  id           uuid default gen_random_uuid() primary key,
  title        text not null,
  description  text,
  professor_id uuid references public.profiles(id) on delete cascade not null,
  created_at   timestamptz default now()
);

create table public.enrollments (
  id          uuid default gen_random_uuid() primary key,
  student_id  uuid references public.profiles(id) on delete cascade not null,
  course_id   uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique (student_id, course_id)
);

create table public.assignments (
  id          uuid default gen_random_uuid() primary key,
  course_id   uuid references public.courses(id) on delete cascade not null,
  title       text not null,
  description text,
  due_date    timestamptz,
  created_at  timestamptz default now()
);

create table public.submissions (
  id            uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id    uuid references public.profiles(id) on delete cascade not null,
  file_url      text not null,
  grade         numeric(4, 2) check (grade >= 0 and grade <= 20),
  feedback      text,
  submitted_at  timestamptz default now(),
  graded_at     timestamptz,
  unique (assignment_id, student_id)
);

-- ============================================================
-- Trigger: auto-create profile on sign-up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'etudiant')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Helper: bypass RLS to check current user's role
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.courses     enable row level security;
alter table public.enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

-- profiles
create policy "profiles: own row or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: update own row or admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

create policy "profiles: admin delete"
  on public.profiles for delete
  using (public.is_admin());

-- courses
create policy "courses: authenticated read"
  on public.courses for select
  using (auth.role() = 'authenticated');

create policy "courses: professor insert"
  on public.courses for insert
  with check (
    auth.uid() = professor_id and
    (select role from public.profiles where id = auth.uid()) = 'professeur'
  );

create policy "courses: professor update own"
  on public.courses for update
  using (auth.uid() = professor_id);

create policy "courses: professor or admin delete"
  on public.courses for delete
  using (auth.uid() = professor_id or public.is_admin());

-- enrollments
create policy "enrollments: student sees own"
  on public.enrollments for select
  using (
    auth.uid() = student_id or
    exists (select 1 from public.courses where id = course_id and professor_id = auth.uid()) or
    public.is_admin()
  );

create policy "enrollments: student insert own"
  on public.enrollments for insert
  with check (
    auth.uid() = student_id and
    (select role from public.profiles where id = auth.uid()) = 'etudiant'
  );

create policy "enrollments: student delete own"
  on public.enrollments for delete
  using (auth.uid() = student_id);

-- assignments
create policy "assignments: enrolled or professor or admin read"
  on public.assignments for select
  using (
    exists (
      select 1 from public.enrollments
      where course_id = assignments.course_id and student_id = auth.uid()
    ) or
    exists (
      select 1 from public.courses
      where id = assignments.course_id and professor_id = auth.uid()
    ) or
    public.is_admin()
  );

create policy "assignments: professor manage own courses"
  on public.assignments for all
  using (
    exists (
      select 1 from public.courses
      where id = course_id and professor_id = auth.uid()
    )
  );

-- submissions
create policy "submissions: student sees own"
  on public.submissions for select
  using (
    auth.uid() = student_id or
    exists (
      select 1 from public.assignments a
      join public.courses c on c.id = a.course_id
      where a.id = assignment_id and c.professor_id = auth.uid()
    ) or
    public.is_admin()
  );

create policy "submissions: student insert own"
  on public.submissions for insert
  with check (
    auth.uid() = student_id and
    (select role from public.profiles where id = auth.uid()) = 'etudiant' and
    exists (
      select 1 from public.enrollments e
      join public.assignments a on a.course_id = e.course_id
      where a.id = assignment_id and e.student_id = auth.uid()
    )
  );

create policy "submissions: student update own (resubmit)"
  on public.submissions for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy "submissions: professor grade"
  on public.submissions for update
  using (
    exists (
      select 1 from public.assignments a
      join public.courses c on c.id = a.course_id
      where a.id = assignment_id and c.professor_id = auth.uid()
    )
  );

-- ============================================================
-- Storage bucket for assignment submissions
-- ============================================================

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict do nothing;

create policy "submissions bucket: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'submissions' and auth.role() = 'authenticated');

create policy "submissions bucket: authenticated download"
  on storage.objects for select
  using (bucket_id = 'submissions' and auth.role() = 'authenticated');

create policy "submissions bucket: owner delete"
  on storage.objects for delete
  using (bucket_id = 'submissions' and auth.uid()::text = (storage.foldername(name))[2]);
