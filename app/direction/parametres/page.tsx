import { ModulePage } from "@/app/components/module-page"

export default function ParametresPage() {
  return (
    <ModulePage
      title="Paramètres"
      description="Configuration de la plateforme DNPEC."
      items={["Réservé au super administrateur.", "À implémenter dans la prochaine itération."]}
    />
  )
}
