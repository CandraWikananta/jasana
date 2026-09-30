-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('DRAFT', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "provider_type" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "worker_membership_status" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "location_source_type" AS ENUM ('SAVED_ADDRESS', 'CURRENT_LOCATION', 'MAP_PIN');

-- CreateEnum
CREATE TYPE "kyc_document_type" AS ENUM ('KTP', 'SELFIE_KTP', 'NPWP', 'CERTIFICATE', 'BUSINESS_LICENSE');

-- CreateEnum
CREATE TYPE "kyc_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "attribute_data_type" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'DATE');

-- CreateEnum
CREATE TYPE "attribute_role" AS ENUM ('SPEC', 'OPTION');

-- CreateEnum
CREATE TYPE "pricing_mode" AS ENUM ('NONE', 'FLAT_PER_OPTION', 'PER_UNIT');

-- CreateEnum
CREATE TYPE "price_unit_type" AS ENUM ('PER_JOB', 'PER_HOUR', 'PER_UNIT');

-- CreateEnum
CREATE TYPE "listing_status" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "booking_mode_type" AS ENUM ('SCHEDULED', 'AVAILABLE_NOW');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('PENDING_ACCEPTANCE', 'ACCEPTED', 'PAID', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'SETTLED', 'REJECTED', 'EXPIRED', 'PAYMENT_EXPIRED', 'CANCELLED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "order_actor_type" AS ENUM ('CLIENT', 'PROVIDER', 'WORKER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "webhook_domain" AS ENUM ('PAYMENT', 'PAYOUT', 'REFUND');

-- CreateEnum
CREATE TYPE "webhook_processing_status" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "wallet_transaction_type" AS ENUM ('ESCROW_HOLD', 'ESCROW_RELEASE', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'REFUND_DEDUCTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "transaction_creator" AS ENUM ('SYSTEM', 'ADMIN');

-- CreateEnum
CREATE TYPE "withdrawal_status" AS ENUM ('REQUESTED', 'APPROVED', 'DISBURSING', 'COMPLETED', 'REJECTED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "xendit_payout_status" AS ENUM ('ACCEPTED', 'REQUESTED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "refund_type" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "dispute_raiser_role" AS ENUM ('CLIENT', 'PROVIDER');

-- CreateEnum
CREATE TYPE "dispute_category" AS ENUM ('WORK_NOT_DONE', 'POOR_QUALITY', 'PROVIDER_NO_SHOW', 'CLIENT_NO_SHOW', 'PAYMENT_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "dispute_status" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUND', 'RESOLVED_RELEASE', 'RESOLVED_PARTIAL', 'CLOSED');

-- CreateEnum
CREATE TYPE "chat_session_status" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "chat_message_role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('ORDER_STATUS', 'PAYMENT', 'WITHDRAWAL', 'KYC', 'DISPUTE', 'REVIEW', 'WORKER_APPLICATION', 'TAXONOMY_REQUEST', 'ACCOUNT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "email_delivery_status" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "token_purpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE');

-- CreateEnum
CREATE TYPE "taxonomy_request_type" AS ENUM ('NEW_SUBCATEGORY', 'NEW_ATTRIBUTE', 'NEW_ATTRIBUTE_OPTION');

-- CreateEnum
CREATE TYPE "taxonomy_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MERGED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "pending_email" VARCHAR(255),
    "phone" VARCHAR(20) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'CLIENT',
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(50),
    "address_line" TEXT NOT NULL,
    "district" VARCHAR(100),
    "city" VARCHAR(100),
    "province" VARCHAR(100),
    "postal_code" VARCHAR(10),
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "purpose" "token_purpose" NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by" UUID,
    "user_agent" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider_type" "provider_type" NOT NULL DEFAULT 'INDIVIDUAL',
    "requested_provider_type" "provider_type",
    "business_name" VARCHAR(150),
    "bio" TEXT,
    "verification_status" "verification_status" NOT NULL DEFAULT 'DRAFT',
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "rejection_reason" TEXT,
    "base_address" TEXT,
    "base_latitude" DECIMAL(10,8),
    "base_longitude" DECIMAL(11,8),
    "service_radius_km" DECIMAL(5,2) DEFAULT 10,
    "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "completed_orders_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "document_type" "kyc_document_type" NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" "kyc_status" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_workers" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "photo_url" TEXT,
    "experience_note" TEXT,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "membership_status" "worker_membership_status" NOT NULL DEFAULT 'PENDING',
    "accepts_assignments" BOOLEAN NOT NULL DEFAULT true,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "current_latitude" DECIMAL(10,8),
    "current_longitude" DECIMAL(11,8),
    "location_updated_at" TIMESTAMPTZ(6),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "provider_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_listings" (
    "id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "icon_name" VARCHAR(50),
    "icon_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "suggested_price_min" DECIMAL(12,2),
    "suggested_price_max" DECIMAL(12,2),
    "estimated_duration_minutes" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategory_attributes" (
    "id" UUID NOT NULL,
    "subcategory_id" UUID NOT NULL,
    "attribute_key" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "data_type" "attribute_data_type" NOT NULL,
    "attribute_role" "attribute_role" NOT NULL DEFAULT 'SPEC',
    "pricing_mode" "pricing_mode" NOT NULL DEFAULT 'NONE',
    "options" JSONB,
    "unit" VARCHAR(20),
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "validation_rule" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subcategory_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "subcategory_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "price_unit" "price_unit_type" NOT NULL DEFAULT 'PER_JOB',
    "estimated_duration_minutes" INTEGER,
    "attributes" JSONB NOT NULL,
    "attributes_need_update" BOOLEAN NOT NULL DEFAULT false,
    "supports_scheduled" BOOLEAN NOT NULL DEFAULT true,
    "supports_available_now" BOOLEAN NOT NULL DEFAULT false,
    "status" "listing_status" NOT NULL DEFAULT 'DRAFT',
    "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_option_prices" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "attribute_key" VARCHAR(50) NOT NULL,
    "option_value" VARCHAR(100),
    "price_delta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_offered" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "listing_option_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_photos" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "caption" VARCHAR(150),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_faqs" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "question" VARCHAR(200) NOT NULL,
    "answer" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "listing_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxonomy_requests" (
    "id" UUID NOT NULL,
    "request_type" "taxonomy_request_type" NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "category_id" UUID,
    "subcategory_id" UUID,
    "attribute_key" VARCHAR(50),
    "proposed_name" VARCHAR(150) NOT NULL,
    "work_description" TEXT,
    "price_factors" TEXT,
    "common_questions" TEXT,
    "duration_min_minutes" INTEGER,
    "duration_max_minutes" INTEGER,
    "booking_mode_suggestion" VARCHAR(20),
    "market_price_min" DECIMAL(12,2),
    "market_price_max" DECIMAL(12,2),
    "proposed_role" VARCHAR(10),
    "proposed_data_type" VARCHAR(20),
    "affects_price" BOOLEAN,
    "proposed_options" TEXT,
    "reason" TEXT,
    "status" "taxonomy_request_status" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "resulting_id" UUID,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxonomy_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(30) NOT NULL,
    "client_id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "assigned_worker_id" UUID,
    "accepted_by" UUID,
    "listing_id" UUID NOT NULL,
    "booking_mode" "booking_mode_type" NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "scheduled_at" TIMESTAMPTZ(6),
    "service_address" TEXT NOT NULL,
    "service_latitude" DECIMAL(10,8) NOT NULL,
    "service_longitude" DECIMAL(11,8) NOT NULL,
    "service_notes" TEXT,
    "location_source" "location_source_type" NOT NULL,
    "location_accuracy_m" DECIMAL(8,2),
    "snapshot_listing_title" VARCHAR(150) NOT NULL,
    "snapshot_assignee_name" VARCHAR(100),
    "snapshot_attributes" JSONB,
    "snapshot_selected_options" JSONB,
    "snapshot_duration_minutes" INTEGER,
    "listing_base_amount" DECIMAL(12,2) NOT NULL,
    "options_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "provider_earning" DECIMAL(12,2) NOT NULL,
    "platform_fee_refunded" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "verification_code_encrypted" VARCHAR(255),
    "verification_attempts" SMALLINT NOT NULL DEFAULT 0,
    "verification_locked_until" TIMESTAMPTZ(6),
    "verification_expires_at" TIMESTAMPTZ(6),
    "verified_at" TIMESTAMPTZ(6),
    "response_deadline_at" TIMESTAMPTZ(6),
    "payment_deadline_at" TIMESTAMPTZ(6),
    "settlement_due_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "settled_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancellation_reason" TEXT,
    "cancelled_by" "order_actor_type",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_crew" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "added_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_messages" (
    "id" BIGSERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "sender_role" "order_actor_type" NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_histories" (
    "id" BIGSERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "order_status",
    "to_status" "order_status" NOT NULL,
    "actor" "order_actor_type" NOT NULL,
    "changed_by_user_id" UUID,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_checkins" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "distance_meters" DECIMAL(10,2) NOT NULL,
    "radius_threshold_meters" INTEGER NOT NULL DEFAULT 100,
    "accuracy_meters" DECIMAL(8,2),
    "is_valid" BOOLEAN NOT NULL,
    "attempt_number" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "xendit_external_id" VARCHAR(100) NOT NULL,
    "xendit_invoice_id" VARCHAR(100),
    "payment_method" VARCHAR(50),
    "payment_channel" VARCHAR(50),
    "amount" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2),
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "invoice_url" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "raw_response" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(20) NOT NULL DEFAULT 'XENDIT',
    "domain" "webhook_domain" NOT NULL,
    "event_id" VARCHAR(150) NOT NULL,
    "event_type" VARCHAR(50),
    "reference_id" VARCHAR(100),
    "payload" JSONB NOT NULL,
    "signature_valid" BOOLEAN,
    "processing_status" "webhook_processing_status" NOT NULL DEFAULT 'RECEIVED',
    "locked_at" TIMESTAMPTZ(6),
    "retry_count" SMALLINT NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "balance_available" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_pending" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" BIGSERIAL NOT NULL,
    "wallet_id" UUID NOT NULL,
    "order_id" UUID,
    "withdrawal_id" UUID,
    "type" "wallet_transaction_type" NOT NULL,
    "amount_available_delta" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount_pending_delta" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_available_after" DECIMAL(14,2) NOT NULL,
    "balance_pending_after" DECIMAL(14,2) NOT NULL,
    "description" VARCHAR(255),
    "created_by" "transaction_creator" NOT NULL DEFAULT 'SYSTEM',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "admin_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(14,2) NOT NULL,
    "bank_code" VARCHAR(20) NOT NULL,
    "bank_account_number" VARCHAR(40) NOT NULL,
    "bank_account_name" VARCHAR(150) NOT NULL,
    "status" "withdrawal_status" NOT NULL DEFAULT 'REQUESTED',
    "xendit_payout_id" VARCHAR(100),
    "xendit_payout_status" "xendit_payout_status",
    "failure_code" VARCHAR(50),
    "reviewed_by" UUID,
    "rejection_reason" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "reversed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "type" "refund_type" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "includes_platform_fee" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "status" "refund_status" NOT NULL DEFAULT 'REQUESTED',
    "xendit_refund_id" VARCHAR(100),
    "initiated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "raised_by_user_id" UUID NOT NULL,
    "raised_by_role" "dispute_raiser_role" NOT NULL,
    "category" "dispute_category" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "dispute_status" NOT NULL DEFAULT 'OPEN',
    "resolution_note" TEXT,
    "refund_amount" DECIMAL(12,2),
    "resolved_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_evidences" (
    "id" UUID NOT NULL,
    "dispute_id" UUID NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" VARCHAR(20),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "provider_reply" TEXT,
    "provider_replied_at" TIMESTAMPTZ(6),
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "guest_token" VARCHAR(64),
    "title" VARCHAR(150),
    "status" "chat_session_status" NOT NULL DEFAULT 'ACTIVE',
    "personalization_snapshot" JSONB,
    "last_intent" JSONB,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6),
    "claimed_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" BIGSERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "role" "chat_message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "extracted_intent" JSONB,
    "intent_confidence" DECIMAL(4,3),
    "recommended_listing_ids" JSONB,
    "gemini_model" VARCHAR(50),
    "token_usage" JSONB,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "channel" "notification_channel" NOT NULL DEFAULT 'IN_APP',
    "title" VARCHAR(150) NOT NULL,
    "body" TEXT,
    "reference_type" VARCHAR(30),
    "reference_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "email_status" "email_delivery_status",
    "email_error" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" VARCHAR(50) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "user_addresses_user_id_is_default_idx" ON "user_addresses"("user_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_purpose_idx" ON "verification_tokens"("user_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_user_id_key" ON "provider_profiles"("user_id");

-- CreateIndex
CREATE INDEX "provider_profiles_verification_status_idx" ON "provider_profiles"("verification_status");

-- CreateIndex
CREATE INDEX "provider_profiles_provider_type_idx" ON "provider_profiles"("provider_type");

-- CreateIndex
CREATE INDEX "kyc_documents_provider_profile_id_idx" ON "kyc_documents"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_worker_geo" ON "provider_workers"("current_latitude", "current_longitude");

-- CreateIndex
CREATE INDEX "idx_worker_matching" ON "provider_workers"("provider_profile_id", "membership_status", "is_available");

-- CreateIndex
CREATE INDEX "provider_workers_user_id_idx" ON "provider_workers"("user_id");

-- CreateIndex
CREATE INDEX "worker_listings_listing_id_idx" ON "worker_listings"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "worker_listings_worker_id_listing_id_key" ON "worker_listings"("worker_id", "listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_category_id_slug_key" ON "subcategories"("category_id", "slug");

-- CreateIndex
CREATE INDEX "subcategory_attributes_subcategory_id_is_active_idx" ON "subcategory_attributes"("subcategory_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "subcategory_attributes_subcategory_id_attribute_key_key" ON "subcategory_attributes"("subcategory_id", "attribute_key");

-- CreateIndex
CREATE INDEX "idx_listing_search" ON "listings"("subcategory_id", "status");

-- CreateIndex
CREATE INDEX "listings_provider_profile_id_idx" ON "listings"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_listing_attributes" ON "listings" USING GIN ("attributes" jsonb_ops);

-- CreateIndex
CREATE INDEX "listing_option_prices_listing_id_idx" ON "listing_option_prices"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_option_prices_listing_id_attribute_key_option_value_key" ON "listing_option_prices"("listing_id", "attribute_key", "option_value");

-- CreateIndex
CREATE INDEX "listing_photos_listing_id_idx" ON "listing_photos"("listing_id");

-- CreateIndex
CREATE INDEX "listing_faqs_listing_id_display_order_idx" ON "listing_faqs"("listing_id", "display_order");

-- CreateIndex
CREATE INDEX "taxonomy_requests_provider_profile_id_status_idx" ON "taxonomy_requests"("provider_profile_id", "status");

-- CreateIndex
CREATE INDEX "taxonomy_requests_status_request_type_idx" ON "taxonomy_requests"("status", "request_type");

-- CreateIndex
CREATE INDEX "taxonomy_requests_subcategory_id_request_type_idx" ON "taxonomy_requests"("subcategory_id", "request_type");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_client_id_status_idx" ON "orders"("client_id", "status");

-- CreateIndex
CREATE INDEX "orders_provider_profile_id_status_idx" ON "orders"("provider_profile_id", "status");

-- CreateIndex
CREATE INDEX "idx_order_worker_status" ON "orders"("assigned_worker_id", "status");

-- CreateIndex
CREATE INDEX "idx_order_worker_schedule" ON "orders"("assigned_worker_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_order_sla_sweep" ON "orders"("status", "response_deadline_at");

-- CreateIndex
CREATE INDEX "idx_order_settlement_sweep" ON "orders"("status", "settlement_due_at");

-- CreateIndex
CREATE INDEX "idx_order_client_history" ON "orders"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "order_crew_worker_id_idx" ON "order_crew"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_crew_order_id_worker_id_key" ON "order_crew"("order_id", "worker_id");

-- CreateIndex
CREATE INDEX "order_messages_order_id_id_idx" ON "order_messages"("order_id", "id");

-- CreateIndex
CREATE INDEX "order_messages_order_id_read_at_idx" ON "order_messages"("order_id", "read_at");

-- CreateIndex
CREATE INDEX "order_status_histories_order_id_id_idx" ON "order_status_histories"("order_id", "id");

-- CreateIndex
CREATE INDEX "order_checkins_order_id_attempt_number_idx" ON "order_checkins"("order_id", "attempt_number");

-- CreateIndex
CREATE INDEX "order_checkins_worker_id_idx" ON "order_checkins"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_xendit_external_id_key" ON "payments"("xendit_external_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_xendit_invoice_id_key" ON "payments"("xendit_invoice_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_event_id_key" ON "webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "webhook_events_processing_status_locked_at_idx" ON "webhook_events"("processing_status", "locked_at");

-- CreateIndex
CREATE INDEX "webhook_events_reference_id_idx" ON "webhook_events"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_provider_profile_id_key" ON "wallets"("provider_profile_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_id_idx" ON "wallet_transactions"("wallet_id", "id");

-- CreateIndex
CREATE INDEX "wallet_transactions_order_id_idx" ON "wallet_transactions"("order_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_withdrawal_id_idx" ON "wallet_transactions"("withdrawal_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_xendit_payout_id_key" ON "withdrawals"("xendit_payout_id");

-- CreateIndex
CREATE INDEX "withdrawals_wallet_id_status_idx" ON "withdrawals"("wallet_id", "status");

-- CreateIndex
CREATE INDEX "refunds_order_id_idx" ON "refunds"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_order_id_key" ON "disputes"("order_id");

-- CreateIndex
CREATE INDEX "dispute_evidences_dispute_id_idx" ON "dispute_evidences"("dispute_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_order_id_key" ON "reviews"("order_id");

-- CreateIndex
CREATE INDEX "reviews_provider_profile_id_is_visible_idx" ON "reviews"("provider_profile_id", "is_visible");

-- CreateIndex
CREATE INDEX "reviews_listing_id_idx" ON "reviews"("listing_id");

-- CreateIndex
CREATE INDEX "idx_review_client_history" ON "reviews"("client_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_guest_token_key" ON "chat_sessions"("guest_token");

-- CreateIndex
CREATE INDEX "chat_sessions_user_id_started_at_idx" ON "chat_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "chat_sessions_guest_token_idx" ON "chat_sessions"("guest_token");

-- CreateIndex
CREATE INDEX "chat_sessions_status_expires_at_idx" ON "chat_sessions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_id_idx" ON "chat_messages"("session_id", "id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "idx_notification_email_retry" ON "notifications"("channel", "email_status");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_workers" ADD CONSTRAINT "provider_workers_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_workers" ADD CONSTRAINT "provider_workers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_workers" ADD CONSTRAINT "provider_workers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_listings" ADD CONSTRAINT "worker_listings_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "provider_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_listings" ADD CONSTRAINT "worker_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategory_attributes" ADD CONSTRAINT "subcategory_attributes_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_option_prices" ADD CONSTRAINT "listing_option_prices_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_faqs" ADD CONSTRAINT "listing_faqs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_requests" ADD CONSTRAINT "taxonomy_requests_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_requests" ADD CONSTRAINT "taxonomy_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_requests" ADD CONSTRAINT "taxonomy_requests_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_requests" ADD CONSTRAINT "taxonomy_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_worker_id_fkey" FOREIGN KEY ("assigned_worker_id") REFERENCES "provider_workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_crew" ADD CONSTRAINT "order_crew_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_crew" ADD CONSTRAINT "order_crew_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "provider_workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_crew" ADD CONSTRAINT "order_crew_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_checkins" ADD CONSTRAINT "order_checkins_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_checkins" ADD CONSTRAINT "order_checkins_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "provider_workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_user_id_fkey" FOREIGN KEY ("raised_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
