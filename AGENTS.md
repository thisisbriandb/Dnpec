# Instructions Pour Agents IA - Projet DNPEC Collecte

Ce fichier est obligatoire pour tout agent IA travaillant dans ce depot.

## Regle 1 - Ne Pas Delirer

L'agent ne doit jamais inventer une fonctionnalite, une dependance, une table, une route, une API ou une decision metier.

Si une information manque, l'agent doit:

- lire les fichiers du projet;
- verifier les migrations Supabase;
- consulter la documentation locale Next.js si le sujet touche Next;
- signaler clairement ce qui est inconnu;
- proposer une hypothese seulement si elle est marquee comme hypothese.

Toute affirmation technique doit venir du code, du cahier de charge ou d'une documentation officielle.

## Regle 2 - Source De Verite

Les sources de verite du projet sont, dans cet ordre:

1. Le cahier de charge DNPEC fourni par le proprietaire du projet.
2. Les migrations Supabase dans `supabase/migrations/`.
3. La documentation d'architecture dans `docs/architecture.md`.
4. Le contrat API dans `docs/api/openapi.yaml`.
5. Le code applicatif dans `app/`.

L'agent ne doit pas faire passer une maquette visuelle pour une fonctionnalite terminee si la base de donnees, les politiques RLS ou les routes metier ne sont pas implementees.

## Regle 3 - Next.js Local

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

En particulier:

- utiliser `proxy.ts` et non `middleware.ts` avec Next.js 16;
- lire les guides locaux avant de modifier les routes, Server Actions, cookies, auth ou fichiers de convention;
- ne pas supposer que les anciennes pratiques Next.js sont encore valides.

## Regle 4 - Supabase D'abord

Le projet repose sur Supabase:

- Supabase Auth gere les comptes, sessions, email verification et reset password.
- PostgreSQL gere les donnees metier.
- Row Level Security protege les donnees.
- Supabase Storage gere les pieces justificatives.

L'agent ne doit pas contourner RLS avec une logique uniquement cote frontend.

Toute nouvelle table exposee au client doit avoir:

- `enable row level security`;
- des policies explicites;
- des index adaptes aux usages listes/recherche;
- des contraintes metier utiles.

La `SUPABASE_SERVICE_ROLE_KEY` est strictement serveur. Elle ne doit jamais etre importee dans un composant client ni exposee dans le navigateur.

## Regle 5 - Pas De Donnees Statiques Pour Le Metier

Les donnees metier ne doivent pas etre codees en dur dans l'interface:

- entreprises;
- campagnes;
- formulaires;
- soumissions;
- validations;
- notifications;
- exports;
- audit.

Les exemples statiques sont autorises uniquement dans la documentation, les seeds ou les placeholders clairement identifies.

## Regle 6 - Securite Et Roles

Respecter strictement les roles du cahier de charge:

- `super_admin`;
- `analyste`;
- `agent_saisie`;
- `entreprise`.

Avant toute action sensible, verifier l'autorisation:

- gestion utilisateurs DNPEC: super admin seulement;
- validation inscription entreprise: super admin ou analyste;
- creation/modification formulaire: super admin ou analyste;
- campagne: super admin ou analyste;
- saisie au nom d'une entreprise: super admin ou agent de saisie;
- validation/rejet soumission: super admin ou analyste;
- audit: super admin seulement.

## Regle 7 - Qualite Du Code

Avant de considerer une tache terminee, executer si possible:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Si une commande echoue, expliquer l'erreur et ne pas pretendre que le travail est termine.

## Regle 8 - Changements Limites

L'agent doit modifier uniquement ce qui est necessaire pour la tache.

Il ne doit pas:

- supprimer des fichiers sans raison explicite;
- changer l'architecture sans l'expliquer;
- ajouter des dependances inutiles;
- remplacer Supabase par une autre stack sans demande claire;
- melanger prototype, production et documentation.

## Regle 9 - Documentation

Tout changement structurel doit mettre a jour au moins un de ces fichiers si concerne:

- `README.md`;
- `docs/architecture.md`;
- `docs/api/openapi.yaml`;
- `supabase/migrations/`.

## Regle 10 - Honnetete Sur L'Etat Du Projet

L'agent doit toujours distinguer:

- ce qui est implemente;
- ce qui est seulement structure;
- ce qui est documente;
- ce qui reste a faire.

Ne jamais dire qu'une fonctionnalite est conforme au cahier de charge si elle n'est pas testable de bout en bout.
