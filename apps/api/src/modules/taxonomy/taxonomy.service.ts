/**
 * Usulan taksonomi dari provider ke admin (D74, D81, D82).
 *
 * Provider tidak pernah membuat taksonomi sendiri; ini satu-satunya
 * salurannya. Admin yang memutus, dan persetujuan MEMBUAT taksonominya di
 * transaksi yang sama, sehingga `resulting_id` selalu terisi dan aturan
 * berikut tidak bisa terlewat:
 *
 *   NEW_SUBCATEGORY       sub-kategori lahir NONAKTIF, admin melengkapi
 *                         atributnya dulu lalu mengaktifkan (usulan D baru)
 *   NEW_ATTRIBUTE         SELALU opsional, apa pun isi body admin (D74).
 *                         Satu provider tidak boleh memaksa provider lain
 *                         mengisi kolom baru
 *   NEW_ATTRIBUTE_OPTION  satu value ditambahkan ke `options`
 *
 * H57: maksimal 3 usulan PENDING per provider, dihitung lintas jenis.
 */

import { prisma, type Prisma, type TaxonomyRequestStatus } from '@jasana/database';
import { z } from 'zod';
import { AppError, Errors } from '../../lib/errors';
import { pageMeta, skipTake, type Page, type Paginated } from '../../lib/pagination';
import type { ProviderContext } from '../access/access.service';
import {
  appendAttributeOptionTx,
  createAttributeTx,
  createSubcategoryTx,
  translateCatalogError,
} from '../catalog/catalog.service';
import { isTimed } from '../catalog/attribute-rules';
import { createAttributeSchema } from '../catalog/catalog.schema';
import { dispatchEmails, recordEmail, type OutgoingEmail } from '../notifications/email-outbox';
import { lockProviderProfile } from '../workers/workforce';
import { taxonomyDecisionEmail } from './taxonomy-emails';
import {
  approveOptionSchema,
  approveSubcategorySchema,
  type AdminListQuery,
  type DecisionBody,
  type SubmitRequestBody,
} from './taxonomy.schema';

type Tx = Prisma.TransactionClient;

/**
 * D74. Tidak ada key `platform_settings` untuk angka ini di PRD 3.5, jadi
 * dibiarkan konstanta sampai ada keputusan menjadikannya parameter.
 */
export const MAX_ACTIVE_REQUESTS = 3;

const REQUEST_SELECT = {
  id: true,
  requestType: true,
  providerProfileId: true,
  categoryId: true,
  subcategoryId: true,
  attributeKey: true,
  proposedName: true,
  workDescription: true,
  priceFactors: true,
  commonQuestions: true,
  durationMinMinutes: true,
  durationMaxMinutes: true,
  bookingModeSuggestion: true,
  marketPriceMin: true,
  marketPriceMax: true,
  proposedRole: true,
  proposedDataType: true,
  affectsPrice: true,
  proposedOptions: true,
  reason: true,
  status: true,
  adminNote: true,
  resultingId: true,
  reviewedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  subcategory: { select: { id: true, name: true } },
  providerProfile: { select: { id: true, businessName: true, user: { select: { fullName: true } } } },
} as const satisfies Prisma.TaxonomyRequestSelect;

type RequestRow = Prisma.TaxonomyRequestGetPayload<{ select: typeof REQUEST_SELECT }>;

function toRequestDto(row: RequestRow) {
  return {
    id: row.id,
    request_type: row.requestType,
    status: row.status,
    provider: {
      id: row.providerProfile.id,
      name: row.providerProfile.businessName ?? row.providerProfile.user.fullName,
    },
    category: row.category,
    subcategory: row.subcategory,
    attribute_key: row.attributeKey,
    proposed_name: row.proposedName,
    work_description: row.workDescription,
    price_factors: row.priceFactors,
    common_questions: row.commonQuestions,
    duration_min_minutes: row.durationMinMinutes,
    duration_max_minutes: row.durationMaxMinutes,
    booking_mode_suggestion: row.bookingModeSuggestion,
    market_price_min: row.marketPriceMin?.toNumber() ?? null,
    market_price_max: row.marketPriceMax?.toNumber() ?? null,
    proposed_role: row.proposedRole,
    proposed_data_type: row.proposedDataType,
    affects_price: row.affectsPrice,
    proposed_options: row.proposedOptions,
    reason: row.reason,
    admin_note: row.adminNote,
    resulting_id: row.resultingId,
    reviewed_at: row.reviewedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
  };
}

