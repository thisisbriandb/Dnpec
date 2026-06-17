-- Empêche la création de plusieurs entreprises avec le même email de contact
-- (insensible à la casse). Aucun contrôle d'unicité n'existait sur ce champ,
-- ce qui permettait notamment à la direction de créer des doublons via
-- createCompanyByDirection (seul le NIF était vérifié).
create unique index if not exists companies_contact_email_unique_idx
  on public.companies (lower(contact_email));
