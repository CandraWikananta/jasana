// Nilai enum non-order dari packages/database/prisma/schema.prisma. packages/shared baru memuat
// enum order, jadi sementara ditulis di sini (tidak boleh mengubah shared dari feat/frontend).

export type MembershipStatus = "PENDING" | "ACTIVE" | "REJECTED" | "RESIGNED"
export type ListingStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "SUSPENDED"
export type TaxonomyRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "MERGED"
export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED_REFUND" | "RESOLVED_RELEASE" | "RESOLVED_PARTIAL" | "CLOSED"
export type WithdrawalStatus = "REQUESTED" | "APPROVED" | "DISBURSING" | "COMPLETED" | "REJECTED" | "FAILED" | "REVERSED"
export type RefundStatus = "REQUESTED" | "PROCESSING" | "COMPLETED" | "FAILED"
export type EmailDeliveryStatus = "PENDING" | "SENT" | "FAILED"
