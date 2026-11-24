import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import type { FormErrorView } from "@/features/auth/schemas"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"

/** Galat kiriman ke isian (fokus ke yang pertama), sisanya dikembalikan untuk FormAlert di atas formulir. */
export function applyFormError<T extends FieldValues>(
  error: unknown,
  map: (error: ApiError) => FormErrorView<Path<T>>,
  setError: UseFormSetError<T>,
): string | null {
  if (!(error instanceof ApiError)) return UNKNOWN_ERROR_MESSAGE
  const view = map(error)
  Object.entries<string | undefined>(view.fields).forEach(([field, message], i) => {
    setError(field as Path<T>, { message }, { shouldFocus: i === 0 })
  })
  return view.form
}
