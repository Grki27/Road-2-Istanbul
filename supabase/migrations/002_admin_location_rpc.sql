create or replace function public.admin_update_current_location(
  p_latitude double precision,
  p_longitude double precision,
  p_note text default null,
  p_current_country text default null
)
returns public.current_locations
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_location public.current_locations;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_latitude < -90 or p_latitude > 90 then
    raise exception 'Latitude is outside the valid range';
  end if;

  if p_longitude < -180 or p_longitude > 180 then
    raise exception 'Longitude is outside the valid range';
  end if;

  insert into public.current_locations (latitude, longitude, note)
  values (p_latitude, p_longitude, nullif(trim(p_note), ''))
  returning * into saved_location;

  if nullif(trim(p_current_country), '') is not null then
    update public.trip_settings
    set current_country = trim(p_current_country)
    where id = 1;
  end if;

  return saved_location;
end;
$$;

revoke execute on function public.admin_update_current_location(double precision, double precision, text, text)
from public, anon;

grant execute on function public.admin_update_current_location(double precision, double precision, text, text)
to authenticated;
