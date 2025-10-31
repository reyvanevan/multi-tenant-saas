import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  CreateProductVariantDto,
  UpdateProductVariantDto,
  CreatePricingTierDto,
  UpdatePricingTierDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  BulkImportRequestDto,
} from './dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions('products.create.outlet')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid outlet or validation error',
  })
  @ApiResponse({ status: 409, description: 'SKU or barcode already exists' })
  create(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(
      tenantId,
      req.user.userId,
      createProductDto.outletId,
      createProductDto,
    );
  }

  @Get()
  @RequirePermissions('products.read.outlet')
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({
    name: 'outletId',
    required: false,
    description: 'Filter by outlet ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive products',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, SKU, or barcode',
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(
      tenantId,
      outletId,
      categoryId,
      includeInactive,
      search,
    );
  }

  @Get('low-stock')
  @RequirePermissions('products.read.outlet')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiQuery({
    name: 'outletId',
    required: false,
    description: 'Filter by outlet ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Low stock products retrieved successfully',
  })
  getLowStock(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.productsService.getLowStock(tenantId, outletId);
  }

  @Get(':id')
  @RequirePermissions('products.read.outlet')
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('products.update.outlet')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'SKU or barcode already exists' })
  update(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(
      tenantId,
      req.user.userId,
      id,
      updateProductDto,
    );
  }

  @Delete(':id')
  @RequirePermissions('products.delete.outlet')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete product with transactions',
  })
  remove(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.remove(tenantId, req.user.userId, id);
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('products.update.outlet')
  @ApiOperation({ summary: 'Toggle product active status' })
  @ApiResponse({
    status: 200,
    description: 'Product status toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  toggleActive(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.toggleActive(tenantId, id);
  }

  @Patch(':id/adjust-stock')
  @RequirePermissions('products.update.outlet')
  @ApiOperation({ summary: 'Adjust product stock' })
  @ApiQuery({
    name: 'quantity',
    type: Number,
    description: 'Positive to add stock, negative to reduce',
  })
  @ApiQuery({
    name: 'reason',
    required: false,
    description: 'Reason for stock adjustment',
  })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 400,
    description: 'Insufficient stock or tracking disabled',
  })
  adjustStock(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('quantity', ParseIntPipe) quantity: number,
    @Query('reason') reason = 'Manual adjustment',
  ) {
    return this.productsService.adjustStock(tenantId, id, quantity, reason);
  }

  // ============================================================================
  // PRODUCT VARIANTS
  // ============================================================================

  @Post(':productId/variants')
  @RequirePermissions('products.create.outlet')
  @ApiOperation({ summary: 'Create product variant' })
  @ApiResponse({ status: 201, description: 'Variant created successfully' })
  createVariant(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(tenantId, req.user.userId, productId, dto);
  }

  @Get(':productId/variants')
  @RequirePermissions('products.read.outlet')
  @ApiOperation({ summary: 'Get product variants' })
  @ApiResponse({ status: 200, description: 'Variants retrieved successfully' })
  getVariants(
    @TenantId() tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productsService.getVariants(tenantId, productId);
  }

  @Patch('variants/:variantId')
  @RequirePermissions('products.update.outlet')
  @ApiOperation({ summary: 'Update product variant' })
  @ApiResponse({ status: 200, description: 'Variant updated successfully' })
  updateVariant(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(tenantId, req.user.userId, variantId, dto);
  }

  @Delete('variants/:variantId')
  @RequirePermissions('products.delete.outlet')
  @ApiOperation({ summary: 'Delete product variant' })
  @ApiResponse({ status: 200, description: 'Variant deactivated successfully' })
  deleteVariant(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.productsService.deleteVariant(tenantId, req.user.userId, variantId);
  }

  // ============================================================================
  // PRICING TIERS
  // ============================================================================

  @Post(':productId/pricing-tiers')
  @RequirePermissions('products.create.outlet')
  @ApiOperation({ summary: 'Create pricing tier' })
  @ApiResponse({ status: 201, description: 'Pricing tier created successfully' })
  createPricingTier(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreatePricingTierDto,
  ) {
    return this.productsService.createPricingTier(tenantId, req.user.userId, productId, dto);
  }

  @Get(':productId/pricing-tiers')
  @RequirePermissions('products.read.outlet')
  @ApiOperation({ summary: 'Get pricing tiers' })
  @ApiResponse({ status: 200, description: 'Pricing tiers retrieved successfully' })
  getPricingTiers(
    @TenantId() tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productsService.getPricingTiers(tenantId, productId);
  }

  @Get(':productId/price')
  @RequirePermissions('products.read.outlet')
  @ApiOperation({ summary: 'Get price for quantity (with tier pricing)' })
  @ApiQuery({ name: 'quantity', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Price calculated successfully' })
  getPriceForQuantity(
    @TenantId() tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.productsService.getPriceForQuantity(tenantId, productId, quantity);
  }

  @Patch('pricing-tiers/:tierId')
  @RequirePermissions('products.update.outlet')
  @ApiOperation({ summary: 'Update pricing tier' })
  @ApiResponse({ status: 200, description: 'Pricing tier updated successfully' })
  updatePricingTier(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('tierId', ParseUUIDPipe) tierId: string,
    @Body() dto: UpdatePricingTierDto,
  ) {
    return this.productsService.updatePricingTier(tenantId, req.user.userId, tierId, dto);
  }

  @Delete('pricing-tiers/:tierId')
  @RequirePermissions('products.delete.outlet')
  @ApiOperation({ summary: 'Delete pricing tier' })
  @ApiResponse({ status: 200, description: 'Pricing tier deactivated successfully' })
  deletePricingTier(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('tierId', ParseUUIDPipe) tierId: string,
  ) {
    return this.productsService.deletePricingTier(tenantId, req.user.userId, tierId);
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  @Post('categories')
  @RequirePermissions('products.create.tenant')
  @ApiOperation({ summary: 'Create product category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  createCategory(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.productsService.createCategory(tenantId, req.user.userId, dto);
  }

  @Get('categories')
  @RequirePermissions('products.read.tenant')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  getCategories(
    @TenantId() tenantId: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ) {
    return this.productsService.getCategories(tenantId, includeInactive);
  }

  @Get('categories/:categoryId')
  @RequirePermissions('products.read.tenant')
  @ApiOperation({ summary: 'Get single category' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  getCategory(
    @TenantId() tenantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.productsService.getCategory(tenantId, categoryId);
  }

  @Patch('categories/:categoryId')
  @RequirePermissions('products.update.tenant')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  updateCategory(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.productsService.updateCategory(tenantId, req.user.userId, categoryId, dto);
  }

  @Delete('categories/:categoryId')
  @RequirePermissions('products.delete.tenant')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Category has products or subcategories' })
  deleteCategory(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.productsService.deleteCategory(tenantId, req.user.userId, categoryId);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  @Post('bulk-import')
  @RequirePermissions('products.create.outlet')
  @ApiOperation({ summary: 'Bulk import products' })
  @ApiResponse({ status: 201, description: 'Import completed' })
  bulkImport(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Query('outletId', ParseUUIDPipe) outletId: string,
    @Body() dto: BulkImportRequestDto,
  ) {
    return this.productsService.bulkImportProducts(
      tenantId,
      req.user.userId,
      outletId,
      dto.products,
    );
  }

  // ============================================================================
  // CSV IMPORT
  // ============================================================================

  @Get('import/template')
  @RequirePermissions('products.view.outlet')
  @ApiOperation({ summary: 'Download CSV import template' })
  @ApiResponse({ status: 200, description: 'Template downloaded' })
  async getImportTemplate() {
    const csv = await this.productsService.generateImportTemplate();
    return {
      content: csv,
      filename: 'product-import-template.csv',
    };
  }

  @Post('import')
  @RequirePermissions('products.create.outlet')
  @ApiOperation({ summary: 'Import products from CSV' })
  @ApiResponse({ status: 201, description: 'Import completed' })
  @ApiResponse({ status: 400, description: 'CSV parsing or validation failed' })
  async importProducts(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Query('outletId', ParseUUIDPipe) outletId: string,
    @Body() body: { csvContent: string; updateExisting?: boolean; skipErrors?: boolean; batchSize?: number },
  ) {
    return this.productsService.bulkImport(
      tenantId,
      outletId,
      req.user.userId,
      body.csvContent,
      {
        updateExisting: body.updateExisting,
        skipErrors: body.skipErrors,
        batchSize: body.batchSize,
      },
    );
  }

  @Post('import/preview')
  @RequirePermissions('products.view.outlet')
  @ApiOperation({ summary: 'Preview CSV import without saving' })
  @ApiResponse({ status: 200, description: 'Preview generated' })
  @ApiResponse({ status: 400, description: 'CSV parsing failed' })
  async previewImport(
    @TenantId() tenantId: string,
    @Query('outletId', ParseUUIDPipe) outletId: string,
    @Body() body: { csvContent: string },
  ) {
    const Papa = require('papaparse');
    
    const { data, errors } = Papa.parse(body.csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().replace('*', ''),
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Validate basic structure
    const validationErrors: any[] = [];
    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;

      if (!row.sku || !row.name || !row.costPrice || !row.sellingPrice || !row.minStock) {
        validationErrors.push({
          row: rowNumber,
          field: 'required',
          value: row,
          message: 'Missing required fields (sku, name, costPrice, sellingPrice, minStock)',
        });
      }

      // Validate numeric fields
      if (row.costPrice && isNaN(Number(row.costPrice))) {
        validationErrors.push({
          row: rowNumber,
          field: 'costPrice',
          value: row.costPrice,
          message: 'Cost price must be a number',
        });
      }

      if (row.sellingPrice && isNaN(Number(row.sellingPrice))) {
        validationErrors.push({
          row: rowNumber,
          field: 'sellingPrice',
          value: row.sellingPrice,
          message: 'Selling price must be a number',
        });
      }

      if (row.minStock && isNaN(Number(row.minStock))) {
        validationErrors.push({
          row: rowNumber,
          field: 'minStock',
          value: row.minStock,
          message: 'Min stock must be a number',
        });
      }
    }

    return {
      success: validationErrors.length === 0,
      totalRows: data.length,
      validRows: data.length - validationErrors.length,
      errors: validationErrors,
      preview: data.slice(0, 10), // Show first 10 rows
    };
  }
}
