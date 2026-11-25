import { filterChipClass } from "@/components/shared/filter-chip"

const EXAMPLES = ["AC bocor, servis besok pagi", "Motor mogok, butuh sekarang", "Makeup wisuda di bawah 500 ribu"]

/** Keadaan awal. Contoh mengisi kotak tulis, bukan langsung mengirim: bisa diubah dulu, dan kuota tamu tidak terpakai. */
export function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-6 pt-2 md:pt-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-h2 font-semibold text-balance">Ceritakan jasa yang kamu butuhkan</h2>
        <p className="max-w-lg text-base text-pretty text-muted-foreground">
          Sebutkan masalahnya, waktunya, atau anggaranmu. Asisten mencarikan jasa yang melayani lokasimu.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <p id="contoh-asisten" className="text-sm font-semibold">
          Contoh
        </p>
        <ul aria-labelledby="contoh-asisten" className="flex flex-col items-start gap-2">
          {EXAMPLES.map((text) => (
            <li key={text}>
              <button type="button" className={filterChipClass(false)} onClick={() => onPick(text)}>
                {text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
