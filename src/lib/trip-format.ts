export function formatCountry(country?: string) {
  const value = country?.trim();
  if (!value) return "Država nije upisana";
  return value;
}

export function formatKilometerRange(start?: string, end?: string) {
  const from = start?.trim();
  const to = end?.trim();

  if (from && to) return `${from} km → ${to} km`;
  if (from) return `${from} km →`;
  if (to) return `→ ${to} km`;
  return "Kilometarski raspon nije upisan";
}
