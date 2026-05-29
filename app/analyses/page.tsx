import { ModulePage } from "@/app/components/module-page";

export default function AnalyticsPage() {
  return (
    <ModulePage
      title="Analyses et tableaux de bord"
      description="Agregats sectoriels, participation, evolution temporelle et indicateurs economiques."
      items={[
        "Les analyses doivent etre basees sur des vues SQL agregees et securisees.",
        "Filtres cibles: campagne, periode, secteur, taille, statut, comparaison multi-periodes.",
        "ICA et ICE seront branches quand la Division Conjoncture fournira la methode.",
        "Les donnees individuelles restent reservees aux roles DNPEC autorises.",
      ]}
    />
  );
}
