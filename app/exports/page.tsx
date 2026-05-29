import { ModulePage } from "@/app/components/module-page";

export default function ExportsPage() {
  return (
    <ModulePage
      title="Exports et rapports"
      description="Demande d'exports bruts et rapports standardises avec traitement asynchrone."
      items={[
        "Table: export_jobs avec format xlsx, csv, stata, rds ou pdf.",
        "Les gros exports doivent passer par une queue et un stockage objet.",
        "Chaque export est trace dans audit_logs.",
        "Les notifications signalent la disponibilite du fichier.",
      ]}
    />
  );
}
