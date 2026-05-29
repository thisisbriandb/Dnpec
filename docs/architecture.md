# Architecture DNPEC Collecte

## Decision structurante

Le socle est Supabase-first:

- Supabase Auth gere l'identite: email, mot de passe, verification email, reset password et sessions JWT.
- PostgreSQL porte le modele metier, les contraintes, les index et la tracabilite.
- Row Level Security isole les donnees au niveau base, y compris quand les donnees sont lues depuis le navigateur.
- Supabase Storage stocke les pieces justificatives dans le bucket prive `justificatifs`.
- Next.js fournit les portails web, les Server Actions et les ecrans metier.

Cette approche suit les recommandations Supabase actuelles: client SSR via `@supabase/ssr`, cookies serveur, RLS activee sur les tables exposees et politiques explicites par role.

## Modules Phase 1

| Cahier de charge | Tables / composants |
| --- | --- |
| Authentification | Supabase Auth + `profiles` |
| Utilisateurs DNPEC | `profiles.role`, `profiles.account_status` |
| Repertoire entreprises | `companies`, `sectors` |
| Formulaires types | `form_templates`, `form_versions` |
| Campagnes | `campaigns`, `campaign_targets` |
| Espace entreprise | `campaign_targets`, `submissions`, `submission_versions` |
| Validation | `submissions`, `submission_field_comments`, `notifications` |
| Pieces justificatives | `attachments` + Storage bucket `justificatifs` |
| Notifications | `notifications` |
| Exports | `export_jobs` |
| Audit | `audit_logs` |
| Parametres | `system_settings` |

## Roles applicatifs

- `super_admin`: acces total, audit, configuration, utilisateurs.
- `analyste`: formulaires, campagnes, validations, analyses, exports.
- `agent_saisie`: saisie au nom d'une entreprise.
- `entreprise`: auto-declaration et historique limite a son entreprise.

Les roles sont stockes dans `public.profiles`. Les mots de passe ne sont jamais stockes dans `public`: ils restent dans Supabase Auth.

## Flux entreprise

1. L'entreprise remplit `/inscription`.
2. Supabase Auth cree l'utilisateur avec verification email.
3. Une ligne `profiles` est creee par trigger.
4. Une ligne `companies` est creee en statut `pending`.
5. Un analyste ou super admin valide ou rejette.
6. Une campagne active cible l'entreprise via `campaign_targets`.
7. L'entreprise soumet une declaration dans `submissions` et `submission_versions`.
8. L'analyste valide, rejette ou demande correction.

## Flux campagne

1. Le Super Admin ou l'Analyste configure le formulaire type du secteur.
2. Une version publiee est creee dans `form_versions`.
3. La campagne reference cette version.
4. Les cibles sont materialisees dans `campaign_targets`.
5. Les notifications d'ouverture et de relance sont creees dans `notifications`.
6. Les soumissions sont validees et historisees.

## Securite

- RLS activee sur toutes les tables publiques.
- Les entreprises ne lisent que les lignes rattachees a leur `profile_id`.
- Les donnees brutes sont reservees aux roles Direction.
- L'audit est consultable uniquement par `super_admin`.
- Les fichiers sont dans un bucket prive avec politiques Storage.
- Les actions serveur sensibles utilisent `SUPABASE_SERVICE_ROLE_KEY`, jamais exposee au navigateur.

## Scalabilite

Le schema pose deja les index critiques: NIF, secteur, statut, campagnes, soumissions, JSONB des reponses et recherche trigramme sur le nom entreprise.

Pour viser 1 000 000 d'entreprises:

- ajouter pagination obligatoire dans tous les ecrans liste;
- partitionner `submissions` et `submission_versions` par annee ou periode;
- traiter exports, notifications et relances dans une queue;
- creer des vues materialisees pour les tableaux analytiques;
- utiliser Supabase Edge Functions ou un worker dedie pour les jobs longs.

## Ecart volontaire par rapport au cahier

Le cahier mentionne parfois NestJS, Django, Redis, BullMQ, MinIO et Traefik. Dans cette base, Supabase remplace une partie de ces briques:

- Supabase Auth remplace Passport/JWT custom.
- Supabase Storage remplace MinIO pour le MVP.
- Supabase Realtime peut remplacer Socket.io pour les notifications in-app.
- Les Edge Functions ou un worker Node pourront remplacer NestJS pour les jobs si l'equipe veut rester full Supabase.

Si l'objectif devient une architecture enterprise separee, Next.js peut rester frontend et Supabase peut rester PostgreSQL/Auth, avec une API NestJS au milieu.
