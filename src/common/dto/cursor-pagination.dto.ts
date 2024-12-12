import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
// 페이지 넘기기 , 조회순 높은 것부터 조회 , 낮은것 부터 조회 등 역할
export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '페이지네이션 커서',
  })
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: '내림차 또는 오름차 정렬',
    example: ['id_DESC'],
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: '가져올 데이터 개수',
    example: 5,
  })
  take: number = 5;
}
