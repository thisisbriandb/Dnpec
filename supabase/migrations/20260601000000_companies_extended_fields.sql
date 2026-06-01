-- Migration : champs étendus entreprises + table pièces justificatives
--
-- SETUP MANUEL REQUIS pour Supabase Storage :
--   Depuis le Dashboard Supabase > Storage > New bucket
--     Nom    : company-docs
--     Public : false (privé)
--     Taille max par fichier : 10 Mo
--   Ou via SQL si la table storage.buckets est accessible :
--     INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--     VALUES (
--       'company-docs', 'company-docs', false, 10485760,
--       ARRAY['application/pdf','image/jpeg','image/png','image/jpg']
--     )
--     ON CONFLICT (id) DO NOTHING;
--   Puis ajouter les policies Storage :
--     super_admin et analyste : upload + download + delete
--     entreprise              : download de ses propres fichiers (path commence par {company_id}/)

-- ── Nouvelles colonnes sur companies (toutes nullable) ────────────────
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sigle             text,
  ADD COLUMN IF NOT EXISTS nom_dg            text,
  ADD COLUMN IF NOT EXISTS responsable_dnpec text,
  ADD COLUMN IF NOT EXISTS activite_nace     text,
  ADD COLUMN IF NOT EXISTS capital_social    bigint,
  ADD COLUMN IF NOT EXISTS region            text,
  ADD COLUMN IF NOT EXISTS commune           text,
  ADD COLUMN IF NOT EXISTS date_creation     date;

-- ── Table des pièces justificatives ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_documents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type     text        NOT NULL
                             CHECK (doc_type IN ('rccm', 'attestation_nif', 'bilan_comptable')),
  storage_path text        NOT NULL,
  uploaded_by  uuid        REFERENCES public.profiles(id),
  uploaded_at  timestamptz DEFAULT now()
);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- super_admin et analyste : toutes les opérations
CREATE POLICY "company_documents_staff_all"
  ON public.company_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'analyste')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'analyste')
    )
  );

-- agent_saisie : insertion uniquement (upload au nom d'une entreprise)
CREATE POLICY "company_documents_agent_insert"
  ON public.company_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'agent_saisie'
    )
  );

-- entreprise : lecture de ses propres pièces
CREATE POLICY "company_documents_entreprise_select"
  ON public.company_documents
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies
      WHERE profile_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS company_documents_company_id_idx
  ON public.company_documents(company_id);
