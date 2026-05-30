import { ModulePage } from "@/app/components/module-page"

export default function AuditPage() {
  return (
    <ModulePage
      title="Journal d'audit"
      description="Historique complet des actions effectuées sur la plateforme."
      items={["Réservé au super administrateur.", "À implémenter dans la prochaine itération."]}
    />
  )
}
