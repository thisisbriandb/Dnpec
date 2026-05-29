import { ModulePage } from "@/app/components/module-page";

export default function CampaignsPage() {
  return (
    <ModulePage
      title="Campagnes de collecte"
      description="Creation, ciblage, envoi, suivi et cloture des campagnes de collecte economique."
      items={[
        "Cycle: draft, scheduled, active, closed, archived.",
        "Le formulaire est determine automatiquement par le secteur et sa version publiee.",
        "campaign_targets conserve le statut individuel de chaque entreprise ciblee.",
        "Les relances Email/SMS/In-app s'appuieront sur notifications et jobs asynchrones.",
      ]}
    />
  );
}
