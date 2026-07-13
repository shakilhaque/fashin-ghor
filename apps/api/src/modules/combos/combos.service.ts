import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CombosRepository, ComboWithItems } from './combos.repository';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { ComboItemInputDto } from './dto/combo-item-input.dto';
import { ProductsService } from '../products/products.service';
import { slugify } from '../../common/utils/slugify.util';

@Injectable()
export class CombosService {
  constructor(
    private readonly combosRepository: CombosRepository,
    private readonly productsService: ProductsService,
  ) {}

  getActive(): Promise<ComboWithItems[]> {
    return this.combosRepository.findActive();
  }

  getAll(): Promise<ComboWithItems[]> {
    return this.combosRepository.findAll();
  }

  async getBySlug(slug: string): Promise<ComboWithItems> {
    const combo = await this.combosRepository.findBySlug(slug);
    if (!combo || !combo.isActive) {
      throw new NotFoundException('Combo not found');
    }
    return combo;
  }

  async getByIdOrThrow(id: string): Promise<ComboWithItems> {
    const combo = await this.combosRepository.findById(id);
    if (!combo) {
      throw new NotFoundException('Combo not found');
    }
    return combo;
  }

  async create(dto: CreateComboDto): Promise<ComboWithItems> {
    await this.assertItemsValid(dto.items);

    const slug = dto.slug ? await this.assertSlugAvailable(dto.slug) : await this.generateUniqueSlug(dto.name);

    const data: Prisma.ComboCreateInput = {
      name: dto.name,
      slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      price: dto.price,
      comparePrice: dto.comparePrice,
      discount: dto.discount ?? this.computeDiscountPct(dto.price, dto.comparePrice),
      isActive: dto.isActive,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
    };

    return this.combosRepository.create(data, this.normalizeItems(dto.items));
  }

  async update(id: string, dto: UpdateComboDto): Promise<ComboWithItems> {
    const existing = await this.getByIdOrThrow(id);

    if (dto.items) {
      await this.assertItemsValid(dto.items);
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.assertSlugAvailable(dto.slug, id);
    }

    const data: Prisma.ComboUpdateInput = {
      name: dto.name,
      slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      price: dto.price,
      comparePrice: dto.comparePrice,
      discount:
        dto.discount ??
        (dto.price !== undefined || dto.comparePrice !== undefined
          ? this.computeDiscountPct(
              dto.price ?? existing.price,
              dto.comparePrice !== undefined ? dto.comparePrice : existing.comparePrice,
            )
          : undefined),
      isActive: dto.isActive,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
    };

    return this.combosRepository.update(id, data, dto.items ? this.normalizeItems(dto.items) : undefined);
  }

  async remove(id: string): Promise<void> {
    await this.getByIdOrThrow(id);
    await this.combosRepository.delete(id);
  }

  private normalizeItems(items: ComboItemInputDto[]): { productId: string; quantity: number }[] {
    return items.map((item) => ({ productId: item.productId, quantity: item.quantity ?? 1 }));
  }

  private async assertItemsValid(items: ComboItemInputDto[]): Promise<void> {
    const productIds = items.map((item) => item.productId);
    const duplicate = productIds.find((id, index) => productIds.indexOf(id) !== index);
    if (duplicate) {
      throw new BadRequestException('Each product can only appear once in a combo');
    }

    for (const productId of productIds) {
      await this.productsService.getByIdOrThrow(productId);
    }
  }

  private computeDiscountPct(price?: number, comparePrice?: number | null): number {
    if (!comparePrice || price === undefined || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let counter = 2;

    while (await this.combosRepository.findBySlug(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }

    return candidate;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string): Promise<string> {
    const normalized = slugify(slug);
    const existing = await this.combosRepository.findBySlug(normalized);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException('This slug is already in use');
    }
    return normalized;
  }
}
