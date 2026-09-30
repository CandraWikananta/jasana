/**
 * Alamat milik pemanggil (`user_addresses`).
 *
 * Aturan alamat utama, dijaga di service karena basis data tidak punya
 * constraint untuknya:
 *   - alamat pertama otomatis jadi utama
 *   - menandai satu alamat sebagai utama melepas tanda di alamat lain
 *   - alamat utama tidak bisa dilepas begitu saja, pilih alamat lain dulu
 *   - menghapus alamat utama memindahkan tandanya ke alamat terbaru
 *
 * Alamat milik user lain dibalas 404, bukan 403 (PRD 4.2: "tidak ada atau
 * bukan milik pemanggil"), supaya keberadaan id milik orang lain tidak bocor.
 *
 * Menghapus alamat aman untuk order lama: `orders.service_address` adalah
 * salinan, bukan rujukan.
 */

import { prisma, type Prisma } from '@jasana/database';
import { Errors } from '../../lib/errors';
import type { CreateAddressBody, UpdateAddressBody } from './users.schema';

const ADDRESS_SELECT = {
  id: true,
  label: true,
  addressLine: true,
  district: true,
  city: true,
  province: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserAddressSelect;

type AddressRow = Prisma.UserAddressGetPayload<{ select: typeof ADDRESS_SELECT }>;

export interface AddressDto {
  id: string;
  label: string | null;
  address_line: string;
  district: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

function toAddressDto(row: AddressRow): AddressDto {
  return {
    id: row.id,
    label: row.label,
    address_line: row.addressLine,
    district: row.district,
    city: row.city,
    province: row.province,
    postal_code: row.postalCode,
    // Decimal(10,8) dan Decimal(11,8) muat utuh di double: paling banyak 11
    // digit signifikan, jauh di bawah batas presisi 15 digit.
    latitude: row.latitude.toNumber(),
    longitude: row.longitude.toNumber(),
    is_default: row.isDefault,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function fields(input: UpdateAddressBody): Prisma.UserAddressUncheckedUpdateInput {
  return {
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.address_line !== undefined ? { addressLine: input.address_line } : {}),
    ...(input.district !== undefined ? { district: input.district } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.province !== undefined ? { province: input.province } : {}),
    ...(input.postal_code !== undefined ? { postalCode: input.postal_code } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
  };
}

function clearDefault(tx: Prisma.TransactionClient, userId: string, exceptId?: string) {
  return tx.userAddress.updateMany({
    where: { userId, isDefault: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isDefault: false },
  });
}

async function findOwned(tx: Prisma.TransactionClient, userId: string, id: string) {
  const address = await tx.userAddress.findFirst({
    where: { id, userId },
    select: { id: true, isDefault: true },
  });
  if (!address) throw Errors.notFound('Alamat tidak ditemukan');
  return address;
}

export async function listAddresses(userId: string): Promise<AddressDto[]> {
  const rows = await prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: ADDRESS_SELECT,
  });
  return rows.map(toAddressDto);
}

export async function createAddress(userId: string, input: CreateAddressBody): Promise<AddressDto> {
  const row = await prisma.$transaction(async (tx) => {
    const hasAny = (await tx.userAddress.count({ where: { userId } })) > 0;
    const isDefault = !hasAny || input.is_default === true;

    if (isDefault) await clearDefault(tx, userId);

    return tx.userAddress.create({
      data: {
        userId,
        addressLine: input.address_line,
        latitude: input.latitude,
        longitude: input.longitude,
        label: input.label ?? null,
        district: input.district ?? null,
        city: input.city ?? null,
        province: input.province ?? null,
        postalCode: input.postal_code ?? null,
        isDefault,
      },
      select: ADDRESS_SELECT,
    });
  });
  return toAddressDto(row);
}

export async function updateAddress(
  userId: string,
  id: string,
  input: UpdateAddressBody,
): Promise<AddressDto> {
  const row = await prisma.$transaction(async (tx) => {
    const address = await findOwned(tx, userId, id);

    if (input.is_default === false && address.isDefault) {
      throw Errors.validation([
        {
          path: 'is_default',
          message: 'Alamat utama tidak bisa dilepas. Jadikan alamat lain sebagai utama',
        },
      ]);
    }
    if (input.is_default === true && !address.isDefault) await clearDefault(tx, userId, id);

    return tx.userAddress.update({
      where: { id },
      data: { ...fields(input), ...(input.is_default === true ? { isDefault: true } : {}) },
      select: ADDRESS_SELECT,
    });
  });
  return toAddressDto(row);
}

export async function deleteAddress(userId: string, id: string): Promise<{ deleted: true }> {
  await prisma.$transaction(async (tx) => {
    const address = await findOwned(tx, userId, id);
    await tx.userAddress.delete({ where: { id } });

    if (address.isDefault) {
      const next = await tx.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (next) await tx.userAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  return { deleted: true };
}
