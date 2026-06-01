"use client"

import * as React from "react"
import {
  useFormContext,
  Controller,
  type FieldPath,
  type FieldValues,
  type Control,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CheckCircle2 } from "lucide-react"

/* ── Field wrapper ────────────────────────────────────────────── */
interface FieldWrapperProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  valid?: boolean
  className?: string
  children: React.ReactNode
  htmlFor?: string
}

function FieldWrapper({
  label,
  hint,
  error,
  required,
  valid,
  className,
  children,
  htmlFor,
}: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor={htmlFor}
            className={cn(
              "text-xs font-medium",
              error ? "text-status-bad-text" : "text-foreground"
            )}
          >
            {label}
            {required && (
              <span className="ml-0.5 text-status-bad" aria-hidden="true">
                *
              </span>
            )}
          </Label>
          {hint && !error && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
      )}

      {children}

      {error && (
        <p className="flex items-center gap-1 text-xs text-status-bad-text" role="alert">
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </p>
      )}

      {valid && !error && (
        <p className="flex items-center gap-1 text-xs text-status-ok-text">
          <CheckCircle2 className="size-3 shrink-0" />
          OK
        </p>
      )}
    </div>
  )
}

/* ── FormInput ────────────────────────────────────────────────── */
interface FormInputProps<T extends FieldValues>
  extends Omit<React.ComponentProps<"input">, "name"> {
  name: FieldPath<T>
  control?: Control<T>
  label?: string
  hint?: string
  required?: boolean
}

function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  hint,
  required,
  className,
  ...props
}: FormInputProps<T>) {
  const ctx = useFormContext<T>()
  const ctrl = control ?? ctx?.control

  return (
    <Controller
      name={name}
      control={ctrl}
      render={({ field, fieldState }) => (
        <FieldWrapper
          label={label}
          hint={hint}
          error={fieldState.error?.message}
          required={required}
          valid={fieldState.isDirty && !fieldState.error}
          htmlFor={name}
          className={className}
        >
          <Input
            id={name}
            aria-invalid={!!fieldState.error}
            aria-describedby={fieldState.error ? `${name}-error` : undefined}
            {...field}
            {...props}
          />
        </FieldWrapper>
      )}
    />
  )
}

/* ── FormTextarea ─────────────────────────────────────────────── */
interface FormTextareaProps<T extends FieldValues>
  extends Omit<React.ComponentProps<"textarea">, "name"> {
  name: FieldPath<T>
  control?: Control<T>
  label?: string
  hint?: string
  required?: boolean
}

function FormTextarea<T extends FieldValues>({
  name,
  control,
  label,
  hint,
  required,
  className,
  ...props
}: FormTextareaProps<T>) {
  const ctx = useFormContext<T>()
  const ctrl = control ?? ctx?.control

  return (
    <Controller
      name={name}
      control={ctrl}
      render={({ field, fieldState }) => (
        <FieldWrapper
          label={label}
          hint={hint}
          error={fieldState.error?.message}
          required={required}
          valid={fieldState.isDirty && !fieldState.error}
          htmlFor={name}
          className={className}
        >
          <Textarea
            id={name}
            aria-invalid={!!fieldState.error}
            {...field}
            {...props}
          />
        </FieldWrapper>
      )}
    />
  )
}

/* ── FormSelect ───────────────────────────────────────────────── */
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface FormSelectProps<T extends FieldValues> {
  name: FieldPath<T>
  control?: Control<T>
  label?: string
  hint?: string
  required?: boolean
  placeholder?: string
  options: SelectOption[]
  className?: string
}

function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  hint,
  required,
  placeholder = "Sélectionner…",
  options,
  className,
}: FormSelectProps<T>) {
  const ctx = useFormContext<T>()
  const ctrl = control ?? ctx?.control

  return (
    <Controller
      name={name}
      control={ctrl}
      render={({ field, fieldState }) => (
        <FieldWrapper
          label={label}
          hint={hint}
          error={fieldState.error?.message}
          required={required}
          valid={fieldState.isDirty && !fieldState.error}
          htmlFor={name}
          className={className}
        >
          <Select
            value={(field.value as string) ?? ""}
            onValueChange={field.onChange}
          >
            <SelectTrigger
              id={name}
              aria-invalid={!!fieldState.error}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      )}
    />
  )
}

export {
  FieldWrapper,
  FormInput,
  FormTextarea,
  FormSelect,
  type FieldWrapperProps,
  type SelectOption,
}
