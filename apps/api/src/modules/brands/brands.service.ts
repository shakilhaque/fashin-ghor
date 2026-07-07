import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Brand } from '@prisma/client';
import { BrandsRepository } from './brands.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { slugify } from '../../common/utils/slugify.util';

@Injectable()
export class BrandsService {
  constructor(private readonly brandsRepository: BrandsRepository) {}

  listActive(): Promise<Brand[]> {
    return this.brandsRepository.findAllActive();
  }

  listAll(): Promise<Brand[]> {
    return this.brandsRepository.findAll();
  }

  async getBySlug(slug: string): Promise<Brand> {
    const brand = await this.brandsRepository.findBySlug(slug);
    if (!brand || !brand.isActive) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async getByIdOrThrow(id: string): Promise<Brand> {
    const brand = await this.brandsRepository.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const slug = dto.slug ? await this.assertSlugAvailable(dto.slug) : await this.generateUniqueSlug(dto.name);

    return this.brandsRepository.create({
      name: dto.name,
      slug,
      logoUrl: dto.logoUrl,
      description: dto.description,
      country: dto.country,
      website: dto.website,
      isActive: dto.isActive,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
    });
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const existing = await this.getByIdOrThrow(id);

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.assertSlugAvailable(dto.slug, id);
    }

    return this.brandsRepository.update(id, {
      name: dto.name,
      slug,
      logoUrl: dto.logoUrl,
      description: dto.description,
      country: dto.country,
      website: dto.website,
      isActive: dto.isActive,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
    });
  }

  async remove(id: string): Promise<void> {
    await this.getByIdOrThrow(id);

    const productCount = await this.brandsRepository.countProducts(id);
    if (productCount > 0) {
      throw new BadRequestException(
        'This brand still has products assigned to it. Reassign or delete them before deleting this brand.',
      );
    }

    await this.brandsRepository.delete(id);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let counter = 2;

    while (await this.brandsRepository.findBySlug(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }

    return candidate;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string): Promise<string> {
    const normalized = slugify(slug);
    const existing = await this.brandsRepository.findBySlug(normalized);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException('This slug is already in use');
    }
    return normalized;
  }
}
