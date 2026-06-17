export type StatusVariant = "ok" | "warn" | "bad" | "info" | "gray" | "purple"

export interface StatusConfig {
  variant: StatusVariant
  label: string
}

/* ── account_status ───────────────────────────────────────────── */
export type AccountStatus = "pending" | "validated" | "rejected" | "suspended"

export const ACCOUNT_STATUS: Record<AccountStatus, StatusConfig> = {
  pending:   { variant: "warn",  label: "En attente" },
  validated: { variant: "ok",   label: "Validée" },
  rejected:  { variant: "bad",  label: "Rejetée" },
  suspended: { variant: "gray", label: "Suspendue" },
}

/* ── campaign_status ──────────────────────────────────────────── */
export type CampaignStatus = "draft" | "scheduled" | "active" | "closed" | "archived"

export const CAMPAIGN_STATUS: Record<CampaignStatus, StatusConfig> = {
  draft:     { variant: "gray", label: "Brouillon" },
  scheduled: { variant: "info", label: "Planifiée" },
  active:    { variant: "ok",   label: "Active" },
  closed:    { variant: "gray", label: "Clôturée" },
  archived:  { variant: "gray", label: "Archivée" },
}

/* ── submission_status ────────────────────────────────────────── */
export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "validated"
  | "rejected"
  | "correction_requested"

export const SUBMISSION_STATUS: Record<SubmissionStatus, StatusConfig> = {
  draft:                { variant: "gray", label: "Brouillon" },
  submitted:            { variant: "info", label: "Soumise" },
  validated:            { variant: "ok",   label: "Validée" },
  rejected:             { variant: "bad",  label: "Rejetée" },
  correction_requested: { variant: "warn", label: "Correction demandée" },
}

/* ── target_status ────────────────────────────────────────────── */
export type TargetStatus = "waiting" | "in_progress" | "submitted" | "validated" | "rejected"

export const TARGET_STATUS: Record<TargetStatus, StatusConfig> = {
  waiting:    { variant: "gray", label: "En attente" },
  in_progress:{ variant: "info", label: "En cours" },
  submitted:  { variant: "warn", label: "Soumise" },
  validated:  { variant: "ok",   label: "Validée" },
  rejected:   { variant: "bad",  label: "Rejetée" },
}

/* ── form_version_status ──────────────────────────────────────── */
export type FormVersionStatus = "draft" | "published" | "archived"

export const FORM_VERSION_STATUS: Record<FormVersionStatus, StatusConfig> = {
  draft:     { variant: "gray", label: "Brouillon" },
  published: { variant: "ok",   label: "Publiée" },
  archived:  { variant: "gray", label: "Archivée" },
}

/* ── job_status ───────────────────────────────────────────────── */
export type JobStatus = "queued" | "running" | "completed" | "failed"

export const JOB_STATUS: Record<JobStatus, StatusConfig> = {
  queued:    { variant: "gray", label: "En file" },
  running:   { variant: "info", label: "En cours" },
  completed: { variant: "ok",   label: "Terminé" },
  failed:    { variant: "bad",  label: "Échoué" },
}

/* ── Company labels ───────────────────────────────────────────── */
export const SIZE_LABELS: Record<string, string> = {
  tpe: "TPE",
  pme: "PME",
  grande_entreprise: "Grande entreprise",
}

export const LEGAL_LABELS: Record<string, string> = {
  sa: "SA",
  sarl: "SARL",
  suarl: "SUARL",
  gie: "GIE",
  public: "Entreprise publique",
  autre: "Autre",
}

/* ── Role labels ──────────────────────────────────────────────── */
export type AppRole = "super_admin" | "analyste" | "agent_saisie" | "entreprise"

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin:  "Super administrateur",
  analyste:     "Analyste",
  agent_saisie: "Agent de saisie",
  entreprise:   "Entreprise",
}

/* ── Variant style tokens ─────────────────────────────────────── */
export const VARIANT_STYLES: Record<StatusVariant, { bg: string; text: string; dot: string; border: string }> = {
  ok:     { bg: "bg-status-ok-bg",     text: "text-status-ok-text",     dot: "bg-status-ok",     border: "border-status-ok/30" },
  warn:   { bg: "bg-status-warn-bg",   text: "text-status-warn-text",   dot: "bg-status-warn",   border: "border-status-warn/30" },
  bad:    { bg: "bg-status-bad-bg",    text: "text-status-bad-text",    dot: "bg-status-bad",    border: "border-status-bad/30" },
  info:   { bg: "bg-status-info-bg",   text: "text-status-info-text",   dot: "bg-status-info",   border: "border-status-info/30" },
  gray:   { bg: "bg-status-gray-bg",   text: "text-status-gray-text",   dot: "bg-status-gray",   border: "border-status-gray/30" },
  purple: { bg: "bg-status-purple-bg", text: "text-status-purple-text", dot: "bg-status-purple", border: "border-status-purple/30" },
}

/* ── Generic resolver ─────────────────────────────────────────── */
export function resolveStatus(
  status: string,
  map: Record<string, StatusConfig>
): StatusConfig {
  return map[status] ?? { variant: "gray", label: status }
}
