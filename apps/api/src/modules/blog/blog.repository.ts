import { Injectable } from '@nestjs/common';
import { BlogStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

const AUTHOR_SELECT = { id: true, name: true, avatar: true };
const CATEGORY_SELECT = { id: true, name: true, slug: true };

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categories ───────────────────────────────────────────────────────────

  async findAllCategories() {
    return this.prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryBySlug(slug: string) {
    return this.prisma.blogCategory.findUnique({ where: { slug } });
  }

  async createCategory(dto: CreateCategoryDto, slug: string) {
    return this.prisma.blogCategory.create({ data: { name: dto.name, slug } });
  }

  async updateCategory(id: string, data: Partial<{ name: string; slug: string }>) {
    return this.prisma.blogCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    return this.prisma.blogCategory.delete({ where: { id } });
  }

  // ── Posts ────────────────────────────────────────────────────────────────

  async findPublished(opts: {
    page: number;
    limit: number;
    categorySlug?: string;
    tag?: string;
    search?: string;
  }) {
    const { page, limit, categorySlug, tag, search } = opts;
    const where = {
      status: BlogStatus.PUBLISHED,
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(tag && { tags: { has: tag } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { excerpt: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          author: { select: AUTHOR_SELECT },
          category: { select: CATEGORY_SELECT },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        omit: { content: true }, // omit heavy content from list
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlugPublic(slug: string) {
    return this.prisma.blogPost.findFirst({
      where: { slug, status: BlogStatus.PUBLISHED },
      include: {
        author: { select: AUTHOR_SELECT },
        category: { select: CATEGORY_SELECT },
      },
    });
  }

  async findAllAdmin(opts: {
    page: number;
    limit: number;
    status?: BlogStatus;
    search?: string;
  }) {
    const { page, limit, status, search } = opts;
    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { excerpt: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          author: { select: AUTHOR_SELECT },
          category: { select: CATEGORY_SELECT },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        omit: { content: true },
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: AUTHOR_SELECT },
        category: { select: CATEGORY_SELECT },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.blogPost.findUnique({ where: { slug } });
  }

  async create(authorId: string, dto: CreatePostDto, slug: string) {
    const isPublishing = dto.status === BlogStatus.PUBLISHED;
    return this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImage: dto.coverImage,
        authorId,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
        status: dto.status ?? BlogStatus.DRAFT,
        metaTitle: dto.metaTitle,
        metaDesc: dto.metaDesc,
        publishedAt: isPublishing ? new Date() : null,
      },
      include: {
        author: { select: AUTHOR_SELECT },
        category: { select: CATEGORY_SELECT },
      },
    });
  }

  async update(id: string, dto: UpdatePostDto, slug?: string) {
    const existing = await this.findById(id);
    const wasPublished = existing?.status === BlogStatus.PUBLISHED;
    const isNowPublishing = dto.status === BlogStatus.PUBLISHED && !wasPublished;

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(slug && { slug }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDesc !== undefined && { metaDesc: dto.metaDesc }),
        ...(isNowPublishing && { publishedAt: new Date() }),
      },
      include: {
        author: { select: AUTHOR_SELECT },
        category: { select: CATEGORY_SELECT },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.blogPost.delete({ where: { id } });
  }

  async getAdminStats() {
    const [draft, published, archived, total] = await Promise.all([
      this.prisma.blogPost.count({ where: { status: BlogStatus.DRAFT } }),
      this.prisma.blogPost.count({ where: { status: BlogStatus.PUBLISHED } }),
      this.prisma.blogPost.count({ where: { status: BlogStatus.ARCHIVED } }),
      this.prisma.blogPost.count(),
    ]);
    return { draft, published, archived, total };
  }
}
