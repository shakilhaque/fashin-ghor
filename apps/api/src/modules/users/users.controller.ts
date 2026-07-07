import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { toSafeUser } from './users.mapper';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;
const STAFF_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT] as const;

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  async getMyProfile(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.getByIdOrThrow(authUser.id);
    return { message: 'Profile retrieved', data: { user: toSafeUser(user) } };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  async updateMyProfile(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(authUser.id, dto);
    return { message: 'Profile updated', data: { user: toSafeUser(user) } };
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the current user password' })
  async changeMyPassword(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(authUser.id, dto);
    return { message: 'Password changed successfully' };
  }

  @Roles(...STAFF_ROLES)
  @Get()
  @ApiOperation({ summary: 'List users (staff only)' })
  async listUsers(@Query() query: UserQueryDto) {
    const { data, total } = await this.usersService.listUsers(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return {
      message: 'Users retrieved',
      data: data.map(toSafeUser),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  @Roles(...STAFF_ROLES)
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id (staff only)' })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.getByIdOrThrow(id);
    return { message: 'User retrieved', data: { user: toSafeUser(user) } };
  }

  @Roles(...ADMIN_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (admin only)' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() authUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.adminUpdateUser(id, dto, authUser.id);
    return { message: 'User updated', data: { user: toSafeUser(user) } };
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user (admin only)' })
  async deactivateUser(@Param('id') id: string, @CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.deactivateUser(id, authUser.id);
    return { message: 'User deactivated', data: { user: toSafeUser(user) } };
  }
}
