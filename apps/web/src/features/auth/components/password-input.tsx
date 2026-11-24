"use client"

import { Eye, EyeOff } from "lucide-react"
import { useId, useState } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { describedBy, FieldError, FieldHint } from "./field-error"

// Kata sandi dengan tombol tampilkan 44 px di dalam isian. Tempel dan pengelola kata sandi tidak
// diblokir (WCAG 3.3.8). autoComplete dari pemanggil: current-password atau new-password (DS 6.1b).
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-12", className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  )
}

/** Isian kata sandi berlabel. Kata sandi baru menampilkan aturannya, yang sekarang tidak. */
export function PasswordField({
  label = "Kata sandi",
  autoComplete = "new-password",
  error,
  field,
}: {
  label?: string
  autoComplete?: "new-password" | "current-password"
  error?: string
  field: UseFormRegisterReturn
}) {
  const id = useId()
  const isNew = autoComplete === "new-password"
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <PasswordInput
        id={id}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(isNew && `${id}-hint`, error && `${id}-error`)}
        {...field}
      />
      {isNew && <FieldHint id={`${id}-hint`}>Minimal 8 karakter.</FieldHint>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
