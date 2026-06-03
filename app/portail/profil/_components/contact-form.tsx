"use client"

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { updateContactInfo } from "@/app/actions/profile"

interface ContactFormProps {
  phone: string | null
  email: string
}

function inputCls(hasError: boolean) {
  return (
    "w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder:text-muted-foreground " +
    "focus:outline-none focus:ring-2 focus:border-transparent transition-all " +
    (hasError
      ? "border-destructive bg-red-50/40 focus:ring-destructive"
      : "border-input bg-background focus:ring-ring")
  )
}

export function ContactForm({ phone, email }: ContactFormProps) {
  const [phoneVal, setPhoneVal] = useState(phone ?? "")
  const [emailVal, setEmailVal] = useState(email)
  const [error, setError]       = useState<string | null>(null)
  const [saved, setSaved]       = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const fd = new FormData()
      fd.append("phone", phoneVal)
      fd.append("email", emailVal)
      const result = await updateContactInfo(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[13px] font-medium text-foreground mb-1.5">
          Email de contact
        </label>
        <input
          type="email"
          value={emailVal}
          onChange={(e) => setEmailVal(e.target.value)}
          placeholder="jean@entreprise.gn"
          className={inputCls(false)}
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-foreground mb-1.5">
          Téléphone
        </label>
        <input
          type="tel"
          value={phoneVal}
          onChange={(e) => setPhoneVal(e.target.value)}
          placeholder="+224 6XX XXX XXX"
          className={inputCls(false)}
        />
      </div>

      {error && (
        <p className="text-[12px] text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isPending ? (
            <><Loader2 className="size-3.5 animate-spin" />Enregistrement…</>
          ) : saved ? (
            <><Check className="size-3.5" />Enregistré</>
          ) : (
            "Enregistrer"
          )}
        </button>
        {saved && (
          <span className="text-[12px] text-status-ok-text font-medium">
            Modifications enregistrées
          </span>
        )}
      </div>
    </form>
  )
}
