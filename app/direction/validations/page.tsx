import { ModulePage } from "@/app/components/module-page"

export default function ValidationsPage() {
  return (
    <ModulePage
      title="Validations soumissions"
      description="Revue et validation des soumissions d'entreprises pour les campagnes actives."
      items={[
        "Soumissions reçues triées par priorité (plus ancienne en premier).",
        "Raccourcis clavier V/R/C pour Valider, Rejeter, Correction demandée.",
        "Vue côte-à-côte : formulaire soumis à gauche, actions à droite.",
        "À implémenter dans la prochaine itération.",
      ]}
    />
  )
}
