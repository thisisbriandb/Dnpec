import { ModulePage } from "@/app/components/module-page";

export default function UsersPage() {
  return (
    <ModulePage
      title="Utilisateurs DNPEC"
      description="Creation et gestion des comptes Direction avec roles Super Admin, Analyste et Agent de saisie."
      items={[
        "Supabase Auth gere les identifiants, mots de passe, verification email et reset.",
        "profiles porte les roles applicatifs et le statut du compte.",
        "La creation de comptes DNPEC doit utiliser la service role key cote serveur.",
        "Les modifications sensibles sont reservees au super_admin.",
      ]}
    />
  );
}
