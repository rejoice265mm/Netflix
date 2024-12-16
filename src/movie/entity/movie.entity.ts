import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from '../../director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { Transform } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './movie-user-like.entity';

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.createdMovies)
  creator: User;

  @Column({ unique: true })
  title: string;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  dislikeCount: number;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false, //연동되는 값이 null이 되지않게끔
  })
  @JoinColumn()
  detail: MovieDetail;

  @Column()
  @Transform(({ value }) =>
    process.env.ENV === 'prod'
      ? `http://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com${value}`
      : `http://localhost:3000/${value}`,
  )
  movieFilePath: string;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;

  @OneToMany(() => MovieUserLike, (mul) => mul.movie)
  likedUsers: MovieUserLike[];
}
