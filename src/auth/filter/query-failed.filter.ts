import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 로그로 exception 메시지와 코드 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('QueryFailedError details:', exception);
      console.error('Exception Code:', exception.code); // error code 확인
      console.error('Exception Message:', exception.message); // error message 확인
    }

    let status = 400;
    let message = '데이터베이스 에러 발생!';

    // 추가: 디버깅용으로 QueryFailedError의 세부 정보 출력
    console.error('QueryFailedError details:', exception);

    if (exception.message.includes('duplicate key')) {
      message = '중복 키 에러';
    }
    if (exception.code === '23505') {
      status = 409; // Conflict
      message = '중복된 값이 존재합니다.';
    }
    if (exception.message.includes('foreign key violation')) {
      status = 400;
      message = '외래 키 제약 조건 위반!';
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('QueryFailedError details:', exception); // 개발 환경에서만 디버깅 출력
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
