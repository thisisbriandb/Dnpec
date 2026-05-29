import Link from "next/link";

type ModulePageProps = {
  title: string;
  description: string;
  items: string[];
};

const nav = [
  ["/dashboard", "Dashboard"],
  ["/entreprises", "Entreprises"],
  ["/formulaires", "Formulaires"],
  ["/campagnes", "Campagnes"],
  ["/validations", "Validations"],
  ["/analyses", "Analyses"],
  ["/exports", "Exports"],
  ["/audit", "Audit"],
];

export function ModulePage({ title, description, items }: ModulePageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl gap-6 px-6 py-8 lg:px-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <Link href="/" className="text-sm font-bold text-emerald-700">DNPEC Collecte</Link>
        <nav className="mt-6 space-y-1">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-white hover:text-slate-950">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="flex-1">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Module MVP</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
