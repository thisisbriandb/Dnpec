import { ModulePage } from "@/app/components/module-page";

export default function CompaniesPage() {
  return (
    <ModulePage
      title="Repertoire national des entreprises"
      description="Gestion des entreprises publiques et privees, validation des inscriptions et recherche par NIF, secteur ou statut."
      items={[
        "Table principale: companies, reliee a profiles et sectors.",
        "Inscription double voie: creation Direction validee, auto-inscription en attente.",
        "Champs du cahier: NIF, RCCM, taille, statut juridique, email, telephone, adresse, annee.",
        "Index prevus pour la volumetrie: NIF, secteur, statut, recherche trigramme sur le nom.",
      ]}
    />
  );
}