export type TaxonomyRequestDto = ReturnType<typeof toRequestDto>;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const invalid = (path: string, message: string): never => {
  throw Errors.validation([{ path, message }]);
};

/**
 * Konteks usulan wajib ada dan aktif. Untuk option, atributnya harus punya
 * daftar option dan value-nya belum ada di sana (pencocokan persis saja,
 * kemiripan makna dinilai admin, H59).
 */
async function assertContext(body: SubmitRequestBody): Promise<void> {
  if (body.request_type === 'NEW_SUBCATEGORY') {
    const category = await prisma.category.findFirst({ where: { id: body.category_id, isActive: true } });
    if (!category) invalid('category_id', 'Kategori tidak ditemukan');
    return;
  }

  const subcategory = await prisma.subcategory.findFirst({
    where: { id: body.subcategory_id, isActive: true },
    select: { id: true },
  });
  if (!subcategory) invalid('subcategory_id', 'Sub-kategori tidak ditemukan');
  if (body.request_type === 'NEW_ATTRIBUTE') return;

  const attribute = await prisma.subcategoryAttribute.findFirst({
    where: { subcategoryId: body.subcategory_id, attributeKey: body.attribute_key, isActive: true },
    select: { dataType: true, options: true },
  });
  if (!attribute) return invalid('attribute_key', 'Atribut tidak ditemukan di sub-kategori ini');
  if (attribute.dataType !== 'SELECT' && attribute.dataType !== 'MULTISELECT') {
    invalid('attribute_key', 'Atribut ini tidak punya daftar pilihan');
  }
  const options = (attribute.options as { value: string; is_active: boolean }[] | null) ?? [];
  if (options.some((option) => option.is_active && option.value === body.proposed_name)) {
    invalid('proposed_name', 'Pilihan ini sudah ada');
  }
}

function requestData(providerProfileId: string, body: SubmitRequestBody): Prisma.TaxonomyRequestUncheckedCreateInput {
  const base = { providerProfileId, requestType: body.request_type, proposedName: body.proposed_name, reason: body.reason };
  switch (body.request_type) {
    case 'NEW_SUBCATEGORY':
      return {
        ...base,
        categoryId: body.category_id,
        workDescription: body.work_description,
        priceFactors: body.price_factors,
        commonQuestions: body.common_questions,
        durationMinMinutes: body.duration_min_minutes,
        durationMaxMinutes: body.duration_max_minutes,
        bookingModeSuggestion: body.booking_mode_suggestion,
        marketPriceMin: body.market_price_min,
        marketPriceMax: body.market_price_max,
      };
    case 'NEW_ATTRIBUTE':
      return {
        ...base,
        subcategoryId: body.subcategory_id,
        proposedRole: body.proposed_role,
        proposedDataType: body.proposed_data_type,
        affectsPrice: body.affects_price,
        proposedOptions: body.proposed_options,
      };
    case 'NEW_ATTRIBUTE_OPTION':
      return { ...base, subcategoryId: body.subcategory_id, attributeKey: body.attribute_key };
  }
}

