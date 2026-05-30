# Prompt Claude Code — Design complet des deux portails DNPEC

> À coller dans Claude Code, à la racine du projet existant (qui contient déjà une page de démo).
> **Fichiers de référence joints** : `Plateforme DNPEC.html` (maquette hi-fi du deck — structure, écrans, tokens, composants visuels) + `Prompt - Design System DNPEC.md` (tokens + spec du design system) + le CDC si disponible.

---

## Contexte

Le projet est initialisé (Next.js + des pages de démo que tu vas enlever totalement) . Je te confie maintenant **le design complet, haute-fidélité et production-ready des deux interfaces** de la **Plateforme DNPEC** (Direction Nationale de la Prévision Économique et de la Conjoncture — Ministère du Plan, République de Guinée) :

- **Portail Direction** (interne, sidebar navy) — Super Admin / Analyste / Agent de saisie.
- **Portail Entreprise** (externe, sidebar) — entreprises guinéennes, ton institutionnel, accessible et **mobile-first**.

## Les fichiers que je te donne sont une MAQUETTE, pas une limite

`Plateforme DNPEC.html` est une **maquette de référence** : elle fixe l'intention (arborescence, écrans, tokens, ton, densité, règles de statut). Elle a été dessinée à la main en HTML/CSS statique — **ce n'est pas le niveau de finition cible**.

**Tu dois aller beaucoup plus loin.** Reprends les tokens et l'esprit, mais :
- pousse la finition, la densité, les micro-interactions, les états, la qualité typographique **bien au-delà** de la maquette ;
- ne te contente pas de « recopier » les écrans en React — repense chaque écran comme un vrai produit ;
- ajoute ce qui manque pour que ce soit crédible (états vides, erreurs, skeletons, transitions, raccourcis, command palette, realtime).

L'objectif : que ça ressemble au travail d'une **équipe produit senior**, pas à une maquette ni à un rendu « généré par IA ».

## Utilise les meilleures briques, pas du fait-main

Sers-toi de **vraies bibliothèques** de qualité (pas de SVG dessiné à la main, pas de composants bricolés) :

- **shadcn/ui** + **Radix UI** comme socle de composants, **customisés à nos tokens** (jamais le thème brut).
- **Tailwind CSS** pour le styling, grille 4px stricte.
- **lucide-react** — un seul jeu d'icônes, stroke cohérent.
- **Recharts** (ou **Nivo**) pour TOUS les graphiques — jamais de chart dessiné à la main.
- **@tanstack/react-table** pour les tables (tri, sélection, pagination serveur, visibilité colonnes).
- **@tanstack/react-query** pour le cache/async + **react-hook-form** + **zod** pour les formulaires.
- **sonner** pour les toasts, **cmdk** pour la command palette ⌘K, **date-fns** (locale `fr`) pour les dates.
- **framer-motion** pour des transitions sobres (120–200 ms, ease-out, **aucun bounce**).

Inspire-toi explicitement des **meilleures pratiques** de Linear (densité, ⌘K, navigation clavier, transitions sobres), Stripe Dashboard (tables financières, formatage des montants, retenue chromatique), Vercel/Geist (minimalisme, bordures fines > ombres lourdes), Retool/Metabase (outillage data), Notion (config structurée des formulaires) — et **DSFR / FranceConnect / Mon Espace Santé uniquement pour le Portail Entreprise** (confiance, accessibilité, ton institutionnel). **Étudie leurs patterns, ne copie pas leur marque.**

## Zéro slop IA (non négociable)

**Interdits** : dégradés violets/bleus génériques, glassmorphism, néon, faux 3D · emoji en guise d'icônes · illustrations « IA », blobs, mascottes · le cliché « carte très arrondie + bordure-accent à gauche » répété · ombres lourdes (préfère bordure 1px + ombre subtile) · layout marketing centré pour une app de gestion · lorem ipsum, stats inventées « pour remplir », icônes décoratives inutiles · tout arrondir sans intention.

**Exigés** : vraie grille 4px et rythme vertical cohérent · **chiffres tabulaires mono** alignés à droite · formatage `4 820 000 000 GNF`, `68 %`, `12 oct. 2025` · états vides soignés (titre + explication + action) · skeletons par composant (pas de spinner plein écran) · micro-interactions discrètes · A11y **AA** (focus-visible, clavier, ARIA, cibles ≥ 44px) · tout en **français**, formats `fr-FR`.

## POSE-MOI DES QUESTIONS D'ABORD (important)

Je veux un résultat **original**, pas un rendu IA générique. **Avant d'écrire le moindre écran**, pose-moi une série de questions de cadrage, par exemple :

- Préférences visuelles fines (ton plus institutionnel-officiel vs plus moderne « SaaS gouv » ? densité par défaut ? dark mode prioritaire ou non ?).
- Personnalité de la marque DNPEC : y a-t-il un logo / des armoiries / une charte de l'État à respecter ? couleurs officielles imposées ?
- Détails métier qui changent l'UI : structure exacte d'un formulaire type, méthodo ICA/ICE, seuils d'anomalies, matrice de permissions par rôle.
- Priorités : quels écrans d'abord ? quels parcours sont critiques pour la démo à la Direction ?
- Données : as-tu un schéma Supabase / des données réelles, ou je pars sur des mocks plausibles (entreprises guinéennes, secteurs, campagnes) ?
- Périmètre de cette itération : tous les écrans, ou un sous-ensemble abouti à 100 % ?

Attends mes réponses, propose 2–3 partis pris visuels si pertinent, **puis** lance la production. Ne devine pas en silence sur les points qui engagent l'identité visuelle.

## Méthode de travail

1. Lis `Plateforme DNPEC.html` + `Prompt - Design System DNPEC.md` (+ CDC) en entier.
2. **Pose-moi tes questions de cadrage.**
3. Mets d'abord en place les **tokens + le design system** (primitives shadcn customisées, helpers de formatage, StatusBadge, DataTable, Sidebar) — montre-moi une page `/design-system`.
4. Puis déroule les écrans en commençant par : **Layout + Sidebar + Tableau de bord Direction**, montre-moi, on itère.
5. Sur **chaque** écran, soigne d'abord les **états réels** (loading / vide / erreur / succès) et les **interactions**, pas seulement le pixel statique.
6. Garde TypeScript strict, lint propre, `pnpm dev` qui démarre sans erreur.

> Rappelle-toi : la maquette HTML que je te donne est un **point de départ à dépasser**, pas un plafond. Le standard, c'est « équipe produit senior qui s'inspire de Linear / Stripe / DSFR », chaque écran net, dense, original et accessible.
