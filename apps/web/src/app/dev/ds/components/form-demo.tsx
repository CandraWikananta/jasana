"use client"

import { useRef, useState, type FormEvent } from "react"
import { CircleAlert } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LOCATIONS } from "../data"

// Formulir DS 6.1, 6.1b, dan 10 (D248). Label selalu terlihat, placeholder berisi contoh nyata
// berakhiran "…", atribut field sesuai jenisnya, error body-sm 500 dengan ikon 16 px yang
// dihubungkan lewat aria-describedby. Setelah kirim gagal, fokus pindah ke field error pertama.
// Validasi di sini hanya peraga; di aplikasi asli lewat react-hook-form + Zod.

const FOCUS_DEMO = "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-card"
const HP = /^08\d{8,11}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = Partial<Record<"email" | "hp", string>>

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm font-medium text-destructive">
      <CircleAlert aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  )
}

export function FormDemo() {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Errors>({ hp: "Nomor HP diawali 08 dan berisi 10 sampai 13 digit." })
  const [saved, setSaved] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const next: Errors = {}
    if (!EMAIL.test(String(data.get("email") ?? ""))) next.email = "Tulis email lengkap, misalnya ayu@contoh.id."
    if (!HP.test(String(data.get("hp") ?? ""))) next.hp = "Nomor HP diawali 08 dan berisi 10 sampai 13 digit."
    setErrors(next)
    setSaved(Object.keys(next).length === 0)
    // Daftar ini mengikuti urutan field di DOM, jadi yang pertama ditemukan adalah error teratas.
    const firstName = (["email", "hp"] as const).find((k) => next[k])
    if (firstName) formRef.current?.querySelector<HTMLElement>(`[name="${firstName}"]`)?.focus()
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-5 rounded-lg border border-border bg-card p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ds-nama">Nama lengkap</Label>
        <Input id="ds-nama" name="nama" type="text" autoComplete="name" defaultValue="Ni Luh Putu Ayu" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ds-email">Email</Label>
        <Input
          id="ds-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="ayu@contoh.id…"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "ds-email-error" : undefined}
        />
        {errors.email ? <FieldError id="ds-email-error">{errors.email}</FieldError> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ds-hp">Nomor HP</Label>
        <Input
          id="ds-hp"
          name="hp"
          type="tel"
          autoComplete="tel"
          defaultValue="0812345"
          aria-invalid={errors.hp ? true : undefined}
          aria-describedby={errors.hp ? "ds-hp-error" : undefined}
        />
        {errors.hp ? <FieldError id="ds-hp-error">{errors.hp}</FieldError> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ds-alamat">Alamat (fokus dipaksa tampil)</Label>
        <Input
          id="ds-alamat"
          name="alamat"
          type="text"
          autoComplete="street-address"
          placeholder="Jl. Tukad Badung No. 12…"
          defaultValue="Jl. Tukad Badung No. 12"
          className={FOCUS_DEMO}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ds-kab">Kabupaten atau kota</Label>
        <Select defaultValue="Denpasar" name="kabupaten">
          <SelectTrigger id="ds-kab" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ds-nominal">Nominal tarik saldo</Label>
        <Input id="ds-nominal" name="nominal" type="text" inputMode="numeric" autoComplete="off" placeholder="Rp150.000…" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <Button type="submit">Simpan</Button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {saved ? "Tersimpan." : "Tekan Simpan: fokus pindah ke field error pertama."}
        </p>
      </div>
    </form>
  )
}
