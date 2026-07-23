create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  client_id uuid not null,
  emoji text not null check (emoji in ('👍', '❤️', '😂', '😢', '🚲', '💯', '🔥', '🙌', '🤯', '👏')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (comment_id, client_id)
);

create index if not exists comment_reactions_comment_idx
on public.comment_reactions(comment_id);

drop trigger if exists set_comment_reactions_updated_at on public.comment_reactions;
create trigger set_comment_reactions_updated_at before update on public.comment_reactions
for each row execute function public.set_updated_at();

alter table public.comment_reactions enable row level security;

create policy "Public can read comment reactions"
on public.comment_reactions for select
using (true);

create policy "Admins manage comment reactions"
on public.comment_reactions for all
using (public.is_admin())
with check (public.is_admin());
