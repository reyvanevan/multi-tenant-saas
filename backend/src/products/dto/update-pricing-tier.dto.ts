import { PartialType } from '@nestjs/swagger';
import { CreatePricingTierDto } from './create-pricing-tier.dto';

export class UpdatePricingTierDto extends PartialType(CreatePricingTierDto) {}
