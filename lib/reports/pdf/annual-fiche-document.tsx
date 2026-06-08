import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { AnnualFiche, CellValue } from "@/lib/reports/annual-fiche"

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    textAlign: "center",
    marginBottom: 14,
  },
  headerStrong: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  headerLine: {
    fontSize: 10,
    marginTop: 2,
  },
  title: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
  },
  infoBlock: {
    marginTop: 14,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    fontFamily: "Helvetica-Bold",
    width: 200,
  },
  infoValue: {
    flexGrow: 1,
  },
  yearRow: {
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 8,
  },
  table: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000000",
  },
  row: {
    flexDirection: "row",
  },
  headerCell: {
    flexGrow: 1,
    flexBasis: 0,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#f1f1f1",
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
  },
  rubriqueCell: {
    width: 150,
    flexShrink: 0,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    padding: 4,
    fontSize: 8,
  },
  valueCell: {
    flexGrow: 1,
    flexBasis: 0,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    padding: 4,
    fontSize: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    color: "#555555",
  },
})

function formatCellValue(value: CellValue | undefined): string {
  if (value == null) return ""
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "boolean") return value ? "Oui" : "Non"
  if (typeof value === "number") return value.toLocaleString("fr-FR")
  return value
}

export function AnnualFicheDocument({ fiche }: { fiche: AnnualFiche }) {
  const infoRows: Array<[string, string]> = [
    ["Nom de l'entreprise", fiche.company.name],
    ["Responsable des données statistiques", fiche.company.responsable ?? "—"],
    ["Email", fiche.company.email],
    ["Contact téléphonique", fiche.company.phone],
    ["Nature des données / Produits", fiche.natureDonnees ?? "—"],
  ]

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerStrong}>REPUBLIQUE DE GUINEE</Text>
          <Text style={styles.headerLine}>Travail – Justice – Solidarité</Text>
          <Text style={styles.headerLine}>Ministère de l&apos;Economie et des Finances</Text>
          <Text style={[styles.headerLine, styles.headerStrong]}>
            Direction Nationale des Etudes Economiques et de la Prévision
          </Text>
          <Text style={[styles.headerLine, styles.headerStrong]}>Division Conjoncture</Text>
          <Text style={styles.title}>Fiche de collecte mensuelle individuelle</Text>
        </View>

        <View style={styles.infoBlock}>
          {infoRows.map(([label, value]) => (
            <View style={styles.infoRow} key={label}>
              <Text style={styles.infoLabel}>{label} :</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.yearRow}>Année {fiche.year}</Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.rubriqueCell}>Rubriques</Text>
            {MONTH_LABELS.map((label) => (
              <Text style={styles.headerCell} key={label}>{label}</Text>
            ))}
          </View>
          {fiche.rubriques.map((rubrique) => (
            <View style={styles.row} key={rubrique.key} wrap={false}>
              <Text style={styles.rubriqueCell}>
                {rubrique.label}
                {rubrique.unit ? ` (${rubrique.unit})` : ""}
              </Text>
              {fiche.months.map((month) => (
                <Text style={styles.valueCell} key={month.month}>
                  {formatCellValue(month.values[rubrique.key])}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  )
}
