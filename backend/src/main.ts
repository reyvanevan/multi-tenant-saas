import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix (exclude health endpoint for Railway healthcheck)
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health'],
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Bermadani SaaS API')
    .setDescription('Multi-tenant POS & Koperasi Management System API')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('roles', 'Role management')
    .addTag('outlets', 'Outlet management')
    .addTag('products', 'Product management')
    .addTag('transactions', 'Transaction (POS) management')
    .addTag('audit-logs', 'Audit log & activity tracking')
    .addTag('test', 'Test endpoints for RBAC & Multi-tenancy')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0'; // Listen on all interfaces for Railway
  await app.listen(port, host);

  console.log(`🚀 Backend running on: http://${host}:${port}`);
  console.log(`📚 API available at: http://${host}:${port}${apiPrefix}`);
  console.log(`📖 Swagger docs at: http://${host}:${port}/api/docs`);
}
bootstrap();
