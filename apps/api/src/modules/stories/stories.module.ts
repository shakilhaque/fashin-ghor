import { Module } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoriesRepository } from './stories.repository';
import { StoriesController } from './stories.controller';

@Module({
  controllers: [StoriesController],
  providers: [StoriesService, StoriesRepository],
  exports: [StoriesService],
})
export class StoriesModule {}
