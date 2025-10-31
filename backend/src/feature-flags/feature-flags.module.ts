import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300000, // 5 minutes
      max: 1000, // maximum items in cache
    }),
  ],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService, PrismaService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
