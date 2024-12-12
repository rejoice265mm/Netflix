import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { response } from 'express';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // GET / movie 같은 key를 만든다.
    const key = `${request.method}-${request.path}`;

    if (this.cache.has(key)) {
      // 이미 사용한 cache 인지 확인한다.
      return of(this.cache.get(key));
    }

    return next.handle().pipe(tap((response) => this.cache.set(key, response)));
  }
}
