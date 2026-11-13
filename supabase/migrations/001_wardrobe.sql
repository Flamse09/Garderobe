-- Garderobe: tøj, outfits og indbakke. Alt ejes af den bruger, der er logget ind.
-- Kør i Supabase → SQL Editor. Tabellerne har præfikset wardrobe_, så de ikke støder ind i Spilscore og Mise.

create table if not exists public.wardrobe_inbox (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  note text,
  photo_paths text[] not null default '{}',
  status text not null default 'ny' check (status in ('ny', 'behandlet')),
  garment_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.wardrobe_garments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  product_name text,
  style_number text,
  category text not null,
  type text not null,
  color text not null,
  color_name text,
  pattern text,
  materials jsonb not null default '[]',
  size text,
  fit text,
  warmth text,
  seasons text[] not null default '{}',
  formality text,
  description text,
  care text,
  made_in text,
  retail_price numeric,
  currency text,
  product_url text,
  image_url text,
  image_path text,
  photo_paths text[] not null default '{}',
  confidence text not null default 'usikker' check (confidence in ('sikker', 'sandsynlig', 'usikker')),
  flags text[] not null default '{}',
  user_note text,
  label_text text,
  archived boolean not null default false,
  inbox_id uuid references public.wardrobe_inbox (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wardrobe_inbox
  drop constraint if exists wardrobe_inbox_garment_fk,
  add constraint wardrobe_inbox_garment_fk foreign key (garment_id) references public.wardrobe_garments (id) on delete set null;

create table if not exists public.wardrobe_outfits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.wardrobe_outfit_items (
  outfit_id uuid not null references public.wardrobe_outfits (id) on delete cascade,
  garment_id uuid not null references public.wardrobe_garments (id) on delete cascade,
  position int not null default 0,
  primary key (outfit_id, garment_id)
);

create index if not exists wardrobe_garments_owner on public.wardrobe_garments (owner_id);
create index if not exists wardrobe_inbox_owner on public.wardrobe_inbox (owner_id, status);
create index if not exists wardrobe_outfits_owner on public.wardrobe_outfits (owner_id);
create index if not exists wardrobe_outfit_items_garment on public.wardrobe_outfit_items (garment_id);

create or replace function public.wardrobe_touch() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists wardrobe_garments_touch on public.wardrobe_garments;
create trigger wardrobe_garments_touch before update on public.wardrobe_garments
  for each row execute function public.wardrobe_touch();

-- RLS: kun ejeren.
alter table public.wardrobe_inbox enable row level security;
alter table public.wardrobe_garments enable row level security;
alter table public.wardrobe_outfits enable row level security;
alter table public.wardrobe_outfit_items enable row level security;

drop policy if exists "owner" on public.wardrobe_inbox;
create policy "owner" on public.wardrobe_inbox for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owner" on public.wardrobe_garments;
create policy "owner" on public.wardrobe_garments for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owner" on public.wardrobe_outfits;
create policy "owner" on public.wardrobe_outfits for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owner" on public.wardrobe_outfit_items;
create policy "owner" on public.wardrobe_outfit_items for all to authenticated
  using (exists (select 1 from public.wardrobe_outfits o where o.id = outfit_id and o.owner_id = auth.uid()))
  with check (
    exists (select 1 from public.wardrobe_outfits o where o.id = outfit_id and o.owner_id = auth.uid())
    and exists (select 1 from public.wardrobe_garments g where g.id = garment_id and g.owner_id = auth.uid())
  );

-- Privat bucket. Filer ligger under <uid>/..., og hver bruger kan kun røre sin egen mappe.
insert into storage.buckets (id, name, public)
values ('garderobe', 'garderobe', false)
on conflict (id) do nothing;

drop policy if exists "garderobe read own" on storage.objects;
create policy "garderobe read own" on storage.objects for select to authenticated
  using (bucket_id = 'garderobe' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "garderobe insert own" on storage.objects;
create policy "garderobe insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'garderobe' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "garderobe update own" on storage.objects;
create policy "garderobe update own" on storage.objects for update to authenticated
  using (bucket_id = 'garderobe' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "garderobe delete own" on storage.objects;
create policy "garderobe delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'garderobe' and (storage.foldername(name))[1] = auth.uid()::text);
