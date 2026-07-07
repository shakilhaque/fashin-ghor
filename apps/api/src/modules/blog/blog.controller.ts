import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { BlogStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

const CONTENT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@Controller('blog')
export class BlogController {
  constructor(private readonly service: BlogService) {}

  // ── Public ───────────────────────────────────────────────────────────────

  @Public()
  @Get('categories')
  async getCategories() {
    const categories = await this.service.getCategories();
    return { message: 'Categories retrieved', data: { categories } };
  }

  @Public()
  @Get('posts')
  async getPosts(
    @Query('page') page = '1',
    @Query('limit') limit = '9',
    @Query('category') categorySlug?: string,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.service.getPublishedPosts({
      page: Number(page),
      limit: Number(limit),
      categorySlug,
      tag,
      search,
    });
    return {
      message: 'Posts retrieved',
      data: { posts: result.posts },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Public()
  @Get('posts/:slug')
  async getPost(@Param('slug') slug: string) {
    const post = await this.service.getPostBySlug(slug);
    return { message: 'Post retrieved', data: { post } };
  }

  // ── Admin — Categories ────────────────────────────────────────────────────

  @Post('categories')
  @Roles(...CONTENT_ROLES)
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.service.createCategory(dto);
    return { message: 'Category created', data: { category } };
  }

  @Patch('categories/:id')
  @Roles(...CONTENT_ROLES)
  async updateCategory(@Param('id') id: string, @Body() dto: CreateCategoryDto) {
    const category = await this.service.updateCategory(id, dto);
    return { message: 'Category updated', data: { category } };
  }

  @Delete('categories/:id')
  @Roles(...CONTENT_ROLES)
  async deleteCategory(@Param('id') id: string) {
    await this.service.deleteCategory(id);
    return { message: 'Category deleted', data: null };
  }

  // ── Admin — Posts ─────────────────────────────────────────────────────────

  @Get('admin/posts')
  @Roles(...CONTENT_ROLES)
  async adminGetPosts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: BlogStatus,
    @Query('search') search?: string,
  ) {
    const result = await this.service.adminGetPosts({
      page: Number(page),
      limit: Number(limit),
      status,
      search,
    });
    return {
      message: 'Posts retrieved',
      data: { posts: result.posts },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Get('admin/stats')
  @Roles(...CONTENT_ROLES)
  async adminGetStats() {
    const stats = await this.service.adminGetStats();
    return { message: 'Blog stats retrieved', data: { stats } };
  }

  @Get('admin/posts/:id')
  @Roles(...CONTENT_ROLES)
  async adminGetPost(@Param('id') id: string) {
    const post = await this.service.adminGetPost(id);
    return { message: 'Post retrieved', data: { post } };
  }

  @Post('posts')
  @Roles(...CONTENT_ROLES)
  async createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    const post = await this.service.createPost(user.id, dto);
    return { message: 'Post created', data: { post } };
  }

  @Patch('posts/:id')
  @Roles(...CONTENT_ROLES)
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    const post = await this.service.updatePost(id, dto);
    return { message: 'Post updated', data: { post } };
  }

  @Delete('posts/:id')
  @Roles(...CONTENT_ROLES)
  async deletePost(@Param('id') id: string) {
    await this.service.deletePost(id);
    return { message: 'Post deleted', data: null };
  }
}
