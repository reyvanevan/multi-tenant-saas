import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class BulkImportProductDto extends CreateProductDto {}

export class BulkImportRequestDto {
  @ApiProperty({
    description: 'Array of products to import',
    type: [BulkImportProductDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportProductDto)
  products: BulkImportProductDto[];
}
