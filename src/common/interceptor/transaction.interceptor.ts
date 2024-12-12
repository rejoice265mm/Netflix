import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const qr = this.dataSource.createQueryRunner();

    // 트랜잭션 시작
    await qr.connect();
    await qr.startTransaction();

    // request 객체에 queryRunner를 넣어서 서비스에서 사용할 수 있게 한다.
    req.queryRunner = qr;

    return next.handle().pipe(
      catchError(async (e) => {
        // 예외 발생 시 트랜잭션 롤백
        await qr.rollbackTransaction();
        await qr.release();
        throw e; // 예외를 다시 던져서 상위 레벨에서 처리되도록 한다.
      }),
      tap(async () => {
        // 예외가 없으면 트랜잭션 커밋
        await qr.commitTransaction();
        await qr.release();
      }),
    );
  }
}
