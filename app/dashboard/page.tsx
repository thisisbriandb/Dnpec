import { ModulePage } from "@/app/components/module-page";

export default function DashboardPage() {
  return (
    <ModulePage
      title="Tableau de bord Direction"
      description="Vue globale des campagnes, inscriptions, soumissions en attente et indicateurs de participation."
      items={[
        "KPIs: campagnes actives, taux de participation, soumissions a valider, entreprises en attente.",
        "Acces reserve aux roles super_admin et analyste via RLS et controles applicatifs.",
        "Les graphiques doivent lire des vues agregees Supabase, jamais les donnees brutes entreprises cote public.",
        "Base prevue pour brancher Recharts/Nivo lors de la phase UI avancee.",
      ]}
    />
  );
}
