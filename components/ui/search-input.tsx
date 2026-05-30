"use client"

import * as React from "react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "onChange"> {
  value?: string
  onChange?: (value: string) => void
  debounce?: number
  loading?: boolean
  placeholder?: string
  className?: string
}

function SearchInput({
  value: controlledValue,
  onChange,
  debounce = 300,
  loading = false,
  placeholder = "Rechercher…",
  className,
  ...props
}: SearchInputProps) {
  // Uncontrolled with initial value; parent resets via key prop
  const [internalValue, setInternalValue] = React.useState(controlledValue ?? "")
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInternalValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange?.(v), debounce)
  }

  function handleClear() {
    setInternalValue("")
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange?.("")
  }

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className={cn("relative flex items-center", className)}>
      <span className="pointer-events-none absolute left-2.5 text-muted-foreground">
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Search className="size-3.5" />
        )}
      </span>
      <input
        type="search"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "h-8 w-full rounded-control border border-input bg-background pl-8 pr-7 text-sm outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&::-webkit-search-cancel-button]:hidden"
        )}
        {...props}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Effacer la recherche"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}

export { SearchInput, type SearchInputProps }
