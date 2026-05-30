// Placeholder layout — will be replaced by real portal layouts in next iteration
import Link from "next/link"

type ModulePageProps = {
  title: string
  description: string
  items: string[]
}

const nav = [
  ["/dashboard", "Tableau de bord"],
  ["/entreprises", "Entreprises"],
  ["/formulaires", "Formulaires"],
  ["/campagnes", "Campagnes"],
  ["/validations", "Validations"],
  ["/analyses", "Analyses"],
  ["/exports", "Exports"],
  ["/audit", "Audit"],
]

export function ModulePage({ title, description, items }: ModulePageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl gap-6 px-6 py-8 lg:px-8">
      <aside className="hidden w-56 shrink-0 rounded-card border border-border bg-card p-4 lg:block h-fit">
        <Link href="/" className="text-sm font-semibold text-primary">DNPEC</Link>
        <nav className="mt-4 space-y-0.5">
          {nav.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="flex-1">
        <div className="rounded-card border border-border bg-card p-5">
          <p className="text-legend font-semibold uppercase tracking-wider text-muted-foreground">
            Module · En construction
          </p>
          <h1 className="mt-2 text-display font-semibold text-foreground">{title}</h1>
          <p className="mt-2 max-w-3xl text-body text-muted-foreground">{description}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-card border border-border bg-card p-3 text-body text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
