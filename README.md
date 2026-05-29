# DNPEC Collecte

Plateforme web de collecte nationale des donnees economiques pour la DNPEC.

Le projet part sur une architecture **Next.js + Supabase** afin de couvrir le cahier de charge: authentification, repertoire entreprises, formulaires sectoriels, campagnes de collecte, soumissions, validation, notifications, exports, pieces justificatives et audit.

## Architecture

### Frontend

- **Next.js 16 App Router**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- Server Components et Server Actions pour les mutations simples
- `proxy.ts` pour le rafraichissement de session Supabase

Important: Next.js 16 a des conventions differentes des anciennes versions. Lire les guides locaux dans `node_modules/next/dist/docs/` avant de modifier les routes, Server Actions, cookies, auth ou fichiers de convention.

### Backend / BaaS

- **Supabase Auth**: email, mot de passe, verification email, reset password, JWT et session.
- **Supabase PostgreSQL**: donnees metier.
- **Row Level Security**: isolation stricte par role et par entreprise.
- **Supabase Storage**: pieces justificatives dans le bucket prive `justificatifs`.
- **OpenAPI cible**: `docs/api/openapi.yaml`, expose via `/api/docs`.

### Roles applicatifs

Les roles sont stockes dans `public.profiles.role`:

- `super_admin`: acces total, gestion utilisateurs, audit, configuration.
- `analyste`: formulaires, campagnes, validations, analyses, exports.
- `agent_saisie`: saisie au nom d'une entreprise.
- `entreprise`: auto-declaration et historique limite a son entreprise.

## Structure Du Projet

```text
app/
  actions/              Server Actions, notamment auth
  api/                  Routes API Next.js
  auth/callback/        Callback Supabase Auth
  lib/supabase/         Clients Supabase serveur et navigateur
  dashboard/            Portail Direction
  entreprises/          Repertoire et inscriptions
  formulaires/          Formulaires types par secteur
  campagnes/            Campagnes de collecte
  validations/          Validation des soumissions
  analyses/             Tableaux analytiques
  exports/              Jobs d'export
  audit/                Journal d'audit
  tableau-de-bord/      Portail Entreprise
  historique/           Historique Entreprise
  notifications/        Centre notifications

supabase/
  migrations/           Schema, RLS, policies, storage
  seed.sql              Donnees de depart

docs/
  architecture.md       Decisions techniques et mapping cahier de charge
  api/openapi.yaml      Contrat REST cible

proxy.ts                Proxy Next.js 16 pour Supabase SSR
AGENTS.md              Regles de travail pour agents IA
```

## Prerequis

- Node.js compatible avec Next.js 16
- npm
- Docker
- Supabase CLI

Verifier:

```bash
node --version
npm --version
supabase --version
docker --version
```

## Installation

```bash
npm install
cp .env.example .env.local
```

Renseigner `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` est utilisable cote navigateur.
- `SUPABASE_SERVICE_ROLE_KEY` est strictement serveur. Ne jamais l'importer dans un composant client.
- En local, les valeurs viennent de `supabase start`.

## Lancer En Local

Demarrer Supabase:

```bash
supabase start
```

Appliquer schema + seed:

```bash
supabase db reset
```

Lancer Next:

```bash
npm run dev
```

Ouvrir:

```text
http://localhost:3000
```

Endpoints utiles:

```text
/login
/inscription
/dashboard
/api/docs
/api/v1/health
```

## Base De Donnees

La migration principale est:

```text
supabase/migrations/20260529000000_dnpec_core.sql
```

Elle cree:

- enums applicatifs;
- tables metier;
- contraintes;
- index;
- triggers;
- fonctions helper RLS;
- policies RLS;
- bucket Storage `justificatifs`;
- policies Storage;
- parametres systeme.

Le seed:

```text
supabase/seed.sql
```

Ajoute des secteurs initiaux et un formulaire type Mines publie.

## Modules Metier

