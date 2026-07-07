import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'success' in result) {
          return result as ApiResponse<T>;
        }
        if (result && typeof result === 'object' && 'message' in result) {
          const { message, data, meta } = result as {
            message: string;
            data?: T;
            meta?: ApiResponse<T>['meta'];
          };
          return { success: true, message, data: data ?? null, meta: meta ?? null };
        }
        return {
          success: true,
          message: 'Request successful',
          data: (result as T) ?? null,
          meta: null,
        };
      }),
    );
  }
}
