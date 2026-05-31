"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, Loader2, Check, ChevronLeft, ChevronRight,
  Building2, User, FileText, ClipboardList, AlertCircle, CheckCircle2,
} from "lucide-react";
import { signUpCompanyAction } from "@/app/actions/auth";
import { Stepper } from "@/components/ui/stepper";
import type { Step } from "@/components/ui/stepper";

interface Sector {
  id: string;
  name: string;
}

interface InscriptionFormProps {
  sectors: Sector[];
}

interface RegistrationData {
  full_name: string;
  email: string;
  password: string;
  password_confirm: string;
  phone: string;
  nif: string;
  rccm: string;
  legal_status: string;
  creation_year: string;
  name: string;
  sector_id: string;
  size: string;
  address: string;
}

const STEPS: Step[] = [
  { id: "compte", label: "Votre compte", description: "Accès & contact" },
  { id: "legal", label: "Identité légale", description: "NIF, statut, RCCM" },
  { id: "entreprise", label: "L'entreprise", description: "Nom, secteur, taille" },
  { id: "recap", label: "Récapitulatif", description: "Vérification finale" },
];

const INITIAL_DATA: RegistrationData = {
  full_name: "", email: "", password: "", password_confirm: "", phone: "",
  nif: "", rccm: "", legal_status: "sarl", creation_year: "",
  name: "", sector_id: "", size: "pme", address: "",
};

const SIZE_LABELS: Record<string, string> = {
  tpe: "TPE — Très Petite Entreprise",
  pme: "PME — Petite et Moyenne Entreprise",
  grande_entreprise: "Grande Entreprise",
};

const LEGAL_LABELS: Record<string, string> = {
  sa: "SA — Société Anonyme",
  sarl: "SARL — Société à Resp. Limitée",
  suarl: "SUARL — Société Unipersonnelle",
  gie: "GIE — Groupement d'Intérêt Économique",
  public: "Entreprise Publique",
  autre: "Autre",
};

const STEP_ICONS = [User, FileText, Building2, ClipboardList];

function inputCls(hasError: boolean) {
  return (
    "w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder:text-muted-foreground " +
    "focus:outline-none focus:ring-2 focus:border-transparent transition-all " +
    (hasError
      ? "border-destructive bg-red-50/40 focus:ring-destructive"
      : "border-input bg-background focus:ring-ring")
  );
}

function selectCls(hasError: boolean) {
  return (
    "w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground " +
    "focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none " +
    (hasError
      ? "border-destructive bg-red-50/40 focus:ring-destructive"
      : "border-input bg-background focus:ring-ring")
  );
}

function Field({
  label, error, children, className,
}: {
  label: string; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-medium text-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11.5px] text-destructive">{error}</p>}
    </div>
  );
}