| Module | Tables principales |
| --- | --- |
| Auth / roles | `auth.users`, `profiles` |
| Entreprises | `companies`, `sectors` |
| Formulaires | `form_templates`, `form_versions` |
| Campagnes | `campaigns`, `campaign_targets` |
| Soumissions | `submissions`, `submission_versions` |
| Validation | `submission_field_comments`, `notifications` |
| Pieces jointes | `attachments`, `storage.objects` |
| Exports | `export_jobs` |
| Audit | `audit_logs` |
| Configuration | `system_settings` |

## Creer Le Premier Super Admin

1. Creer un utilisateur dans Supabase Auth.
2. Valider son profil dans SQL:

```sql
update public.profiles
set role = 'super_admin',
    account_status = 'validated'
where email = 'admin@example.gn';
```

Les prochains comptes DNPEC devront etre crees via une action serveur utilisant `SUPABASE_SERVICE_ROLE_KEY`.

## Workflow De Developpement

Avant de coder:

1. Lire `AGENTS.md`.
2. Lire `docs/architecture.md`.
3. Verifier la migration Supabase concernee.
4. Lire la doc Next locale si la tache touche Next.js.

Pendant le dev:

- Ne pas coder de donnees metier statiques dans l'UI.
- Ne pas contourner RLS avec seulement du filtrage frontend.
- Toute table exposee doit avoir RLS + policies.
- Toute liste doit etre pensee avec pagination.
- Toute action sensible doit etre auditable.
- Garder OpenAPI a jour si un endpoint change.

Avant de terminer:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Ajouter Une Fonctionnalite

### 1. Donnees

Modifier ou ajouter une migration dans `supabase/migrations/`.

Verifier:

- contraintes;
- index;
- RLS;
- policies;
- audit si necessaire.

### 2. API / Action

Selon le besoin:

- Server Action dans `app/actions/`;
- Route API dans `app/api/v1/...`;
- lecture directe serveur via client Supabase SSR.

Les erreurs API doivent suivre le contrat OpenAPI:

```json
{
  "error": "code",
  "message": "Message lisible",
  "details": {}
}
```

### 3. Interface

Ajouter ou modifier une page dans `app/`.

Les pages doivent lire les donnees depuis Supabase ou les routes API. Les placeholders sont acceptes uniquement s'ils sont clairement temporaires.

### 4. Documentation

Mettre a jour si necessaire:

- `README.md`;
- `docs/architecture.md`;
- `docs/api/openapi.yaml`;
- `AGENTS.md`;
- migrations Supabase.

## Conventions Supabase

- Utiliser `createClient()` depuis `app/lib/supabase/server.ts` pour le serveur.
- Utiliser `createClient()` depuis `app/lib/supabase/browser.ts` pour le navigateur.
- Utiliser `createAdminClient()` seulement cote serveur pour les actions d'administration.
- Ne jamais exposer la service role key.
- Preferer les policies RLS simples et explicites.

## Conventions Next.js

- `proxy.ts` remplace `middleware.ts`.
- Les routes API utilisent les Route Handlers dans `app/api/.../route.ts`.
- Les mutations simples peuvent utiliser des Server Actions.
- Ne pas importer de modules serveur dans des composants client.
- Eviter `next/font/google` si le build doit fonctionner hors reseau.

## Verification

Commandes de controle:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Etat actuel attendu:

- TypeScript: OK
- ESLint: OK
- Build: OK

## Documentation

- Architecture: `docs/architecture.md`
- OpenAPI: `docs/api/openapi.yaml`
- Regles agents IA: `AGENTS.md`
- OpenAPI servi par Next: `/api/docs`

## Prochaines Priorites

1. Brancher les pages listes sur Supabase avec pagination.
2. Creer les actions serveur pour validation/rejet entreprise.
3. Creer la configuration de formulaire type par secteur.
4. Implementer creation/envoi de campagne.
5. Implementer soumission entreprise avec sauvegarde brouillon.
6. Ajouter notifications in-app reelles.
7. Ajouter audit automatique sur actions sensibles.
8. Ajouter tests unitaires et integration.
