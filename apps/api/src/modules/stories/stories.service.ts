import { Injectable, NotFoundException } from '@nestjs/common';
import { StoriesRepository } from './stories.repository';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { ReorderDto } from './dto/reorder.dto';

@Injectable()
export class StoriesService {
  constructor(private readonly repo: StoriesRepository) {}

  listActive() {
    return this.repo.findActive();
  }

  listAll() {
    return this.repo.findAll();
  }

  async getByIdOrThrow(id: string) {
    const story = await this.repo.findById(id);
    if (!story) throw new NotFoundException('Story not found');
    return story;
  }

  create(dto: CreateStoryDto) {
    return this.repo.create({
      title: dto.title,
      coverImage: dto.coverImage,
      subtitle: dto.subtitle,
      isActive: dto.isActive ?? true,
      position: dto.position ?? 0,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      productId: dto.productId ?? null,
    });
  }

  async update(id: string, dto: UpdateStoryDto) {
    await this.getByIdOrThrow(id);
    return this.repo.update(id, {
      title: dto.title,
      coverImage: dto.coverImage,
      subtitle: dto.subtitle !== undefined ? (dto.subtitle ?? null) : undefined,
      isActive: dto.isActive,
      position: dto.position,
      scheduledAt: dto.scheduledAt !== undefined ? (dto.scheduledAt ? new Date(dto.scheduledAt) : null) : undefined,
      expiresAt: dto.expiresAt !== undefined ? (dto.expiresAt ? new Date(dto.expiresAt) : null) : undefined,
      productId: dto.productId !== undefined ? (dto.productId ?? null) : undefined,
    });
  }

  async remove(id: string) {
    await this.getByIdOrThrow(id);
    await this.repo.delete(id);
  }

  async trackView(id: string) {
    const exists = await this.repo.findById(id);
    if (exists) await this.repo.incrementViewCount(id);
  }

  async addSlide(storyId: string, dto: CreateSlideDto) {
    await this.getByIdOrThrow(storyId);
    return this.repo.createSlide({
      storyId,
      mediaUrl: dto.mediaUrl,
      mediaType: dto.mediaType,
      duration: dto.duration ?? 5,
      caption: dto.caption ?? null,
      position: dto.position ?? 0,
      productId: dto.productId ?? null,
    });
  }

  async updateSlide(storyId: string, slideId: string, dto: UpdateSlideDto) {
    await this.getByIdOrThrow(storyId);
    const slide = await this.repo.findSlideById(slideId);
    if (!slide || slide.storyId !== storyId) throw new NotFoundException('Slide not found');
    return this.repo.updateSlide(slideId, {
      mediaUrl: dto.mediaUrl,
      mediaType: dto.mediaType,
      duration: dto.duration,
      caption: dto.caption !== undefined ? (dto.caption ?? null) : undefined,
      position: dto.position,
      productId: dto.productId !== undefined ? (dto.productId ?? null) : undefined,
    });
  }

  async removeSlide(storyId: string, slideId: string) {
    await this.getByIdOrThrow(storyId);
    const slide = await this.repo.findSlideById(slideId);
    if (!slide || slide.storyId !== storyId) throw new NotFoundException('Slide not found');
    await this.repo.deleteSlide(slideId);
  }

  async reorder(dto: ReorderDto) {
    await Promise.all(
      dto.ids.map((id, index) => this.repo.update(id, { position: index })),
    );
  }
}
