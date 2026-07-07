import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from '../../common/utils/slugify.util';

export type CategoryNode = Category & { children: CategoryNode[] };

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async getTree(): Promise<CategoryNode[]> {
    const categories = await this.categoriesRepository.findAllActive();
    return this.buildTree(categories);
  }

  async getAdminTree(): Promise<CategoryNode[]> {
    const categories = await this.categoriesRepository.findAll();
    return this.buildTree(categories);
  }

  async getBySlug(slug: string): Promise<Category & { parent: Category | null; children: Category[] }> {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    const all = await this.categoriesRepository.findAllActive();
    const parent = category.parentId ? (all.find((c) => c.id === category.parentId) ?? null) : null;
    const children = all.filter((c) => c.parentId === category.id);

    return { ...category, parent, children };
  }

  async getByIdOrThrow(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    if (dto.parentId) {
      await this.getByIdOrThrow(dto.parentId);
    }

    const slug = dto.slug ? await this.assertSlugAvailable(dto.slug) : await this.generateUniqueSlug(dto.name);

    return this.categoriesRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const existing = await this.getByIdOrThrow(id);

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.assertSlugAvailable(dto.slug, id);
    }

    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      if (dto.parentId) {
        await this.getByIdOrThrow(dto.parentId);
        await this.assertNoCircularReference(id, dto.parentId);
      }
    }

    return this.categoriesRepository.update(id, {
      name: dto.name,
      slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      parent:
        dto.parentId !== undefined
          ? dto.parentId
            ? { connect: { id: dto.parentId } }
            : { disconnect: true }
          : undefined,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
    });
  }

  async remove(id: string): Promise<void> {
    await this.getByIdOrThrow(id);

    const childCount = await this.categoriesRepository.countChildren(id);
    if (childCount > 0) {
      throw new BadRequestException(
        'This category has subcategories. Reassign or delete them before deleting this category.',
      );
    }

    await this.categoriesRepository.delete(id);
  }

  private buildTree(categories: Category[]): CategoryNode[] {
    const byId = new Map<string, CategoryNode>();
    categories.forEach((category) => byId.set(category.id, { ...category, children: [] }));

    const roots: CategoryNode[] = [];
    categories.forEach((category) => {
      const node = byId.get(category.id)!;
      if (category.parentId && byId.has(category.parentId)) {
        byId.get(category.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let counter = 2;

    while (await this.categoriesRepository.findBySlug(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }

    return candidate;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string): Promise<string> {
    const normalized = slugify(slug);
    const existing = await this.categoriesRepository.findBySlug(normalized);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException('This slug is already in use');
    }
    return normalized;
  }

  private async assertNoCircularReference(categoryId: string, newParentId: string): Promise<void> {
    if (newParentId === categoryId) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const all = await this.categoriesRepository.findAll();
    const childrenByParent = new Map<string, string[]>();
    for (const category of all) {
      if (category.parentId) {
        const siblings = childrenByParent.get(category.parentId) ?? [];
        siblings.push(category.id);
        childrenByParent.set(category.parentId, siblings);
      }
    }

    const stack = [...(childrenByParent.get(categoryId) ?? [])];
    while (stack.length > 0) {
      const current = stack.pop() as string;
      if (current === newParentId) {
        throw new BadRequestException('Cannot set a descendant category as the parent');
      }
      stack.push(...(childrenByParent.get(current) ?? []));
    }
  }
}
