import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Return user if JWT valid; null if not (no 401 for guests)
  handleRequest<T>(_err: any, user: any): T {
    return (user || null) as T;
  }
}
