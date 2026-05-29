import { ModulePage } from "@/app/components/module-page";

export default function SettingsPage() {
  return (
    <ModulePage
      title="Parametres systeme"
      description="Configuration Super Admin: secteurs, seuils, templates de notification et parametres de securite."
      items={[
        "system_settings stocke les parametres configurables.",
        "Seul le role super_admin peut modifier les reglages globaux.",
        "Les secteurs sont CRUD via la table sectors.",
        "La taille max des fichiers est initialisee a 10 Mo.",
      ]}
    />
  );
}
