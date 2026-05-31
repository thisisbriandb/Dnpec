import Link from "next/link";
import { Building2, BarChart2, ShieldCheck, ArrowRight } from "lucide-react";
import LoginFormClient from "./_components/login-form-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  const features = [
    { Icon: Building2, label: "Gestion des entreprises et campagnes de collecte" },
    { Icon: BarChart2, label: "Analyse des indicateurs économiques conjoncturels" },
    { Icon: ShieldCheck, label: "Données protégées par Row Level Security" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] bg-[#0D1B2E] flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-blue-500/8 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-[#0f2340]/40 to-transparent" />

        <div className="relative z-10 space-y-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg ring-1 ring-white/10">
              <span className="text-white font-extrabold text-sm tracking-tight">DN</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">DNPEC</p>
              <p className="text-[#6272A4] text-[11px] mt-0.5">Ministère du Plan · Guinée</p>
            </div>
          </div>

          {/* Hero */}
          <div>
            <h1 className="text-[34px] font-bold text-white leading-[1.2] tracking-tight">
              Collecte des données<br />
              <span className="text-blue-400">conjoncturelles</span>
            </h1>
            <p className="mt-4 text-[#aebbd4] text-[13px] leading-relaxed max-w-[280px]">
              Plateforme officielle de collecte et d&apos;analyse des données économiques des entreprises guinéennes.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map(({ Icon, label }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 ring-1 ring-blue-500/20">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-[#aebbd4] text-[13px] leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/8" />
          <p className="text-[#6272A4] text-[11px] shrink-0">
            © {new Date().getFullYear()} DNPEC · République de Guinée
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 bg-[#F4F7FB]">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <span className="text-white font-bold text-xs">DN</span>
            </div>
            <span className="font-semibold text-foreground text-sm">DNPEC</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white border border-border shadow-medium px-8 py-8">
            <div className="mb-7">
              <h2 className="text-[22px] font-bold text-foreground tracking-tight">Connexion</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Accédez à la plateforme de collecte DNPEC
              </p>
            </div>

            {params.message && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-3.5 py-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <p className="text-[12.5px] text-blue-800 leading-relaxed">{params.message}</p>
              </div>
            )}
            {params.error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-3.5 py-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-[12.5px] text-red-800 leading-relaxed">{params.error}</p>
              </div>
            )}

            <LoginFormClient />

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground font-medium">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Signup CTA */}
            <Link
              href="/inscription"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted/60 transition-colors"
            >
              Créer un compte entreprise
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            Ministère du Plan et de la Coopération Internationale
          </p>
        </div>
      </div>
    </div>
  );
}
