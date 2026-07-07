import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

@Public()
@UseGuards(OptionalJwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  async getCart(
    @CurrentUser() user: AuthenticatedUser | null,
    @Headers('x-session-id') sessionId?: string,
  ) {
    const cart = await this.service.getCart(user?.id, sessionId);
    return { message: 'Cart retrieved', data: { cart } };
  }

  @Post('items')
  async addItem(
    @Body() dto: AddToCartDto,
    @CurrentUser() user: AuthenticatedUser | null,
    @Headers('x-session-id') sessionId?: string,
  ) {
    const cart = await this.service.addItem(dto, user?.id, sessionId);
    return { message: 'Item added to cart', data: { cart } };
  }

  @Patch('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: AuthenticatedUser | null,
    @Headers('x-session-id') sessionId?: string,
  ) {
    const cart = await this.service.updateItem(itemId, dto, user?.id, sessionId);
    return { message: 'Cart item updated', data: { cart } };
  }

  @Delete('items/:itemId')
  async removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser | null,
    @Headers('x-session-id') sessionId?: string,
  ) {
    const cart = await this.service.removeItem(itemId, user?.id, sessionId);
    return { message: 'Item removed from cart', data: { cart } };
  }

  @Delete()
  async clearCart(
    @CurrentUser() user: AuthenticatedUser | null,
    @Headers('x-session-id') sessionId?: string,
  ) {
    await this.service.clearCart(user?.id, sessionId);
    return { message: 'Cart cleared', data: { cart: { id: null, items: [], subtotal: 0, itemCount: 0 } } };
  }

  @Post('merge')
  async mergeCart(
    @CurrentUser() user: AuthenticatedUser | null,
    @Headers('x-session-id') sessionId?: string,
  ) {
    if (!user || !sessionId) {
      return { message: 'Nothing to merge', data: { cart: await this.service.getCart(user?.id, sessionId) } };
    }
    const cart = await this.service.mergeGuestCart(user.id, sessionId);
    return { message: 'Cart merged', data: { cart } };
  }
}
