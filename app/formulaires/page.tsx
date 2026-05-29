import { ModulePage } from "@/app/components/module-page";

export default function FormsPage() {
  return (
    <ModulePage
      title="Formulaires types par secteur"
      description="Configuration structuree des formulaires standards: un secteur correspond a un formulaire type unique."
      items={[
        "Tables: sectors, form_templates, form_versions.",
        "Le schema JSONB porte sections, champs, types, obligations, unites, min/max et options.",
        "Chaque publication cree une version; les campagnes anciennes gardent leur version.",
        "Types supportes dans le modele: texte, nombre, date, listes, case, tableau, fichier.",
      ]}
    />
  );
}