function RecapSection({
  title, onEdit, children,
}: {
  title: string; onEdit: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border/60">
        <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">{title}</span>
        <button
          type="button"
          onClick={onEdit}
          className="text-[12px] font-medium text-primary hover:underline"
        >
          Modifier
        </button>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[12px] font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}

export default function InscriptionForm({ sectors }: InscriptionFormProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RegistrationData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update(field: keyof RegistrationData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep(s: number): boolean {
    const e: Partial<Record<keyof RegistrationData, string>> = {};

    if (s === 0) {
      if (!data.full_name.trim()) e.full_name = "Nom requis";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Adresse email invalide";
      if (data.password.length < 8) e.password = "8 caractères minimum";
      if (data.password !== data.password_confirm) e.password_confirm = "Les mots de passe ne correspondent pas";
      if (!data.phone.trim()) e.phone = "Téléphone requis";
    }

    if (s === 1) {
      if (data.nif.trim().length < 3) e.nif = "NIF requis (3 caractères min.)";
      if (!data.legal_status) e.legal_status = "Statut juridique requis";
    }

    if (s === 2) {
      if (data.name.trim().length < 2) e.name = "Nom de l'entreprise requis";
      if (!data.sector_id) e.sector_id = "Secteur requis";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (validateStep(step)) setStep((s) => s + 1);
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
    setErrors({});
  }

  function goToStep(i: number) {
    if (i < step) { setStep(i); setErrors({}); }
  }

  function handleSubmit() {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      const entries: [keyof RegistrationData, string][] = [
        ["full_name", data.full_name], ["email", data.email], ["password", data.password],
        ["phone", data.phone], ["nif", data.nif], ["rccm", data.rccm],
        ["legal_status", data.legal_status], ["creation_year", data.creation_year],
        ["name", data.name], ["sector_id", data.sector_id], ["size", data.size],
        ["address", data.address],
      ];
      entries.forEach(([key, val]) => fd.append(key, val));

      const result = await signUpCompanyAction(fd);
      if (result?.error) setServerError(result.error);
    });
  }

  const selectedSector = sectors.find((s) => s.id === data.sector_id);
  const StepIcon = STEP_ICONS[step];
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FB]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 bg-white border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-white font-bold text-[11px]">DN</span>
          </div>
          <span className="font-semibold text-foreground text-sm hidden sm:block">DNPEC</span>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Déjà inscrit ? Se connecter
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Demande d&apos;accès entreprise
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground max-w-md mx-auto">
              Créez votre compte — la demande sera examinée par la DNPEC avant activation.
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-6 px-1">
            <Stepper steps={STEPS} currentStep={step} onStepClick={goToStep} />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-border shadow-medium overflow-hidden">
            {/* Progress bar */}
            <div className="h-[3px] bg-border">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Step header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-5 border-b border-border/50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <StepIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-foreground leading-none">
                  {STEPS[step].label}
                </h2>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  {STEPS[step].description}
                </p>
              </div>
            </div>

            {/* Step content */}
            <div className="px-6 py-6 animate-in fade-in duration-200">
              {/* ── Step 0: Compte ── */}
              {step === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nom et prénom du point focal" error={errors.full_name} className="sm:col-span-2">
                    <input
                      value={data.full_name}
                      onChange={(e) => update("full_name", e.target.value)}
                      placeholder="Ex : Jean Camara"
                      className={inputCls(!!errors.full_name)}
                    />
                  </Field>

                  <Field label="Email de contact" error={errors.email} className="sm:col-span-2">
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="jean@entreprise.gn"
                      className={inputCls(!!errors.email)}
                    />
                  </Field>

                  <Field label="Mot de passe" error={errors.password}>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={data.password}
                        onChange={(e) => update("password", e.target.value)}
                        placeholder="8 caractères minimum"
                        className={inputCls(!!errors.password) + " pr-10"}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirmation du mot de passe" error={errors.password_confirm}>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={data.password_confirm}
                        onChange={(e) => update("password_confirm", e.target.value)}
                        placeholder="Répétez le mot de passe"
                        className={inputCls(!!errors.password_confirm) + " pr-10"}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Téléphone" error={errors.phone}>
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+224 6XX XXX XXX"
                      className={inputCls(!!errors.phone)}
                    />
                  </Field>
                </div>
              )}

              {/* ── Step 1: Identité légale ── */}
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="NIF — Numéro d'Identification Fiscale"
                    error={errors.nif}
                    className="sm:col-span-2"
                  >
                    <input
                      value={data.nif}
                      onChange={(e) => update("nif", e.target.value)}
                      placeholder="Ex : 123456789"
                      className={inputCls(!!errors.nif)}
                    />
                  </Field>

                  <Field label="RCCM (optionnel)" error={errors.rccm}>
                    <input
                      value={data.rccm}
                      onChange={(e) => update("rccm", e.target.value)}
                      placeholder="Ex : GN-CON-2020-B-12345"
                      className={inputCls(false)}
                    />
                  </Field>

                  <Field label="Statut juridique" error={errors.legal_status}>
                    <select
                      value={data.legal_status}
                      onChange={(e) => update("legal_status", e.target.value)}
                      className={selectCls(!!errors.legal_status)}
                    >
                      {Object.entries(LEGAL_LABELS).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Année de création (optionnel)" error={undefined}>
                    <input
                      type="number"
                      value={data.creation_year}
                      onChange={(e) => update("creation_year", e.target.value)}
                      placeholder="Ex : 2015"
                      min={1800}
                      max={2100}
                      className={inputCls(false)}
                    />
                  </Field>
                </div>
              )}

              {/* ── Step 2: Entreprise ── */}
              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Nom de l'entreprise"
                    error={errors.name}
                    className="sm:col-span-2"
                  >
                    <input
                      value={data.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Ex : Entreprise Guinée SARL"
                      className={inputCls(!!errors.name)}
                    />
                  </Field>

                  {sectors.length === 0 ? (
                    <div className="sm:col-span-2 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[12.5px] text-amber-800">
                        Aucun secteur disponible. Contactez la DNPEC pour débloquer votre inscription.
                      </p>
                    </div>
                  ) : (
                    <Field label="Secteur d'activité" error={errors.sector_id}>
                      <select
                        value={data.sector_id}
                        onChange={(e) => update("sector_id", e.target.value)}
                        className={selectCls(!!errors.sector_id)}
                      >
                        <option value="">Sélectionner un secteur</option>
                        {sectors.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <Field label="Taille de l'entreprise" error={errors.size}>
                    <select
                      value={data.size}
                      onChange={(e) => update("size", e.target.value)}
                      className={selectCls(!!errors.size)}
                    >
                      {Object.entries(SIZE_LABELS).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Adresse (optionnel)"
                    error={undefined}
                    className="sm:col-span-2"
                  >
                    <input
                      value={data.address}
                      onChange={(e) => update("address", e.target.value)}
                      placeholder="Ex : Commune de Kaloum, Conakry"
                      className={inputCls(false)}
                    />
                  </Field>
                </div>
              )}

              {/* ── Step 3: Récapitulatif ── */}
              {step === 3 && (
                <div className="space-y-4">
                  {serverError && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <p className="text-[12.5px] text-red-800">{serverError}</p>
                    </div>
                  )}

                  <RecapSection title="Compte utilisateur" onEdit={() => goToStep(0)}>
                    <RecapRow label="Nom du point focal" value={data.full_name} />
                    <RecapRow label="Email" value={data.email} />
                    <RecapRow label="Téléphone" value={data.phone} />
                    <RecapRow label="Mot de passe" value="••••••••" />
                  </RecapSection>

                  <RecapSection title="Identité légale" onEdit={() => goToStep(1)}>
                    <RecapRow label="NIF" value={data.nif} />
                    {data.rccm && <RecapRow label="RCCM" value={data.rccm} />}
                    <RecapRow label="Statut juridique" value={LEGAL_LABELS[data.legal_status]} />
                    {data.creation_year && <RecapRow label="Année de création" value={data.creation_year} />}
                  </RecapSection>

                  <RecapSection title="Entreprise" onEdit={() => goToStep(2)}>
                    <RecapRow label="Nom" value={data.name} />
                    <RecapRow label="Secteur" value={selectedSector?.name} />
                    <RecapRow label="Taille" value={SIZE_LABELS[data.size]} />
                    {data.address && <RecapRow label="Adresse" value={data.address} />}
                  </RecapSection>

                  <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-3.5 py-3">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-blue-800 leading-relaxed">
                      Après soumission, vous recevrez un email de vérification. Votre demande sera ensuite examinée par la DNPEC avant l&apos;activation de votre accès.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/20">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-0 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </button>

              <span className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">{step + 1}</span>
                {" / "}
                {STEPS.length}
              </span>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={step === 2 && sectors.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || sectors.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Envoyer la demande
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Ministère du Plan et de la Coopération Internationale · République de Guinée
          </p>
        </div>
      </main>
    </div>
  );
}
