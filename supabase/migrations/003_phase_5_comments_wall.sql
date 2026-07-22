alter table public.comments
  drop constraint if exists comments_author_name_check,
  drop constraint if exists comments_message_check,
  add constraint comments_author_name_check check (char_length(author_name) between 1 and 24),
  add constraint comments_message_check check (char_length(message) between 1 and 700);

alter table public.wall_notes
  drop constraint if exists wall_notes_author_name_check,
  drop constraint if exists wall_notes_message_check,
  add constraint wall_notes_author_name_check check (char_length(author_name) between 1 and 24),
  add constraint wall_notes_message_check check (char_length(message) between 1 and 240);

create or replace function public.public_move_wall_note(
  p_id uuid,
  p_x_position numeric,
  p_y_position numeric
)
returns public.wall_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  moved_note public.wall_notes;
begin
  update public.wall_notes
  set
    x_position = least(greatest(p_x_position, 2), 82),
    y_position = least(greatest(p_y_position, 8), 78)
  where id = p_id
    and status = 'approved'
    and expires_at > now()
  returning * into moved_note;

  if moved_note.id is null then
    raise exception 'Wall note is not movable.';
  end if;

  return moved_note;
end;
$$;
