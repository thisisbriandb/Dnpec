-- Allow unauthenticated visitors (e.g. /inscription page) to read active sectors.
-- The existing policy "sectors_select_authenticated" only covers the `authenticated` role,
-- blocking the sector dropdown for users who haven't signed up yet.

create policy "sectors_select_anon" on public.sectors
  for select to anon
  using (is_active = true);
