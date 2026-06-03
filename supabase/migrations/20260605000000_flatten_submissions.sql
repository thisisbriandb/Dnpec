-- ============================================================
-- Suppression du versioning des soumissions (MVP)
-- Les réponses et le taux de complétion sont stockés
-- directement sur submissions. submission_versions est supprimé.
-- ============================================================

-- 1. Ajouter answers et completion_rate directement sur submissions
alter table public.submissions
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists completion_rate numeric(5,2) not null default 0
    check (completion_rate between 0 and 100);

-- 2. Migrer les données de la dernière version connue vers submissions
update public.submissions s
set
  answers         = coalesce(sv.answers, '{}'::jsonb),
  completion_rate = coalesce(sv.completion_rate, 0)
from public.submission_versions sv
where sv.submission_id = s.id
  and sv.version_number = s.current_version;

-- 3. Supprimer current_version (concept de version supprimé)
alter table public.submissions
  drop column if exists current_version;

-- 4. Supprimer submission_versions
--    (cascade supprime les FK depuis attachments et les policies RLS)
drop table if exists public.submission_versions cascade;

-- 5. Supprimer la colonne submission_version_id des attachments
--    (la FK a été droppée par cascade, la colonne reste orpheline)
alter table public.attachments
  drop column if exists submission_version_id;

-- 6. GIN index sur answers pour les recherches full-text futures
drop index if exists public.submission_versions_answers_gin_idx;
create index if not exists submissions_answers_gin_idx
  on public.submissions using gin(answers);

-- 7. Policy submission_versions (déjà supprimée par DROP TABLE, rien à faire)
