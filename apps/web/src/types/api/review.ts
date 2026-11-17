// Bentuk JSON apps/api/src/modules/reviews/reviews.mapper.ts (D179).

export interface PublicReview {
  id: string
  rating: number
  comment: string | null
  /** Disamarkan server: kata pertama dan inisial kata kedua, `Candra W.` */
  reviewer_name: string
  provider_reply: string | null
  provider_replied_at: string | null
  created_at: string
}
