import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { number } from 'joi';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { envVariableKeys } from 'src/common/const/env.const';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    return this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.user', 'user')
      .leftJoinAndSelect('mul.movie', 'movie')
      .where('movie.id IN (:...movieIds)', { movieIds })
      .andWhere('user.id = :userid', { userid: userId })
      .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title } = dto;
    const qb = await this.getMovies();

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    let [data, count] = await qb.getManyAndCount();

    if (userId) {
      // 유저 ID 가 있다면
      const movieIds = data.map((movie) => movie.id); //map을 통해 movieId를 전부 리스트로 가져올수있다.

      const likedMovies =
        movieIds.length < 1 ? [] : await this.getLikedMovies(movieIds, userId);

      const likedMoviesMap = likedMovies.reduce(
        (acc, next) => ({ ...acc, [next.movie.id]: next.isLike }),
        {},
      );
      data = data.map((x) => ({
        ...x,
        likeStatus: x.id in likedMoviesMap ? likedMoviesMap[x.id] : null,
      }));
    }

    return { data, nextCursor, count };
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', { id })
      .getOne();
  }

  async findOne(id: number) {
    const movie = await this.findMovieDetail(id);

    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

    if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다.');

    return movie;
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({ detail: createMovieDto.detail })
      .execute();
  }

  /* istanbul ignore next */
  async createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: { id: movieDetailId },
        director,
        creator: { id: userId },
        movieFilePath: join(movieFolder, createMovieDto.movieFileName),
      })
      .execute();
  }

  /* istanbul ignore next */
  async createMovieGenreRelation(
    qr: QueryRunner,
    movieId: number,
    genres: Genre[],
  ) {
    return qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));
  }

  /* istanbul ignore next */
  async renameMovieFile(
    tempFolder: string,
    movieFolder: string,
    createMovieDto: CreateMovieDto,
  ) {
    if (this.configService.get<string>(envVariableKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanetnStor(
        createMovieDto.movieFileName,
      );
    }
  }

  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    qr: QueryRunner,
  ) {
    const director = await qr.manager.findOne(Director, {
      where: { id: createMovieDto.directorId },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다');
    }

    const genres = await qr.manager.find(Genre, {
      where: { id: In(createMovieDto.genreIds) },
    });

    if (genres.length !== createMovieDto.genreIds.length)
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다.! 존재하는 ID -> ${genres.map((genres) => genres.id).join(',')}`,
      );

    const movieDetail = await this.createMovieDetail(qr, createMovieDto);

    const movieDetailId = movieDetail.identifiers[0].id;

    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');

    const movie = await this.createMovie(
      qr,
      createMovieDto,
      director,
      movieDetailId,
      userId,
      movieFolder,
    );

    const movieId = movie.identifiers[0].id;

    await this.createMovieGenreRelation(qr, movieId, genres);

    await this.renameMovieFile(tempFolder, movieFolder, createMovieDto);

    return await qr.manager.findOne(Movie, {
      where: { id: movieId },
      relations: ['detail', 'director', 'genres'],
    });
  }

  /* istanbul ignore next */
  async updateMovie(
    qr: QueryRunner,
    movieUpdateFields: UpdateMovieDto,
    id: number,
  ) {
    return qr.manager
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id=:id', { id })
      .execute();
  }

  /* istanbul ignore next */
  async updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    return qr.manager
      .createQueryBuilder()
      .update(MovieDetail)
      .set({ detail })
      .where('id =:id', { id: movie.detail.id })
      .execute();
  }

  /* istanbul ignore next */
  async updateMovieGenreRelation(
    qr: QueryRunner,
    id: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    return qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(id)
      .addAndRemove(
        newGenres.map((genre) => genre, id),
        movie.genres.map((genre) => genre.id),
      );
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: { id },
        relations: ['detail', 'genres', 'director'],
      });

      if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다.');

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: { id: directorId },
        });

        if (!director)
          throw new NotFoundException('존재하지 않는 ID의 감독입니다');

        newDirector = director;
      }

      let newGenres;

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: { id: In(genreIds) },
        });

        if (genres.length !== updateMovieDto.genreIds.length)
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다.! 존재하는 ID -> ${genres.map((genres) => genres.id).join(',')}`,
          );

        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      await this.updateMovie(qr, movieUpdateFields, id);
      // await this.movieRepository.update({ id }, movieUpdateFields);

      if (detail) {
        await this.updateMovieDetail(qr, detail, movie);

        // await this.movieDetailRepository.update(
        //   { id: movie.detail.id },
        //   { detail },
        // );
      }

      if (newGenres) {
        await this.updateMovieGenreRelation(qr, id, newGenres, movie);
      }
      // const newMovie = await this.movieRepository.findOne({
      //   where: { id },
      //   relations: ['detail', 'director'],
      // });

      // newMovie.genres = newGenres;

      // await this.movieRepository.save(newMovie);
      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'genres', 'director'],
      });
    } catch (e) {
      await qr.rollbackTransaction();

      throw e;
    } finally {
      await qr.release();
    }
  }

  /* istanbul ignore next */
  async deleteMovie(id: number) {
    return this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다.');

    await this.deleteMovie(id);
    // await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }

  /* istanbul ignore next */
  getLikeRecord(movieId: number, userId: number) {
    return this.movieUserLikeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user') //leftJoinAndSelect 이 값을 가져온다.
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
    });

    if (!movie) throw new BadRequestException('존재하지 않는 영화 입니다.');

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('존재하지 않는 유저 입니다.');

    const likeRecord = await this.getLikeRecord(movieId, userId);

    if (likeRecord) {
      // 이미 좋아요나 싫어요를 한 상태
      if (isLike === likeRecord.isLike) {
        // 좋아요한 상태에서 좋아요를 한 상황 , 싫어요 한상태에서 싫어요 를 한 상황
        await this.movieUserLikeRepository.delete({
          movie,
          user,
        });
      } else {
        await this.movieUserLikeRepository.update({ movie, user }, { isLike });
      }
    } else {
      await this.movieUserLikeRepository.save({
        //한번도 좋아요나 싫어요 를 하지 않은 상태
        movie,
        user,
        isLike,
      });
    }

    const result = await this.getLikeRecord(movieId, userId);

    return { isLike: result && result.isLike };
  }
}
