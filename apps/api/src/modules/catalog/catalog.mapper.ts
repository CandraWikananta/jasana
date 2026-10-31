/**
 * Bentuk JSON baris katalog. Decimal harga acuan dikonversi ke integer
 * rupiah (PRD 4.1).
 */

import type { Category, Subcategory, SubcategoryAttribute } from '@jasana/database';
import type { AttributeDefinition, AttributeOption, ValidationRule } from './attribute-rules';

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
}

export function toCategoryDto(row: Category): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon_name: row.iconName,
    icon_url: row.iconUrl,
    display_order: row.displayOrder,
    is_active: row.isActive,
  };
}

export interface SubcategoryDto {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  estimated_duration_minutes: number | null;
  display_order: number;
  is_active: boolean;
}

export function toSubcategoryDto(row: Subcategory): SubcategoryDto {
  return {
    id: row.id,
    category_id: row.categoryId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    suggested_price_min: row.suggestedPriceMin?.toNumber() ?? null,
    suggested_price_max: row.suggestedPriceMax?.toNumber() ?? null,
    estimated_duration_minutes: row.estimatedDurationMinutes,
    display_order: row.displayOrder,
    is_active: row.isActive,
  };
}

export interface AttributeDto extends Required<AttributeDefinition> {
  id: string;
  subcategory_id: string;
  label: string;
  unit: string | null;
  is_filterable: boolean;
  display_order: number;
}

/** Baris basis data ke bentuk yang dibaca `attribute-rules`. */
export function toDefinition(row: SubcategoryAttribute): Required<AttributeDefinition> {
  return {
    attribute_key: row.attributeKey,
    data_type: row.dataType,
    attribute_role: row.attributeRole,
    pricing_mode: row.pricingMode,
    options: (row.options as AttributeOption[] | null) ?? null,
    validation_rule: (row.validationRule as ValidationRule | null) ?? null,
    is_required: row.isRequired,
    is_active: row.isActive,
    is_filterable: row.isFilterable,
  };
}

/**
 * `publicView` untuk form listing dan panel filter: option nonaktif
 * disembunyikan, karena tidak boleh dipilih lagi (D67).
 */
export function toAttributeDto(row: SubcategoryAttribute, publicView = false): AttributeDto {
  const definition = toDefinition(row);
  // D100: `duration_minutes` selalu ada di respons, null kalau opsinya tidak berdurasi.
  const options =
    definition.options?.map((option) => ({ ...option, duration_minutes: option.duration_minutes ?? null })) ?? null;
  return {
    id: row.id,
    subcategory_id: row.subcategoryId,
    label: row.label,
    ...definition,
    options: publicView ? (options?.filter((option) => option.is_active) ?? null) : options,
    unit: row.unit,
    is_filterable: row.isFilterable,
    display_order: row.displayOrder,
  };
}
