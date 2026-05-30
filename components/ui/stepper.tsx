import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  label: string
  description?: string
}

type StepState = "done" | "active" | "upcoming"

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (index: number) => void
  orientation?: "horizontal" | "vertical"
  className?: string
}

function getStepState(index: number, current: number): StepState {
  if (index < current) return "done"
  if (index === current) return "active"
  return "upcoming"
}

function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = "horizontal",
  className,
}: StepperProps) {
  return (
    <nav
      aria-label="Étapes"
      className={cn(
        orientation === "horizontal" && "flex items-center gap-0",
        orientation === "vertical" && "flex flex-col gap-0",
        className
      )}
    >
      {steps.map((step, i) => {
        const state = getStepState(i, currentStep)
        const isClickable = state === "done" || (onStepClick && i === currentStep)

        return (
          <React.Fragment key={step.id}>
            {/* Step item */}
            <div
              className={cn(
                "flex items-center gap-2.5",
                orientation === "vertical" && "flex-col items-start",
                orientation === "horizontal" && "flex-1 min-w-0"
              )}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(i)}
                disabled={!isClickable}
                aria-current={state === "active" ? "step" : undefined}
                aria-label={`Étape ${i + 1} : ${step.label}`}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                  state === "done" && "border-accent bg-accent text-accent-foreground",
                  state === "active" && "border-primary bg-primary text-primary-foreground",
                  state === "upcoming" && "border-border bg-background text-muted-foreground",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default"
                )}
              >
                {state === "done" ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </button>

              {orientation === "horizontal" && (
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-xs font-medium",
                      state === "active" && "text-foreground",
                      state === "done" && "text-foreground",
                      state === "upcoming" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="truncate text-[10px] text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-shrink-0 transition-colors",
                  orientation === "horizontal" && "mx-2 h-px flex-1 min-w-[16px]",
                  orientation === "vertical" && "my-1 ml-3.5 h-6 w-px",
                  i < currentStep ? "bg-accent" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export { Stepper, type Step, type StepperProps }
