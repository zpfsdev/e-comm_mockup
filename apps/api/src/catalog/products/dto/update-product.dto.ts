import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/** All fields optional — validated by the same constraints as CreateProductDto. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
