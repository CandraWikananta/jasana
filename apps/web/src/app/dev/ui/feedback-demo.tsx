"use client"

import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

// DS 6.1: dialog konfirmasi (di HP menempel di bawah) dan toast satu kalimat.
export function FeedbackDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Buka dialog konfirmasi</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari semua perangkat?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua perangkat harus masuk lagi, termasuk yang sedang kamu pakai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button variant="destructive">Keluar dari semua</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button variant="outline" onClick={() => toast.success("Profil tersimpan.")}>
        Toast sukses
      </Button>
      <Button variant="outline" onClick={() => toast.error("Layanan sedang tidak tersedia.")}>
        Toast error
      </Button>
      <Button variant="outline" onClick={() => toast.info("Tidak ada penggantian email yang menunggu.")}>
        Toast info
      </Button>
    </div>
  )
}
