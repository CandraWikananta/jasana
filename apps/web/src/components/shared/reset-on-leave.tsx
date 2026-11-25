"use client"

import { Fragment, useEffect, useState } from "react"

/**
 * Membuang isi formulir saat halamannya ditinggalkan (pola D263, H149). Next menyimpan halaman lama
 * tetap terpasang tapi tersembunyi (Cache Components), jadi tanpa ini kata sandi yang diketik
 * tertinggal di DOM. Kunci baru membuang DOM beserta seluruh state-nya: galat, hasil, dan tombol yang
 * masih memutar.
 */
export function ResetOnLeave({ children }: { children: React.ReactNode }) {
  const [visit, setVisit] = useState(0)
  useEffect(() => () => setVisit((value) => value + 1), [])
  return <Fragment key={visit}>{children}</Fragment>
}
