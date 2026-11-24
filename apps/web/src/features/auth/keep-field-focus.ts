// Pasang di onMouseDown formulir. Menekan tombol membuat isian blur, galatnya muncul (mode onTouched),
// tombol turun, lalu mouseup jatuh di luar tombol dan kliknya hilang. Tanpa blur, klik selalu sampai.
export function keepFieldFocus(event: React.MouseEvent<HTMLFormElement>) {
  if ((event.target as Element).closest("button")) event.preventDefault()
}
