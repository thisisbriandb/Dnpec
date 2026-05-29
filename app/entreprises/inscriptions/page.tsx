import { ModulePage } from "@/app/components/module-page";

export default function CompanyRegistrationsPage() {
  return (
    <ModulePage
      title="Inscriptions en attente"
      description="File de validation des entreprises auto-inscrites avec motif de rejet et notification."
      items={[
        "Statuts: pending, validated, rejected, suspended.",
        "Validation autorisee aux super_admin et analyste.",
        "Chaque decision doit ecrire dans audit_logs.",
        "En cas de rejet, rejection_reason est stocke et une notification est creee.",
      ]}
    />
  );
}
