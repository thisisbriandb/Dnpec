import { CheckCircle2, Clock, Shield, LogOut } from "lucide-react"
import { formatDate } from "@/lib/format"
import { signOut } from "@/app/actions/auth"

interface PendingScreenProps {
  companyName: string
  submittedAt: string
}

const STEPS = [
  { label: "Demande soumise",   icon: CheckCircle2, done: true  },
  { label: "Examen DNPEC",      icon: Clock,        done: false, active: true },
  { label: "Activation accès",  icon: Shield,       done: false },
]

export function PendingScreen({ companyName, submittedAt }: PendingScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#F4F7FB] min-h-full">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-medium overflow-hidden">
          {/* Top stripe */}
          <div className="h-1 bg-status-warn" />

          <div className="px-8 py-8 space-y-6">
            {/* Badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-status-warn-bg border border-status-warn/30 px-3 py-1 text-xs font-semibold text-status-warn-text">
                <span className="size-1.5 rounded-full bg-status-warn animate-pulse" />
                En cours d&apos;examen
              </span>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h1 className="text-[18px] font-semibold text-foreground tracking-tight">
                {companyName}
              </h1>
              <p className="text-[12.5px] text-muted-foreground">
                Demande soumise le {formatDate(submittedAt)}
              </p>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Ligne verticale */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

              <ol className="space-y-0">
                {STEPS.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <li key={i} className="relative flex items-start gap-4 pb-5 last:pb-0">
                      <div
                        className={[
                          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                          s.done
                            ? "border-status-ok bg-status-ok-bg"
                            : s.active
                              ? "border-status-warn bg-status-warn-bg"
                              : "border-border bg-background",
                        ].join(" ")}
                      >
                        {s.active && (
                          <span className="absolute inset-0 rounded-full bg-status-warn/20 animate-ping" />
                        )}
                        <Icon
                          className={[
                            "size-3.5",
                            s.done   ? "text-status-ok-text"   :
                            s.active ? "text-status-warn-text" :
                            "text-muted-foreground",
                          ].join(" ")}
                        />
                      </div>
                      <div className="pt-1">
                        <p
                          className={[
                            "text-[13px] font-medium",
                            s.done   ? "text-foreground"       :
                            s.active ? "text-status-warn-text" :
                            "text-muted-foreground",
                          ].join(" ")}
                        >
                          {s.label}
                        </p>
                        {s.active && (
                          <p className="text-[11.5px] text-muted-foreground mt-0.5">
                            Un agent DNPEC examine votre dossier.
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Info */}
            <p className="text-[12px] text-muted-foreground text-center leading-relaxed border-t border-border/50 pt-4">
              Vous recevrez une notification dès que la DNPEC aura traité votre demande.
            </p>

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
