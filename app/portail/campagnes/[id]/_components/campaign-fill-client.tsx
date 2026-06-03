"use client"

import * as React from "react"
import { useState, useTransition, useMemo } from "react"
import { AlertTriangle, CheckCircle2, Clock, Send, Save, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormFillPreview, type FormSchema } from "@/app/direction/_components/form-fill-preview"
import { saveDraft, submitSubmission } from "@/app/actions/submissions"

type SubmissionStatus =
  | "draft"
  | "submitted"
  | "validated"
  | "rejected"
  | "correction_requested"

interface CampaignFillClientProps {
  campaignId:       string
  submissionId:     string | null
  submissionStatus: SubmissionStatus | null
  rejectionComment: string | null
  formTitle:        string
  formDescription:  string | null
  schema:           FormSchema
  initialAnswers:   Record<string, string | string[]>
  campaignClosed:   boolean
}

export function CampaignFillClient({
  campaignId,
  submissionId,
  submissionStatus,
  rejectionComment,
  formTitle,
  formDescription,
  schema,
  initialAnswers,
  campaignClosed,
}: CampaignFillClientProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialAnswers)
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(submissionId)
  const [isSaving, startSave] = useTransition()
  const [isSubmitting, startSubmit] = useTransition()
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isReadOnly =
    campaignClosed ||
    submissionStatus === "submitted" ||
    submissionStatus === "validated"

  const completionRate = useMemo(() => {
    const required = schema.sections.flatMap((s) => s.fields).filter((f) => f.required)
    if (required.length === 0) return 100
    const filled = required.filter((f) => {
      const v = answers[f.key]
      if (v === undefined || v === null) return false
      if (Array.isArray(v)) return v.length > 0
      return String(v).trim() !== ""
    })
    return Math.round((filled.length / required.length) * 100)
  }, [answers, schema])

  function handleSaveDraft() {
    setServerError(null)
    setSaveSuccess(false)
    startSave(async () => {
      const result = await saveDraft(campaignId, answers)
      if (result && "error" in result) {
        setServerError(result.error)
      } else {
        setCurrentSubmissionId(result.submissionId)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    })
  }

  function handleConfirmSubmit() {
    if (!currentSubmissionId) {
      handleSaveDraftThenSubmit()
      return
    }
    setServerError(null)
    startSubmit(async () => {
      const result = await submitSubmission(currentSubmissionId)
      if (result && "error" in result) {
        setServerError(result.error)
        setSubmitDialogOpen(false)
      }
    })
  }

  function handleSaveDraftThenSubmit() {
    setServerError(null)
    startSave(async () => {
      const saved = await saveDraft(campaignId, answers)
      if (saved && "error" in saved) {
        setServerError(saved.error)
        setSubmitDialogOpen(false)
        return
      }
      const result = await submitSubmission(saved.submissionId)
      if (result && "error" in result) {
        setServerError(result.error)
        setSubmitDialogOpen(false)
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      {!isReadOnly && (
        <div className="rounded-xl border border-border bg-card shadow-subtle px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-muted-foreground">
              Champs obligatoires remplis
            </span>
            <span
              className={cn(
                "text-[13px] font-semibold tabular-nums",
                completionRate === 100 ? "text-status-ok-text" : "text-foreground",
              )}
            >
              {completionRate} %
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                completionRate === 100 ? "bg-status-ok" : "bg-primary",
              )}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Bandeau correction demandée */}
      {submissionStatus === "correction_requested" && rejectionComment && (
        <div className="rounded-xl border border-status-warn/30 bg-status-warn-bg px-5 py-4 flex gap-3">
          <AlertTriangle className="size-4 text-status-warn-text shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-status-warn-text">Correction demandée</p>
            <p className="text-[13px] text-foreground mt-1 leading-relaxed">{rejectionComment}</p>
          </div>
        </div>
      )}

      {/* Bandeau statut lecture seule */}
      {submissionStatus === "submitted" && (
        <div className="rounded-xl border border-status-warn/25 bg-status-warn-bg px-5 py-3.5 flex items-center gap-2.5">
          <Clock className="size-4 text-status-warn-text shrink-0" />
          <p className="text-[13px] font-medium text-status-warn-text">
            Votre réponse a été soumise — en attente de validation par la DNPEC.
          </p>
        </div>
      )}
      {submissionStatus === "validated" && (
        <div className="rounded-xl border border-status-ok/25 bg-status-ok-bg px-5 py-3.5 flex items-center gap-2.5">
          <CheckCircle2 className="size-4 text-status-ok-text shrink-0" />
          <p className="text-[13px] font-medium text-status-ok-text">
            Votre réponse a été validée par la DNPEC.
          </p>
        </div>
      )}
      {campaignClosed && !submissionStatus && (
        <div className="rounded-xl border border-border bg-muted/40 px-5 py-3.5 flex items-center gap-2.5">
          <Lock className="size-4 text-muted-foreground shrink-0" />
          <p className="text-[13px] text-muted-foreground">
            Cette campagne est clôturée. Aucune réponse n&apos;est plus acceptée.
          </p>
        </div>
      )}

      {/* Formulaire */}
      <FormFillPreview
        title={formTitle}
        description={formDescription}
        schema={schema}
        initialValues={answers}
        onAnswersChange={setAnswers}
        readOnly={isReadOnly}
      />

      {/* Feedback / erreur */}
      {serverError && (
        <div className="rounded-xl border border-status-bad/30 bg-status-bad-bg px-4 py-3">
          <p className="text-[13px] text-status-bad-text">{serverError}</p>
        </div>
      )}
      {saveSuccess && (
        <div className="rounded-xl border border-status-ok/25 bg-status-ok-bg px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-status-ok-text shrink-0" />
          <p className="text-[13px] text-status-ok-text font-medium">Brouillon enregistré.</p>
        </div>
      )}

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex items-center justify-end gap-3 pt-2 pb-6">
          <button
            type="button"
            disabled={isSaving || isSubmitting}
            onClick={handleSaveDraft}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-medium text-foreground",
              "hover:bg-muted transition-colors",
              (isSaving || isSubmitting) && "opacity-50 cursor-not-allowed",
            )}
          >
            <Save className="size-3.5" />
            {isSaving ? "Enregistrement…" : "Enregistrer le brouillon"}
          </button>

          <button
            type="button"
            disabled={isSaving || isSubmitting}
            onClick={() => setSubmitDialogOpen(true)}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground",
              "hover:bg-primary/90 transition-colors",
              (isSaving || isSubmitting) && "opacity-50 cursor-not-allowed",
            )}
          >
            <Send className="size-3.5" />
            Soumettre
          </button>
        </div>
      )}

      {/* Dialog de confirmation */}
      {submitDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSubmitDialogOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border shadow-medium p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Send className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Soumettre la réponse ?</h3>
                <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
                  Une fois soumise, votre réponse sera transmise à la DNPEC pour validation.
                  Vous ne pourrez plus la modifier sauf demande de correction.
                </p>
              </div>
            </div>
            {completionRate < 100 && (
              <div className="rounded-lg border border-status-warn/30 bg-status-warn-bg px-3.5 py-2.5">
                <p className="text-[12px] text-status-warn-text">
                  Attention : {completionRate} % des champs obligatoires sont remplis.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSubmitDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmitting || isSaving}
                onClick={handleConfirmSubmit}
                className={cn(
                  "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground",
                  "hover:bg-primary/90 transition-colors",
                  (isSubmitting || isSaving) && "opacity-50 cursor-not-allowed",
                )}
              >
                <Send className="size-3.5" />
                {isSubmitting || isSaving ? "Envoi…" : "Confirmer la soumission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
