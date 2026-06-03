export const NOTIF = {
  INSCRIPTION_SOUMISE: "inscription_soumise",
  INSCRIPTION_VALIDEE: "inscription_validee",
  INSCRIPTION_REJETEE: "inscription_rejetee",
  COMPTE_SUSPENDU:     "compte_suspendu",
  COMPTE_REACTIF:      "compte_reactif",
} as const;

export type NotifType = (typeof NOTIF)[keyof typeof NOTIF];
