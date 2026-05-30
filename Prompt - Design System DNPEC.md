# Prompt Claude Code — Design System DNPEC (à coller tel quel)

> Colle ce bloc à la racine d'un projet **Next.js 14 + TypeScript** déjà initialisé.
> Objectif : produire **uniquement le design system** (tokens + primitives shadcn customisées + page de démonstration + README), propre, typé et sans slop. Les écrans métier viendront après.

---

## Mission

Construis le **design system de la Plateforme DNPEC** (Direction Nationale de la Prévision Économique et de la Conjoncture — Ministère du Plan, République de Guinée). Pas les écrans métier : seulement la **fondation réutilisable**. Le standard est « équipe produit senior inspirée de Linear / Stripe / DSFR », **pas** « template admin généré ». Tout en **français** (fr-GN), formats `fr-FR`.

## Stack imposée

Next.js 14 (App Router) · TypeScript **strict** · Tailwind CSS · **shadcn/ui** (chaque primitive customisée à nos tokens, jamais le thème brut) · **lucide-react** (un seul jeu d'icônes) · `next/font` pour **Inter** + **JetBrains Mono**. Pas d'autre police, pas d'autre librairie UI.

## 1. Tokens — `app/globals.css` + `tailwind.config.ts`

Déclare ces variables CSS en `:root` (light) et expose-les dans Tailwind via `theme.extend` (couleurs, radius, ombres, fontFamily). Prévois la déclinaison **dark** sous `.dark` proprement (mêmes noms de tokens, valeurs adaptées) — si tu ne peux pas la soigner, ne la bâcle pas.

```
/* Surfaces & texte */
--bg:#F4F7FB;  --surface:#FFFFFF;  --surface-2:#F0F4F9;  --surface-3:#E7EDF6;
--border:#E2E9F3;  --border-strong:#C8D5E8;
--text-1:#0D1B2E;  --text-2:#2C3E55;  --text-3:#6272A4;  --text-4:#95A5BF;

/* Sidebar navy */
--sidebar:#0D1B2E;

/* Accent institutionnel */
--accent:#2563EB;  --accent-ink:#1B4FCE;  --accent-wash:#EEF4FF;
--ring: rgba(37,99,235,.16);

/* Statuts sémantiques */
--ok:#16A34A;   --ok-wash:#DCFCE7;   --ok-ink:#166534;     /* Validée / Active */
--warn:#F59E0B; --warn-wash:#FEF3C7; --warn-ink:#92400E;   /* En attente / En cours */
--bad:#EF4444;  --bad-wash:#FEE2E2;  --bad-ink:#991B1B;    /* Rejetée / urgent */
--neutral:#95A5BF; --neutral-wash:#F0F4F9;                 /* Suspendue */
--info:#2563EB;                                            /* Planifiée (= accent) */
--violet:#8B5CF6; --violet-wash:#F3E8FF;                   /* Audit / envoi (rare) */

/* Rayons */
--radius-card:11px;  --radius-control:8px;  --radius-pill:999px;

/* Ombres — fines, jamais lourdes */
--shadow-sm:0 1px 2px rgba(13,27,46,.06);
--shadow-md:0 10px 30px rgba(13,27,46,.10);
```

**Typo** : Inter pour l'UI, **JetBrains Mono pour tous les chiffres** (montants, NIF, %, dates, codes, horodatages) avec `font-variant-numeric: tabular-nums`. Échelle (px) : 11 / 12 / 13.5 (corps) · 15 / 20 (titres) · 24–28 (KPI). Min absolu 11px.

**Espacement** : grille 4px stricte, rythme vertical cohérent.

**Formatage** : helper `lib/format.ts` exportant `formatGNF(n)` → `4 820 000 000 GNF` (séparateur espace insécable), `formatNumber`, `formatPercent` → `68 %`, `formatDate` → `12 oct. 2025` (date-fns, locale `fr`).

## 2. Primitives à livrer (`components/ui/*`)

Chacune doit avoir ses **états réels** : default · hover · focus-visible (anneau `--ring` accessible) · active · disabled · loading · error · empty. Variants typés via `cva`.

- **Button** — variants `primary` (accent) · `secondary` (bordure) · `ghost` · `success` (vert) · `destructive` (rouge) ; tailles `sm | md | lg` ; état `loading` (spinner inline).
- **StatusBadge** — composant **unique** piloté par un `enum StatutType` → couleur + pastille. Mappe : `validee|active` → vert, `attente|en_cours` → ambre, `rejetee` → rouge, `suspendue` → ardoise, `planifiee` → bleu, `audit` → violet. C'est LE point d'entrée des statuts dans toute l'app.
- **Card / StatCard (KPI)** — libellé majuscule discret, valeur mono large, footer delta (▲/▼ coloré) + emplacement sparkline (Recharts).
- **DataTable** (générique, prête pour `@tanstack/react-table`) — header collant, tri colonne, sélection multi (checkbox) → **barre d'actions groupées**, visibilité des colonnes, pagination, **skeleton rows**, **état vide**, densité réglable, ligne cliquable. Chiffres en colonnes `tabular-nums` alignés à droite.
- **Champs de formulaire** — `Input`, `Select`, `Combobox` (recherche), `Textarea`, wrappers `Form`/`Field` prêts pour `react-hook-form` + `zod` : label, hint, astérisque requis, message d'erreur inline sous le champ, états valide/erreur.
- **Filtres** — `SearchInput` (debounce), `DateRangePicker`, chips de filtres actifs supprimables, bouton « Réinitialiser ».
- **Stepper** (wizard) — étapes cliquables, états done/active/à venir.
- **Sidebar** — repliable (icônes + tooltips réduits), groupes, item actif avec **barre d'accent à gauche**, badges de compteur, items **role-gated** (désactivés + verrouillés visuellement avec tooltip « Réservé au Super Admin », pas masqués).
- Plus : **Tabs · Sheet · Dialog · DropdownMenu · Tooltip · Toast (sonner) · Skeleton · EmptyState · Pagination · Avatar · Progress · CommandPalette (⌘K)**.

## 3. Interdits (= slop, à proscrire)

❌ Dégradés violets/bleus génériques, glassmorphism, néon, faux 3D · ❌ emoji en guise d'icônes · ❌ illustrations « IA », blobs · ❌ le cliché « carte très arrondie + bordure-accent à gauche » répété · ❌ ombres lourdes (préfère **bordure 1px + ombre subtile**) · ❌ `rounded-2xl` partout sans intention · ❌ tout centrer comme une landing.

## 4. Exigés (= craft)

✅ Vraie grille 4px · ✅ chiffres tabulaires mono alignés à droite · ✅ formatage `4 820 000 000 GNF`, `68 %`, `12 oct. 2025` · ✅ états vides soignés (titre + explication + action) · ✅ skeletons par composant · ✅ micro-interactions 120–200 ms, ease-out, **aucun bounce** · ✅ **focus-visible** partout, A11y **AA**, cibles tactiles ≥ 44px · ✅ navigation clavier complète.

## 5. Livrables

1. `app/globals.css` + `tailwind.config.ts` avec tous les tokens (light + dark).
2. `lib/format.ts` (helpers fr-FR / GNF) et `lib/status.ts` (enum + mapping StatusBadge).
3. Toutes les primitives ci-dessus dans `components/ui/`, typées strict, lint propre.
4. Une page `/design-system` qui **affiche chaque composant dans tous ses états** (galerie de référence : palette, échelle typo, boutons, badges, table, champs, KPI, sidebar, etc.).
5. `README.md` du design system : liste des tokens, règles de statut, usage de chaque composant, do/don't.

## Méthode

Commence par **tokens → format/status helpers → Button + StatusBadge + Card/StatCard → DataTable → champs**, puis la page `/design-system` et le README. Montre-moi la page `/design-system` avant d'ajouter le reste. `pnpm dev` doit démarrer sans erreur de type ni de lint.
