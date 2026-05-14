-- Additional RLS for admin visibility across operational tables

create policy "payments_select_admin"
  on public.payments for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "contact_submissions_select_admin"
  on public.contact_submissions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "analytics_select_admin"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "ai_recommendations_select_admin"
  on public.ai_recommendations for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
