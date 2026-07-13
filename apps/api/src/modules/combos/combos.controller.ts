import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CombosService } from './combos.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';

const CATALOG_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@ApiTags('Combos')
@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active combos' })
  async getActive() {
    const combos = await this.combosService.getActive();
    return { message: 'Combos retrieved', data: { combos } };
  }

  @Roles(...CATALOG_ROLES)
  @Get('admin/all')
  @ApiOperation({ summary: 'List all combos, including inactive (staff only)' })
  async getAll() {
    const combos = await this.combosService.getAll();
    return { message: 'Combos retrieved', data: { combos } };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a combo by slug' })
  async getBySlug(@Param('slug') slug: string) {
    const combo = await this.combosService.getBySlug(slug);
    return { message: 'Combo retrieved', data: { combo } };
  }

  @Roles(...CATALOG_ROLES)
  @Post()
  @ApiOperation({ summary: 'Create a combo (staff only)' })
  async create(@Body() dto: CreateComboDto) {
    const combo = await this.combosService.create(dto);
    return { message: 'Combo created', data: { combo } };
  }

  @Roles(...CATALOG_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a combo (staff only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateComboDto) {
    const combo = await this.combosService.update(id, dto);
    return { message: 'Combo updated', data: { combo } };
  }

  @Roles(...CATALOG_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a combo (staff only)' })
  async remove(@Param('id') id: string) {
    await this.combosService.remove(id);
    return { message: 'Combo deleted' };
  }
}
