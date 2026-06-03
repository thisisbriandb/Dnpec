import { PauseCircle, LogOut } from "lucide-react"
import { signOut } from "@/app/actions/auth"

interface SuspendedScreenProps {
  companyName: string
}

export function SuspendedScreen({ companyName }: SuspendedScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#F4F7FB] min-h-full">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border shadow-medium overflow-hidden">
          <div className="h-1 bg-muted-foreground/40" />

          <div className="px-8 py-8 space-y-5">
            {/* Icon + badge */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <PauseCircle className="size-6 text-muted-foreground" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                Compte suspendu
              </span>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h1 className="text-[17px] font-semibold text-foreground">{companyName}</h1>
              <p className="text-[12.5px] text-muted-foreground">
                L&apos;accès à cet espace a été temporairement suspendu.
              </p>
            </div>

            {/* Contact */}
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Pour contester cette décision ou obtenir des informations complémentaires, contactez la DNPEC à l&apos;adresse{" "}
                <a href="mailto:contact@dnpec.gov.gn" className="font-medium text-primary hover:underline">
                  contact@dnpec.gov.gn
                </a>
                .
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

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Ministère de l&apos;économie, des finances et du budget · République de Guinée
        </p>
      </div>
    </div>
  )
}
