alter table public.wall_notes
  drop constraint if exists wall_notes_message_check,
  add constraint wall_notes_message_check check (char_length(message) between 0 and 240);
