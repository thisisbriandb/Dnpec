import { ModulePage } from "@/app/components/module-page";

export default function AuditPage() {
  return (
    <ModulePage
      title="Journal d'audit"
      description="Tracabilite complete des actions sensibles: connexions, validations, exports, formulaires et campagnes."
      items={[
        "Table: audit_logs.",
        "Consultation reservee au super_admin.",
        "Chaque action stocke acteur, cible, timestamp, IP et payload JSON.",
        "Les exports du journal pourront etre ajoutes en phase consolidation.",
      ]}
    />
  );
}
