"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signIn } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connexion en cours…
        </>
      ) : (
        "Se connecter"
      )}
    </button>
  );
}

export default function LoginFormClient() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={signIn} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Adresse email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@entreprise.gn"
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            minLength={8}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-11 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
