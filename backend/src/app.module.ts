import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { TestModule } from './test/test.module';
import { UsersModule } from './users/users.module';
import { OutletsModule } from './outlets/outlets.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { BillingModule } from './billing/billing.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { EmailModule } from './email/email.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ReceiptsModule } from './receipts/receipts.module';
import { DiscountsModule } from './discounts/discounts.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    AuthModule,
    TestModule,
    UsersModule,
    OutletsModule,
    ProductsModule,
    InventoryModule,
    TransactionsModule,
    AuditLogsModule,
    FeatureFlagsModule,
    BillingModule,
    FileUploadModule,
    EmailModule,
    ReceiptsModule,
    DiscountsModule,
    SuppliersModule,
    AlertsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JWT Auth globally
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply Permissions Guard globally (after JWT)
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // Apply Roles Guard globally (after JWT)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
