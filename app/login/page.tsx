import Link from "next/link";
import { signIn } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form action={signIn} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Connexion</p>
        <h1 className="mt-2 text-2xl font-bold">Acces DNPEC Collecte</h1>
        <p className="mt-2 text-sm text-slate-600">Connexion par Supabase Auth. Les droits sont ensuite appliques par RLS.</p>
        {params.message ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{params.message}</p> : null}
        {params.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{params.error}</p> : null}
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Mot de passe
            <input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
        </div>
        <button className="mt-6 w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
          Se connecter
        </button>
        <Link href="/inscription" className="mt-4 block text-center text-sm font-medium text-emerald-700">
          Auto-inscription entreprise
        </Link>
      </form>
    </main>
  );
}
