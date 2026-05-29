import Link from "next/link";
import { Building2, ClipboardList, FileText, LockKeyhole, Megaphone, ShieldCheck } from "lucide-react";

const modules = [
  {
    title: "Authentification Supabase",
    body: "Email, mot de passe, verification email, recuperation de compte et session SSR via cookies.",
    icon: LockKeyhole,
  },
  {
    title: "Repertoire entreprises",
    body: "NIF unique, statut d'inscription, validation DNPEC et rattachement au compte entreprise.",
    icon: Building2,
  },
  {
    title: "Formulaires par secteur",
    body: "Relation stricte un secteur, un formulaire type, avec versions publiees pour les campagnes.",
    icon: FileText,
  },
  {
    title: "Campagnes de collecte",
    body: "Cycle brouillon, planifiee, active, cloturee, archivee avec cibles et relances.",
    icon: Megaphone,
  },
  {
    title: "Soumissions et validation",
    body: "Versions de reponse, pieces justificatives, validation, rejet et demandes de correction.",
    icon: ClipboardList,
  },
  {
    title: "RLS et audit",
    body: "Isolation des donnees par entreprise, roles DNPEC et journal d'audit reserve au Super Admin.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              DNPEC / MEFB - Architecture Supabase
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Socle technique pour digitaliser la collecte economique nationale.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Cette base pose les modules du cahier de charge: comptes, entreprises, formulaires
              sectoriels, campagnes, soumissions, notifications, exports et audit. La securite
              primaire est portee par Supabase Auth, PostgreSQL et Row Level Security.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" href="/login">
              Connexion
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100" href="/inscription">
              Inscription entreprise
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100" href="/dashboard">
              Portail Direction
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <article key={module.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-emerald-700" />
              <h2 className="mt-4 text-base font-semibold text-slate-950">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{module.body}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
