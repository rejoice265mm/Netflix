import { Module } from '@nestjs/common';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movie/entity/movie.entity';
import { Director } from './entity/director.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Director, Movie])],
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule {}
