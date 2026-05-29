import { ModulePage } from "@/app/components/module-page";

export default function ProfilePage() {
  return (
    <ModulePage
      title="Profil compte"
      description="Gestion des informations du compte connecte et des informations d'entreprise."
      items={[
        "Supabase Auth porte email et mot de passe.",
        "profiles porte nom, telephone, role et statut.",
        "companies porte les informations administratives.",
        "Les changements sensibles restent soumis a validation DNPEC.",
      ]}
    />
  );
}
