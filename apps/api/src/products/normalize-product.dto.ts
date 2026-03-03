import { BadRequestException } from '@nestjs/common';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

/** Ensures a request-derived value is a string (prevents type-confusion e.g. array from repeated query params). */
export function ensureString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string')
    return value[0];
  throw new BadRequestException('Expected a string value.');
}

/** Ensures a request-derived value is a number (prevents type-confusion). */
export function ensureNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (Array.isArray(value) && value.length > 0) {
    const first: unknown = value[0];
    if (typeof first === 'number' && !Number.isNaN(first)) return first;
    const n = Number(first);
    if (!Number.isNaN(n)) return n;
  }
  throw new BadRequestException('Expected a number.');
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
    material: dto.material != null ? ensureString(dto.material) : undefined,
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
  if (dto.material !== undefined && dto.material !== null)
    out.material = ensureString(dto.material);
  return out;
}
