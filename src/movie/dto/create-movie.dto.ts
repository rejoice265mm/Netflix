import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '영화 제목' })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '영화 설명', example: '100만 영화' })
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '감독 ID' })
  directorId: number;

  @ArrayNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ApiProperty({ description: '장르 IDs', example: [1, 2] })
  genreIds: number[];

  @IsString()
  @ApiProperty({ description: '영화 파일' })
  movieFileName: string;
}
