import { ModulePage } from "@/app/components/module-page";

export default function HistoryPage() {
  return (
    <ModulePage
      title="Historique des soumissions"
      description="Historique entreprise des soumissions et versions envoyees."
      items={[
        "submission_versions conserve chaque modification.",
        "Une soumission validee modifiee repasse en validation.",
        "Les justificatifs restent rattaches a la version concernee.",
        "RLS empeche une entreprise de consulter l'historique d'une autre.",
      ]}
    />
  );
}