/** POST /taxonomy-requests */
export async function submitRequest(
  provider: ProviderContext,
  body: SubmitRequestBody,
): Promise<TaxonomyRequestDto> {
  await assertContext(body);

  return prisma.$transaction(async (tx) => {
    // H57. Tanpa kunci, dua kiriman bersamaan saat tersisa satu jatah
    // sama-sama melihat dua usulan aktif dan sama-sama lolos.
    await lockProviderProfile(tx, provider.id);
    const active = await tx.taxonomyRequest.count({
      where: { providerProfileId: provider.id, status: 'PENDING' },
    });
    if (active >= MAX_ACTIVE_REQUESTS) {
      throw new AppError(
        'TAXONOMY_REQUEST_LIMIT',
        `Maksimal ${MAX_ACTIVE_REQUESTS} usulan menunggu tinjauan. Tunggu salah satunya diputus admin.`,
      );
    }
    const row = await tx.taxonomyRequest.create({
      data: requestData(provider.id, body),
      select: REQUEST_SELECT,
    });
    return toRequestDto(row);
  });
}

/** GET /taxonomy-requests/mine, terbaru dulu. */
export async function listMine(provider: ProviderContext, page: Page): Promise<Paginated<TaxonomyRequestDto>> {
  const where = { providerProfileId: provider.id };
  const [rows, total] = await prisma.$transaction([
    prisma.taxonomyRequest.findMany({ where, select: REQUEST_SELECT, orderBy: { createdAt: 'desc' }, ...skipTake(page) }),
    prisma.taxonomyRequest.count({ where }),
  ]);
  return { items: rows.map(toRequestDto), meta: pageMeta(page, total) };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/**
 * GET /admin/taxonomy-requests. "Dikelompokkan per sub-kategori dan
 * atribut" lewat urutan, supaya usulan untuk hal yang sama berdampingan dan
 * admin bisa memutusnya sekaligus.
 */
export async function listForAdmin(query: AdminListQuery): Promise<Paginated<TaxonomyRequestDto>> {
  const where = { status: query.status, requestType: query.request_type } satisfies Prisma.TaxonomyRequestWhereInput;
  const [rows, total] = await prisma.$transaction([
    prisma.taxonomyRequest.findMany({
      where,
      select: REQUEST_SELECT,
      orderBy: [{ subcategoryId: 'asc' }, { attributeKey: 'asc' }, { createdAt: 'asc' }],
      ...skipTake(query),
    }),
    prisma.taxonomyRequest.count({ where }),
  ]);
  return { items: rows.map(toRequestDto), meta: pageMeta(query, total) };
}

/** Parse `definition` dengan path berawalan `definition.` di detail galat. */
function parseDefinition<T extends z.ZodTypeAny>(schema: T, definition: unknown): z.infer<T> {
  return z.object({ definition: schema }).parse({ definition }).definition;
}

interface Outcome {
  resultingId: string;
  /** Sub-kategori yang ditautkan di email. */
  subcategoryId: string;
}

type PendingRequest = { requestType: string; categoryId: string | null; subcategoryId: string | null; attributeKey: string | null; proposedName: string };

async function approve(tx: Tx, request: PendingRequest, definition: unknown): Promise<Outcome> {
  if (request.requestType === 'NEW_SUBCATEGORY') {
    const def = parseDefinition(approveSubcategorySchema, definition);
    const categoryId = def.category_id ?? request.categoryId;
    if (!categoryId) return invalid('definition.category_id', 'category_id wajib diisi');
    const created = await createSubcategoryTx(tx, {
      ...def,
      name: def.name ?? request.proposedName,
      category_id: categoryId,
      is_active: false,
    });
    return { resultingId: created.id, subcategoryId: created.id };
  }

  if (!request.subcategoryId) return invalid('subcategory_id', 'Sub-kategori usulan sudah tidak ada');

  if (request.requestType === 'NEW_ATTRIBUTE') {
    const def = parseDefinition(createAttributeSchema, definition);
    // Atribut hasil usulan selalu opsional, padahal atribut berdurasi wajib diisi (D100 aturan 1).
    if (isTimed({ options: def.options })) {
      invalid(
        'definition.options',
        'Atribut hasil usulan selalu opsional, jadi belum bisa berdurasi. Setujui tanpa duration_minutes, lalu tambahkan durasi dan is_required lewat PATCH atribut (D100)',
      );
    }
    const created = await createAttributeTx(tx, request.subcategoryId, { ...def, is_required: false });
    return { resultingId: created.id, subcategoryId: request.subcategoryId };
  }

  const def = parseDefinition(approveOptionSchema, definition);
  const attribute = await tx.subcategoryAttribute.findFirst({
    where: { subcategoryId: request.subcategoryId, attributeKey: request.attributeKey ?? '' },
    select: { id: true },
  });
  if (!attribute) return invalid('attribute_key', 'Atribut usulan sudah tidak ada');
  await appendAttributeOptionTx(tx, attribute.id, def.option_value ?? request.proposedName, def.duration_minutes);
  return { resultingId: attribute.id, subcategoryId: request.subcategoryId };
}

/** MERGED menunjuk taksonomi yang sudah ada, sesuai jenis usulannya. */
async function resolveExisting(tx: Tx, requestType: string, resultingId: string): Promise<Outcome> {
  if (requestType === 'NEW_SUBCATEGORY') {
    const subcategory = await tx.subcategory.findUnique({ where: { id: resultingId }, select: { id: true } });
    if (!subcategory) return invalid('resulting_id', 'Sub-kategori tujuan tidak ditemukan');
    return { resultingId, subcategoryId: subcategory.id };
  }
  const attribute = await tx.subcategoryAttribute.findUnique({
    where: { id: resultingId },
    select: { subcategoryId: true },
  });
  if (!attribute) return invalid('resulting_id', 'Atribut tujuan tidak ditemukan');
  return { resultingId, subcategoryId: attribute.subcategoryId };
}

/** PATCH /admin/taxonomy-requests/:id */
export async function decideRequest(
  adminId: string,
  requestId: string,
  body: DecisionBody,
): Promise<TaxonomyRequestDto> {
  const emails: OutgoingEmail[] = [];

  const dto = await prisma
    .$transaction(async (tx) => {
      // Dua admin memutus usulan yang sama bersamaan: yang kedua menunggu
      // kunci, lalu melihat status sudah bukan PENDING.
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM taxonomy_requests WHERE id = ${requestId}::uuid FOR UPDATE
      `;
      if (locked.length === 0) throw Errors.notFound('Usulan tidak ditemukan');

      const request = await tx.taxonomyRequest.findUniqueOrThrow({
        where: { id: requestId },
        select: {
          requestType: true,
          categoryId: true,
          subcategoryId: true,
          attributeKey: true,
          proposedName: true,
          status: true,
          providerProfile: { select: { user: { select: { id: true, email: true, fullName: true } } } },
        },
      });
      if (request.status !== 'PENDING') {
        throw new AppError('TAXONOMY_REQUEST_STATE_CONFLICT', `Usulan sudah diputus (${request.status})`);
      }

      let outcome: Outcome | null = null;
      if (body.decision === 'APPROVED') outcome = await approve(tx, request, body.definition);
      if (body.decision === 'MERGED') outcome = await resolveExisting(tx, request.requestType, body.resulting_id);

      const status: TaxonomyRequestStatus = body.decision;
      const row = await tx.taxonomyRequest.update({
        where: { id: requestId },
        data: {
          status,
          adminNote: body.admin_note ?? null,
          resultingId: outcome?.resultingId ?? null,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
        select: REQUEST_SELECT,
      });

      const owner = request.providerProfile.user;
      const content = taxonomyDecisionEmail(
        owner.fullName,
        request.proposedName,
        body.decision,
        body.admin_note ?? null,
        body.decision === 'MERGED' ? outcome!.subcategoryId : null,
      );
      emails.push(
        await recordEmail(tx, {
          userId: owner.id,
          to: owner.email,
          type: 'TAXONOMY_REQUEST',
          referenceType: 'taxonomy_request',
          referenceId: requestId,
          ...content,
        }),
      );
      return toRequestDto(row);
    })
    .catch(translateCatalogError);

  void dispatchEmails(emails);
  return dto;
}
