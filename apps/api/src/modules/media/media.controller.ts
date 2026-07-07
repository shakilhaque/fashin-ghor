import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { MediaService } from './media.service';
import { PresignDto } from './dto/presign.dto';

const STAFF_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Roles(...STAFF_ROLES)
  @Post('presign')
  @ApiOperation({ summary: 'Get a pre-signed S3 upload URL (staff only)' })
  async presign(@Body() dto: PresignDto) {
    const result = await this.mediaService.getPresignedUploadUrl(
      dto.folder ?? 'products',
      dto.filename,
      dto.contentType,
    );
    return { message: 'Upload URL generated', data: result };
  }

  @Roles(...STAFF_ROLES)
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file from S3 (staff only)' })
  async deleteFile(@Query('key') key: string) {
    await this.mediaService.deleteFile(key);
    return { message: 'File deleted' };
  }
}
