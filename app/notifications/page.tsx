import { ModulePage } from "@/app/components/module-page";

export default function NotificationsPage() {
  return (
    <ModulePage
      title="Centre de notifications"
      description="Notifications in-app, email et SMS selon les evenements du cycle de collecte."
      items={[
        "Table: notifications avec canaux email, sms, in_app.",
        "Les fournisseurs SMTP/SMS seront branches dans les workers.",
        "Les relances J-7 et J-3 seront planifiees depuis les campagnes.",
        "Chaque utilisateur ne lit que ses notifications.",
      ]}
    />
  );
}
