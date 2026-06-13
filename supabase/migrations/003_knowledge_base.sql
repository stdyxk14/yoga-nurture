create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('handwritten_image', 'handwritten_pdf', 'manual_text', 'pdf', 'image')),
  file_path text,
  file_name text,
  file_mime_type text,
  file_size bigint,
  description text,
  tags text[] not null default '{}',
  status text not null default 'uploaded' check (status in ('uploaded', 'ocr_pending', 'ocr_processing', 'ocr_review_needed', 'card_draft', 'active', 'archived', 'error')),
  raw_ocr_text text,
  cleaned_text text,
  summary text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.knowledge_documents(id) on delete cascade,
  title text not null,
  category text,
  content text not null,
  do_points text[] not null default '{}',
  dont_points text[] not null default '{}',
  example_phrases text[] not null default '{}',
  related_tags text[] not null default '{}',
  mentor_type text not null default 'general' check (mentor_type in ('body', 'communication', 'lesson_design', 'general')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_cards enable row level security;

drop policy if exists "knowledge documents are owned by user" on public.knowledge_documents;
create policy "knowledge documents are owned by user" on public.knowledge_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "knowledge cards are owned by user" on public.knowledge_cards;
create policy "knowledge cards are owned by user" on public.knowledge_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists knowledge_documents_user_status_idx on public.knowledge_documents(user_id, status, updated_at desc);
create index if not exists knowledge_documents_user_source_idx on public.knowledge_documents(user_id, source_type, updated_at desc);
create index if not exists knowledge_cards_user_status_idx on public.knowledge_cards(user_id, status, updated_at desc);
create index if not exists knowledge_cards_document_id_idx on public.knowledge_cards(document_id);

drop trigger if exists knowledge_documents_set_updated_at on public.knowledge_documents;
create trigger knowledge_documents_set_updated_at before update on public.knowledge_documents
  for each row execute function public.set_updated_at();

drop trigger if exists knowledge_cards_set_updated_at on public.knowledge_cards;
create trigger knowledge_cards_set_updated_at before update on public.knowledge_cards
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge-files',
  'knowledge-files',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 20971520,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

drop policy if exists "knowledge files are readable by owner" on storage.objects;
create policy "knowledge files are readable by owner" on storage.objects
  for select using (
    bucket_id = 'knowledge-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "knowledge files are insertable by owner" on storage.objects;
create policy "knowledge files are insertable by owner" on storage.objects
  for insert with check (
    bucket_id = 'knowledge-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "knowledge files are updatable by owner" on storage.objects;
create policy "knowledge files are updatable by owner" on storage.objects
  for update using (
    bucket_id = 'knowledge-files'
    and split_part(name, '/', 1) = auth.uid()::text
  ) with check (
    bucket_id = 'knowledge-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "knowledge files are deletable by owner" on storage.objects;
create policy "knowledge files are deletable by owner" on storage.objects
  for delete using (
    bucket_id = 'knowledge-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );
