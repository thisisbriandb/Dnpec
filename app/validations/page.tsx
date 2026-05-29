import { ModulePage } from "@/app/components/module-page";

export default function ValidationsPage() {
  return (
    <ModulePage
      title="Validation et qualite des donnees"
      description="File de validation des soumissions, commentaires par champ, pieces justificatives et decisions."
      items={[
        "Tables: submissions, submission_versions, submission_field_comments, attachments.",
        "Une modification entreprise cree une nouvelle version de soumission.",
        "Rejet et demande de correction gardent le commentaire motive.",
        "Les pieces jointes sont stockees dans le bucket Supabase Storage justificatifs.",
      ]}
    />
  );
}
