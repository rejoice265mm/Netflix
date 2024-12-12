import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { Cron, ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as pm } from 'fs';
import { readdir } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { DefaultLogger } from './logger/default.logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name);
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly scheduleeRegistry: SchedulerRegistry,
    //private readonly logger: DefaultLogger,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  //@Cron('*/5 * * * * *')
  logEverySecond() {
    //로그 레벨 중요도 순서
    this.logger.fatal('fatal 레벨 로그', null, TasksService.name); //지금 당장 해결해야한 문제
    this.logger.error('error 레벨 로그', null, TasksService.name); //에러 표시
    this.logger.warn('warn 레벨 로그', TasksService.name); //일어나면 안돼지만 실행에 문제가 안되지는 않음
    this.logger.log('log 레벨 로그', TasksService.name); //정보성
    this.logger.debug('debug 레벨 로그', TasksService.name); //개발환경에서
    this.logger.verbose('verbose 레벨 로그', TasksService.name); //진짜 중요하지 않은 내용
  }

  //@Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name;

      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));

        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();

        return now - date > aDayInMilSec;
      } catch (error) {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTargets.map((x) =>
        pm.unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );
  }

  //@Cron('0 * * * * *')
  async calcilateMovieLikCounts() {
    console.log('run');
    await this.movieRepository.query(
      `UPDATE movie m
        SET "likeCount" = (
        SELECT count(*) FROM movie_user_like mul
        WHERE m.id = mul."movieId" AND mul."isLike" = true)`,
    );
    await this.movieRepository.query(
      `UPDATE movie m
        SET "dislikeCount" = (
        SELECT count(*) FROM movie_user_like mul
        WHERE m.id = mul."movieId" AND mul."isLike" = false)`,
    );
  }

  //@Cron('* * * * * *', { name: 'printer' })
  printer() {
    console.log('print ever seconds');
  }

  //@Cron('*/5 * * * * *')
  stopper() {
    console.log('stopper run');
    const job = this.scheduleeRegistry.getCronJob('printer');

    if (job.running) job.stop();
    else job.start();
  }
}
