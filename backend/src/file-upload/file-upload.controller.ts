import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { memoryStorage } from 'multer';

@ApiTags('File Upload')
@ApiBearerAuth()
@Controller({ path: 'files', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          example: 'products',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { tenantId: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.fileUploadService.uploadFile(
      file,
      user.tenantId,
      'general',
    );

    // Track storage usage
    await this.fileUploadService.trackStorageUsage(user.tenantId, file.size);

    return result;
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
    }),
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: { tenantId: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await this.fileUploadService.uploadFiles(
      files,
      user.tenantId,
      'general',
    );

    // Track storage usage
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    await this.fileUploadService.trackStorageUsage(user.tenantId, totalSize);

    return { files: results };
  }

  @Post('upload/product-image')
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Product image uploaded' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for images
      },
    }),
  )
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { tenantId: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate it's an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const result = await this.fileUploadService.uploadFile(
      file,
      user.tenantId,
      'products',
    );

    await this.fileUploadService.trackStorageUsage(user.tenantId, file.size);

    return result;
  }

  @Post('upload/logo')
  @ApiOperation({ summary: 'Upload tenant logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Logo uploaded' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB for logos
      },
    }),
  )
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { tenantId: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const result = await this.fileUploadService.uploadFile(
      file,
      user.tenantId,
      'logos',
    );

    await this.fileUploadService.trackStorageUsage(user.tenantId, file.size);

    return result;
  }

  @Delete('*keyPath')
  @ApiOperation({ summary: 'Delete file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(@Param('keyPath') key: string) {
    await this.fileUploadService.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  @Get('signed-url/*keyPath')
  @ApiOperation({ summary: 'Get signed URL for private file' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  async getSignedUrl(@Param('keyPath') key: string) {
    const url = await this.fileUploadService.getSignedUrl(key);
    return { url };
  }

  @Get('metadata/*keyPath')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved' })
  async getFileMetadata(@Param('keyPath') key: string) {
    const metadata = await this.fileUploadService.getFileMetadata(key);
    return metadata;
  }

  @Get('storage-usage')
  @ApiOperation({ summary: 'Get tenant storage usage' })
  @ApiResponse({ status: 200, description: 'Storage usage in MB' })
  async getStorageUsage(@CurrentUser() user: { tenantId: string }) {
    const usage = await this.fileUploadService.getStorageUsage(user.tenantId);
    return { usageMB: usage };
  }
}
