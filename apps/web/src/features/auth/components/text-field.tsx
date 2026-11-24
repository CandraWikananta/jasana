import { useId } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { describedBy, FieldError, FieldHint } from "./field-error"

/** Isian teks berlabel untuk formulir akun: label, isian, teks bantu, dan galat (DS 6.1). */
export function TextField({
  label,
  hint,
  error,
  field,
  ...inputProps
}: {
  label: string
  hint?: string
  error?: string
  field: UseFormRegisterReturn
} & Pick<React.ComponentProps<"input">, "type" | "autoComplete" | "autoCapitalize" | "spellCheck">) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        {...inputProps}
        {...field}
      />
      {hint && <FieldHint id={`${id}-hint`}>{hint}</FieldHint>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
