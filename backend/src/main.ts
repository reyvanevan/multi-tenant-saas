import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5174',
    'http://localhost:3000',
  ];
  
  // Allow Railway healthcheck requests
  if (process.env.NODE_ENV === 'production') {
    allowedOrigins.push('https://healthcheck.railway.app');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or Railway healthcheck)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
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
  
  console.log(`🔍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔍 PORT from env: ${process.env.PORT}`);
  console.log(`🔍 Binding to: ${host}:${port}`);
  
  await app.listen(port, host);

  console.log(`🚀 Backend running on: http://${host}:${port}`);
  console.log(`📚 API available at: http://${host}:${port}${apiPrefix}`);
  console.log(`📖 Swagger docs at: http://${host}:${port}/api/docs`);
  console.log(`💚 Health endpoint at: http://${host}:${port}/health`);
}
bootstrap();
