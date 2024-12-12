import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}
  async create(createGenreDto: CreateGenreDto) {
    const genre = await this.genreRepository.findOne({
      where: { name: createGenreDto.name },
    });

    return await this.genreRepository.save(createGenreDto);
  }

  async findAll() {
    return await this.genreRepository.find();
  }

  async findOne(id: number) {
    const genre = await this.genreRepository.findOne({ where: { id } });

    if (!genre) throw new NotFoundException('존재하지 않는 장르의 ID 입니다.');

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreRepository.findOne({ where: { id } });

    if (!genre) throw new NotFoundException('존재하지 않는 장르의 ID 입니다.');

    await this.genreRepository.update({ id }, { ...updateGenreDto });

    const newGenre = await this.genreRepository.findOne({ where: { id } });

    return newGenre;
  }

  async remove(id: number) {
    const genre = await this.genreRepository.findOne({ where: { id } });

    if (!genre) throw new NotFoundException('존재하지 않는 장르의 ID 입니다.');

    await this.genreRepository.delete(id);

    return id;
  }
}
