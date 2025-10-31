import { PartialType } from '@nestjs/swagger';
import { CreateProductVariantDto } from './create-variant.dto';

export class UpdateProductVariantDto extends PartialType(
  CreateProductVariantDto,
) {}
