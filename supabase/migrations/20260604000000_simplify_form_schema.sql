-- ============================================================
-- Suppression du versioning des formulaires
-- Le schéma (sections/champs) est stocké directement sur
-- form_templates. Une campagne pointe vers form_template_id.
-- ============================================================

-- 1. Ajouter les nouvelles colonnes sur form_templates
alter table public.form_templates
  add column if not exists schema jsonb not null default '{"sections":[]}'::jsonb,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published')),
  add column if not exists published_by uuid references public.profiles(id),
  add column if not exists published_at timestamptz;

-- 2. Casser la contrainte circulaire avant de toucher form_versions
alter table public.form_templates
  drop constraint if exists form_templates_current_version_id_fkey;

-- 3. Migrer le schéma de la version courante vers form_templates
update public.form_templates ft
set
  schema       = coalesce(
    (select fv.schema from public.form_versions fv where fv.id = ft.current_version_id),
    '{"sections":[]}'::jsonb
  ),
  status       = case when ft.current_version_id is not null then 'published' else 'draft' end,
  published_by = (select fv.published_by from public.form_versions fv where fv.id = ft.current_version_id),
  published_at = (select fv.published_at  from public.form_versions fv where fv.id = ft.current_version_id)
where true;

-- 4. Supprimer current_version_id devenu inutile
alter table public.form_templates
  drop column if exists current_version_id;

-- 5. Migrer campaigns : form_version_id → form_template_id
alter table public.campaigns
  add column if not exists form_template_id uuid references public.form_templates(id);

-- Remplir form_template_id depuis form_versions pour les lignes existantes
update public.campaigns c
set form_template_id = (
  select fv.template_id
  from public.form_versions fv
  where fv.id = c.form_version_id
)
where c.form_template_id is null
  and c.form_version_id is not null;

-- Rendre form_template_id obligatoire
alter table public.campaigns
  alter column form_template_id set not null;

-- Supprimer l'ancienne colonne
alter table public.campaigns
  drop constraint if exists campaigns_form_version_id_fkey;

alter table public.campaigns
  drop column if exists form_version_id;

-- 6. Supprimer form_versions (les policies RLS tombent avec la table)
drop table if exists public.form_versions;

-- 7. Supprimer l'enum form_version_status
drop type if exists public.form_version_status cascade;

-- 8. Index
create index if not exists form_templates_status_idx on public.form_templates(status);
create index if not exists form_templates_sector_status_idx on public.form_templates(sector_id, status);
create index if not exists campaigns_template_idx on public.campaigns(form_template_id);
