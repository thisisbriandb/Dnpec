import { ModulePage } from "@/app/components/module-page";

export default function CompanyDashboardPage() {
  return (
    <ModulePage
      title="Tableau de bord entreprise"
      description="Accueil entreprise: campagnes ouvertes, brouillons, historique et notifications."
      items={[
        "Les entreprises ne voient que leurs propres targets et submissions.",
        "Les campagnes actives affichent la date limite et le formulaire associe.",
        "Les brouillons sont conserves dans submissions avec statut draft.",
        "Les notifications non lues sont lues depuis notifications.",
      ]}
    />
  );
}
