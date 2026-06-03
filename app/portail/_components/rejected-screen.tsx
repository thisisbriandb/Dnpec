import Link from "next/link"
import { XCircle, LogOut, ArrowRight } from "lucide-react"
import { signOut } from "@/app/actions/auth"

interface RejectedScreenProps {
  companyName:     string
  rejectionReason: string | null
}

export function RejectedScreen({ companyName, rejectionReason }: RejectedScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#F4F7FB] min-h-full">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border shadow-medium overflow-hidden">
          <div className="h-1 bg-status-bad" />

          <div className="px-8 py-8 space-y-5">
            {/* Icon + badge */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-status-bad-bg">
                <XCircle className="size-6 text-status-bad-text" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-status-bad-bg border border-status-bad/30 px-3 py-1 text-xs font-semibold text-status-bad-text">
                Demande rejetée
              </span>
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-[17px] font-semibold text-foreground">{companyName}</h1>
            </div>

            {/* Rejection reason */}
            {rejectionReason && (
              <div className="rounded-xl border border-status-bad/20 bg-status-bad-bg/40 px-4 py-3">
                <p className="text-[11px] font-semibold text-status-bad-text uppercase tracking-wider mb-1.5">
                  Motif du rejet
                </p>
                <p className="text-[13px] text-foreground leading-relaxed">
                  {rejectionReason}
                </p>
              </div>
            )}

            {/* What to do */}
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1.5">
              <p className="text-[12px] font-medium text-foreground">Que faire ?</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Pour soumettre une nouvelle demande, créez un compte avec une nouvelle adresse email et un nouveau NIF si nécessaire.
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/inscription"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Nouvelle demande d&apos;inscription
              <ArrowRight className="size-4" />
            </Link>

            {/* Sign out */}
            <form action={signOut} className="flex justify-center">
              <button
                type="submit"
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="size-3.5" />
                Se déconnecter
              </button>
            </form>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Ministère de l&apos;économie, des finances et du budget · République de Guinée
        </p>
      </div>
    </div>
  )
}
