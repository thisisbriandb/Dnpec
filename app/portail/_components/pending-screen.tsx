import { CheckCircle2, Clock, Shield, LogOut, Building2 } from "lucide-react"
import { formatDate } from "@/lib/format"
import { signOut } from "@/app/actions/auth"

interface PendingScreenProps {
  companyName: string
  submittedAt: string
}

const STEPS = [
  {
    label:       "Demande soumise",
    description: "Votre dossier a bien été reçu.",
    icon:        CheckCircle2,
    done:        true,
    active:      false,
  },
  {
    label:       "Examen DNPEC",
    description: "Un agent examine votre dossier.",
    icon:        Clock,
    done:        false,
    active:      true,
  },
  {
    label:       "Activation du compte",
    description: "Accès complet au portail entreprise.",
    icon:        Shield,
    done:        false,
    active:      false,
  },
]

export function PendingScreen({ companyName, submittedAt }: PendingScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-background min-h-full">
      <div className="w-full max-w-md space-y-4">

        <div className="bg-card rounded-2xl border border-border shadow-medium overflow-hidden">
          {/* Top accent */}
          <div
            className="h-1"
            style={{ background: "linear-gradient(90deg, #1E3A5F 0%, #2563eb 100%)" }}
          />

          <div className="px-8 py-8 space-y-7">

            {/* Central icon */}
            <div className="flex justify-center">
              <div className="relative flex size-20 items-center justify-center rounded-2xl bg-primary/[0.07]">
                <div className="absolute inset-0 rounded-2xl border border-primary/15" />
                <span className="absolute inset-0 rounded-2xl border-2 border-primary/15 animate-ping" />
                <Building2 className="relative size-8 text-primary" strokeWidth={1.5} />
              </div>
            </div>

            {/* Status badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-status-warn-bg border border-status-warn/25 px-3.5 py-1.5 text-[11.5px] font-semibold text-status-warn-text">
                <span className="size-1.5 rounded-full bg-status-warn animate-pulse" />
                Demande en cours d&apos;examen
              </span>
            </div>

            {/* Company + date */}
            <div className="text-center space-y-1">
              <h1 className="text-[17px] font-semibold text-foreground tracking-tight leading-tight">
                {companyName}
              </h1>
              <p className="text-[12.5px] text-muted-foreground">
                Dossier soumis le {formatDate(submittedAt)}
              </p>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-4 h-[calc(100%-32px)] w-px bg-border" />
              <ol className="space-y-0">
                {STEPS.map((step, i) => {
                  const Icon = step.icon
                  return (
                    <li key={i} className="relative flex items-start gap-4 pb-5 last:pb-0">
                      <div
                        className={[
                          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                          step.done
                            ? "border-status-ok bg-status-ok-bg"
                            : step.active
                            ? "border-primary/35 bg-primary/10"
                            : "border-border bg-background",
                        ].join(" ")}
                      >
                        {step.active && (
                          <span className="absolute inset-0 rounded-full bg-primary/15 animate-ping" />
                        )}
                        <Icon
                          className={[
                            "relative size-3.5",
                            step.done   ? "text-status-ok-text" :
                            step.active ? "text-primary"         :
                            "text-muted-foreground/35",
                          ].join(" ")}
                          strokeWidth={step.done || step.active ? 2.25 : 1.75}
                        />
                      </div>
                      <div className="pt-1">
                        <p
                          className={[
                            "text-[13px] font-semibold leading-tight",
                            step.done   ? "text-foreground"   :
                            step.active ? "text-primary"       :
                            "text-muted-foreground/45",
                          ].join(" ")}
                        >
                          {step.label}
                        </p>
                        {(step.done || step.active) && (
                          <p className="text-[11.5px] text-muted-foreground mt-0.5">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Info message */}
            <div className="rounded-xl bg-muted/40 border border-border/50 px-4 py-3">
              <p className="text-[12px] text-muted-foreground text-center leading-relaxed">
                Vous recevrez une notification par e-mail dès que la DNPEC aura traité votre demande.
              </p>
            </div>

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

        <p className="text-center text-[11px] text-muted-foreground">
          Ministère de l&apos;économie, des finances et du budget · République de Guinée
        </p>
      </div>
    </div>
  )
}
