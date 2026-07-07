import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BlogStatus } from '@prisma/client';
import { BlogRepository } from './blog.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class BlogService {
  constructor(private readonly repo: BlogRepository) {}

  // ── Categories ───────────────────────────────────────────────────────────

  async getCategories() {
    return this.repo.findAllCategories();
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = dto.slug ? toSlug(dto.slug) : toSlug(dto.name);
    const existing = await this.repo.findCategoryBySlug(slug);
    if (existing) throw new BadRequestException(`Category slug "${slug}" already exists`);
    return this.repo.createCategory(dto, slug);
  }

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>) {
    const slug = dto.slug ? toSlug(dto.slug) : dto.name ? toSlug(dto.name) : undefined;
    return this.repo.updateCategory(id, { ...(dto.name && { name: dto.name }), ...(slug && { slug }) });
  }

  async deleteCategory(id: string) {
    try {
      await this.repo.deleteCategory(id);
    } catch {
      throw new BadRequestException('Cannot delete category with existing posts');
    }
  }

  // ── Posts ────────────────────────────────────────────────────────────────

  async getPublishedPosts(opts: { page: number; limit: number; categorySlug?: string; tag?: string; search?: string }) {
    return this.repo.findPublished(opts);
  }

  async getPostBySlug(slug: string) {
    const post = await this.repo.findBySlugPublic(slug);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async adminGetPosts(opts: { page: number; limit: number; status?: BlogStatus; search?: string }) {
    return this.repo.findAllAdmin(opts);
  }

  async adminGetPost(id: string) {
    const post = await this.repo.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async adminGetStats() {
    return this.repo.getAdminStats();
  }

  async createPost(authorId: string, dto: CreatePostDto) {
    const slug = dto.slug ? toSlug(dto.slug) : toSlug(dto.title);
    const existing = await this.repo.findBySlug(slug);
    if (existing) throw new BadRequestException(`Post slug "${slug}" already exists`);
    return this.repo.create(authorId, dto, slug);
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    const post = await this.repo.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    let slug: string | undefined;
    if (dto.slug) {
      slug = toSlug(dto.slug);
      const existing = await this.repo.findBySlug(slug);
      if (existing && existing.id !== id) throw new BadRequestException(`Slug "${slug}" already in use`);
    } else if (dto.title && dto.title !== post.title) {
      // Auto-update slug when title changes (only if slug wasn't custom set)
      slug = toSlug(dto.title);
      const existing = await this.repo.findBySlug(slug);
      if (existing && existing.id !== id) slug = `${toSlug(dto.title)}-${Date.now()}`;
    }

    return this.repo.update(id, dto, slug);
  }

  async deletePost(id: string) {
    const post = await this.repo.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    return this.repo.delete(id);
  }
}
