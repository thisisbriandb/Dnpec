import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

const features = [
  { n: "01", label: "Sécurisé",  desc: "Données chiffrées"   },
  { n: "02", label: "Officiel",  desc: "Cadre légal"          },
  { n: "03", label: "Structuré", desc: "Saisie normalisée"    },
  { n: "04", label: "Analysé",   desc: "Conjoncture suivie"   },
];

const DIRECTION_ROLES = ["super_admin", "analyste", "agent_saisie"];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let espaceHref: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "entreprise";
    espaceHref = DIRECTION_ROLES.includes(role) ? "/direction/dashboard" : "/portail";
  }
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex shrink-0 items-center justify-between border-b border-[#E2E9F3] bg-white px-10 py-[14px]">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB]">
            <BarChart2 className="size-5 text-white" />
          </div>
          <div className="leading-none">
            <p className="text-base font-bold text-[#0D1B2E]">DNPEC Collecte</p>
            <p className="mt-0.5 text-[11px] text-[#6272A4]">Ministère de l&apos;économie, des finances et du budget · République de Guinée</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-[#E2E9F3] px-4 py-2 text-sm font-medium text-[#6272A4] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Se déconnecter
              </button>
            </form>
          )}
          <div className="flex items-center gap-1.5 rounded-full border border-[#E2E9F3] px-4 py-2">
            <span className="size-2 rounded-full bg-[#CE1126]" />
            <span className="size-2 rounded-full bg-[#FCD116]" />
            <span className="size-2 rounded-full bg-[#009460]" />
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#0D1B2E]">
              Plateforme officielle
            </span>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Panneau sombre — animation, découpe diagonale, grille */}
        <div
          className="dark-panel absolute inset-0 bg-[#0D1B2E]"
          style={{
            clipPath: "polygon(54% 0, 100% 0, 100% 100%, 0 100%, 0 46%)",
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        >

          {/* Bas gauche — sous-titre + features (séparés du titre) */}
          <div className="absolute bottom-[8%] left-[6%]">
           
            <div className="flex gap-8">
              {features.map(({ n, label, desc }) => (
                <div key={n}>
                  <p className="mb-1 text-[10px] font-bold text-[#2563EB]">{n}</p>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/35">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne droite — carte (haut) + CTAs (bas) */}
          <div className="absolute bottom-[8%] right-[7%] top-[8%] flex flex-col items-end justify-between">

            {/* Carte Indice conjoncturel */}
            <div
              className="w-[260px] rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <p className="mb-7 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">
                DNPEC · Indice conjoncturel
              </p>
              <div className="flex items-end justify-center gap-5" style={{ height: "140px" }}>
                <div
                  className="w-[56px] rounded-xl"
                  style={{
                    height: "54%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.12) 100%)",
                  }}
                />
                <div
                  className="w-[56px] rounded-xl"
                  style={{
                    height: "90%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.18) 100%)",
                  }}
                />
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col items-end gap-3">
              {espaceHref ? (
                <Link
                  href={espaceHref}
                  className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] active:scale-95"
                >
                  Mon espace →
                </Link>
              ) : (
                <>
                  <Link
                    href="/inscription"
                    className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] active:scale-95"
                  >
                    Enregistrer mon entreprise →
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
                  >
                    Me connecter
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Titre — version fond blanc (zone supérieure gauche) */}
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ clipPath: "polygon(0 0, 54% 0, 0 46%)" }}
        >
          <div className="absolute left-[6%] top-[13%]">
            <h1
              style={{
                fontSize: "clamp(2.6rem, 4.5vw, 4.2rem)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
              }}
            >
              <span className="block text-[#0D1B2E]">La donnée</span>
              <span className="block text-[#0D1B2E]">économique</span>
              <span className="block text-[#0D1B2E]">de la Guinée,</span>
              <span className="block text-[#2563EB]">collectée à la</span>
              <span className="block text-[#2563EB]">source.</span>
            </h1>
          </div>
        </div>

        {/* Titre — version fond sombre (zone inférieure droite) */}
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ clipPath: "polygon(54% 0, 100% 0, 100% 100%, 0 100%, 0 46%)" }}
        >
          <div className="absolute left-[6%] top-[13%]">
            <h1
              style={{
                fontSize: "clamp(2.6rem, 4.5vw, 4.2rem)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
              }}
            >
              <span className="block text-white">La donnée</span>
              <span className="block text-white">économique</span>
              <span className="block text-white">de la Guinée,</span>
              <span className="block text-[#60a5fa]">collectée à la</span>
              <span className="block text-[#60a5fa]">source.</span>
            </h1>
          </div>
        </div>

      </div>
    </div>
  );
}
