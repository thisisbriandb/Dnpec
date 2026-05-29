insert into public.sectors (code, name, description)
values
  ('MINES', 'Mines', 'Entreprises minieres et extractives'),
  ('ENERGIE', 'Energie', 'Production, distribution et services energetiques'),
  ('FINANCE', 'Finances', 'Banques, assurances et services financiers'),
  ('COMMERCE', 'Commerce', 'Commerce et distribution'),
  ('INDUSTRIE', 'Industrie', 'Production industrielle et transformation')
on conflict (code) do nothing;

insert into public.form_templates (sector_id, title, description)
select id, 'Formulaire type - ' || name, 'Formulaire standard DNPEC associe au secteur ' || name
from public.sectors
on conflict (sector_id) do nothing;

with mines_template as (
  select ft.id
  from public.form_templates ft
  join public.sectors s on s.id = ft.sector_id
  where s.code = 'MINES'
),
version_insert as (
  insert into public.form_versions (template_id, version_number, status, schema, published_at)
  select
    id,
    1,
    'published',
    '{
      "sections": [
        {
          "key": "activite",
          "title": "Activite generale",
          "fields": [
            {"key":"production_tonnes","label":"Production mensuelle","type":"integer","required":true,"unit":"tonnes","min":0},
            {"key":"export_tonnes","label":"Volume exporte","type":"integer","required":true,"unit":"tonnes","min":0},
            {"key":"chiffre_affaires_gnf","label":"Chiffre d affaires","type":"decimal","required":true,"unit":"GNF","min":0}
          ]
        },
        {
          "key": "emploi",
          "title": "Emploi",
          "fields": [
            {"key":"employes_cdi","label":"Employes CDI","type":"integer","required":true,"min":0},
            {"key":"employes_cdd","label":"Employes CDD","type":"integer","required":true,"min":0}
          ]
        },
        {
          "key": "pieces",
          "title": "Pieces justificatives",
          "fields": [
            {"key":"rapport_mensuel","label":"Rapport mensuel","type":"file","required":false,"formats":["pdf","xlsx","csv"],"maxMb":10}
          ]
        }
      ]
    }'::jsonb,
    now()
  from mines_template
  on conflict (template_id, version_number) do update
    set status = excluded.status,
        schema = excluded.schema,
        published_at = excluded.published_at
  returning id, template_id
)
update public.form_templates ft
set current_version_id = vi.id
from version_insert vi
where ft.id = vi.template_id;
