import { BadRequestException } from '@nestjs/common';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

/**
 * Ensures a request-derived value is a string.
 * Explicitly rejects arrays — duplicate HTTP params are parsed as arrays by Express
 * and would otherwise bypass string-based sanitizers (CWE-843 Type Confusion).
 */
export function ensureString(value: unknown): string {
  if (Array.isArray(value))
    throw new BadRequestException('Expected a string value, not an array.');
  if (typeof value === 'string') return value;
  throw new BadRequestException('Expected a string value.');
}

/**
 * Ensures a request-derived value is a number.
 * Explicitly rejects arrays for the same type-confusion reason as ensureString.
 */
export function ensureNumber(value: unknown): number {
  if (Array.isArray(value))
    throw new BadRequestException('Expected a number, not an array.');
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  throw new BadRequestException('Expected a number.');
}

/**
 * Ensures a request-derived optional value is a string, or returns undefined if absent.
 * Folding the null-check into the type guard prevents array values from slipping
 * through a pre-check condition before reaching sanitization logic.
 */
export function ensureOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value))
    throw new BadRequestException('Expected a string value, not an array.');
  if (typeof value !== 'string')
    throw new BadRequestException('Expected a string value.');
  return value;
}

/** Normalizes request body at the controller boundary so the service never sees raw request-derived data. */
export function normalizeCreateDto(dto: CreateProductDto): CreateProductDto {
  return {
    name: ensureString(dto.name),
    description: ensureString(dto.description),
    imageUrl: ensureString(dto.imageUrl),
    price: ensureNumber(dto.price),
    categoryId: ensureNumber(dto.categoryId),
    ageRangeId: ensureNumber(dto.ageRangeId),
    stockQuantity:
      dto.stockQuantity !== undefined
        ? ensureNumber(dto.stockQuantity)
        : undefined,
    height: dto.height !== undefined ? ensureNumber(dto.height) : undefined,
    weight: dto.weight !== undefined ? ensureNumber(dto.weight) : undefined,
    width: dto.width !== undefined ? ensureNumber(dto.width) : undefined,
    length: dto.length !== undefined ? ensureNumber(dto.length) : undefined,
    material: ensureOptionalString(dto.material),
  };
}

/** Normalizes update body at the controller boundary. */
export function normalizeUpdateDto(dto: UpdateProductDto): UpdateProductDto {
  const out: UpdateProductDto = {};
  if (dto.name !== undefined) out.name = ensureString(dto.name);
  if (dto.description !== undefined)
    out.description = ensureString(dto.description);
  if (dto.imageUrl !== undefined) out.imageUrl = ensureString(dto.imageUrl);
  if (dto.price !== undefined) out.price = ensureNumber(dto.price);
  if (dto.categoryId !== undefined)
    out.categoryId = ensureNumber(dto.categoryId);
  if (dto.ageRangeId !== undefined)
    out.ageRangeId = ensureNumber(dto.ageRangeId);
  if (dto.stockQuantity !== undefined)
    out.stockQuantity = ensureNumber(dto.stockQuantity);
  if (dto.height !== undefined) out.height = ensureNumber(dto.height);
  if (dto.weight !== undefined) out.weight = ensureNumber(dto.weight);
  if (dto.width !== undefined) out.width = ensureNumber(dto.width);
  if (dto.length !== undefined) out.length = ensureNumber(dto.length);
  const material = ensureOptionalString(dto.material);
  if (material !== undefined) out.material = material;
  return out;
}
