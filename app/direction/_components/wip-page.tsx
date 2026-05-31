import { Construction } from "lucide-react"

interface WipPageProps {
  title: string
}

export function WipPage({ title }: WipPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <Construction className="size-7 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-title text-foreground">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Cette section est en cours de développement.
        </p>
      </div>
    </div>
  )
}
