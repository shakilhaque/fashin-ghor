import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { ReorderDto } from './dto/reorder.dto';

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get active stories (public)' })
  async listActive() {
    const stories = await this.storiesService.listActive();
    return { message: 'Stories retrieved', data: { stories } };
  }

  @Roles(...ADMIN_ROLES)
  @Get('admin/all')
  @ApiOperation({ summary: 'Get all stories including inactive (admin)' })
  async listAll() {
    const stories = await this.storiesService.listAll();
    return { message: 'Stories retrieved', data: { stories } };
  }

  @Roles(...ADMIN_ROLES)
  @Post()
  @ApiOperation({ summary: 'Create a story (admin)' })
  async create(@Body() dto: CreateStoryDto) {
    const story = await this.storiesService.create(dto);
    return { message: 'Story created', data: { story } };
  }

  @Roles(...ADMIN_ROLES)
  @Patch('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder stories (admin)' })
  async reorder(@Body() dto: ReorderDto) {
    await this.storiesService.reorder(dto);
    return { message: 'Stories reordered' };
  }

  @Roles(...ADMIN_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a story (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateStoryDto) {
    const story = await this.storiesService.update(id, dto);
    return { message: 'Story updated', data: { story } };
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a story (admin)' })
  async remove(@Param('id') id: string) {
    await this.storiesService.remove(id);
    return { message: 'Story deleted' };
  }

  @Public()
  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track a story view (public)' })
  async trackView(@Param('id') id: string) {
    await this.storiesService.trackView(id);
    return { message: 'View tracked' };
  }

  @Roles(...ADMIN_ROLES)
  @Post(':id/slides')
  @ApiOperation({ summary: 'Add a slide to a story (admin)' })
  async addSlide(@Param('id') id: string, @Body() dto: CreateSlideDto) {
    const slide = await this.storiesService.addSlide(id, dto);
    return { message: 'Slide added', data: { slide } };
  }

  @Roles(...ADMIN_ROLES)
  @Patch(':id/slides/:slideId')
  @ApiOperation({ summary: 'Update a slide (admin)' })
  async updateSlide(
    @Param('id') id: string,
    @Param('slideId') slideId: string,
    @Body() dto: UpdateSlideDto,
  ) {
    const slide = await this.storiesService.updateSlide(id, slideId, dto);
    return { message: 'Slide updated', data: { slide } };
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id/slides/:slideId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a slide (admin)' })
  async removeSlide(
    @Param('id') id: string,
    @Param('slideId') slideId: string,
  ) {
    await this.storiesService.removeSlide(id, slideId);
    return { message: 'Slide deleted' };
  }
}
