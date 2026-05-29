import Link from "next/link";
import { signUpCompany } from "@/app/actions/auth";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getSectors() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return data ?? [];
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const emptyParams: { error?: string } = {};
  const [sectors, params] = await Promise.all([
    getSectors(),
    searchParams ? searchParams : Promise.resolve(emptyParams),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <form action={signUpCompany} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Auto-inscription</p>
        <h1 className="mt-2 text-2xl font-bold">Demande de compte entreprise</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Le compte est cree dans Supabase Auth, puis la fiche entreprise passe en validation DNPEC.
        </p>
        {params.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{params.error}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">
            Nom du point focal
            <input name="full_name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Email de contact
            <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Mot de passe
            <input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Telephone
            <input name="phone" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            NIF
            <input name="nif" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            RCCM
            <input name="rccm" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium md:col-span-2">
            Nom de l&apos;entreprise
            <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Secteur
            <select name="sector_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Selectionner</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>{sector.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Taille
            <select name="size" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="tpe">TPE</option>
              <option value="pme">PME</option>
              <option value="grande_entreprise">Grande entreprise</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Statut juridique
            <select name="legal_status" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="sa">SA</option>
              <option value="sarl">SARL</option>
              <option value="suarl">SUARL</option>
              <option value="gie">GIE</option>
              <option value="public">Public</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Annee de creation
            <input name="creation_year" type="number" min={1800} max={2100} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium md:col-span-2">
            Adresse
            <input name="address" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
        </div>

        {sectors.length === 0 ? (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Aucun secteur charge. Configurez Supabase puis appliquez la migration et le seed.
          </p>
        ) : null}
        <button disabled={sectors.length === 0} className="mt-6 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
          Envoyer la demande
        </button>
        <Link href="/login" className="ml-4 text-sm font-medium text-emerald-700">J&apos;ai deja un compte</Link>
      </form>
    </main>
  );
}
