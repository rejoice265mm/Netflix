import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { Genre } from './entities/genre.entity';

const mockGenreService = {
  findAll: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('GenreController', () => {
  let controller: GenreController;
  let service: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [{ provide: GenreService, useValue: mockGenreService }],
    }).compile();
    controller = module.get<GenreController>(GenreController);
    service = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call genreService.findAll and return an array of genres', async () => {
      const result = [{ id: 1, name: 'kkk' }];

      jest.spyOn(service, 'findAll').mockResolvedValue(result as Genre[]);

      expect(controller.findAll()).resolves.toEqual(result);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call genreService.findOne with correct id and return the genre ', async () => {
      const id = 1;
      const result = {
        id: 1,
        name: 'kkk',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(result as Genre);

      expect(controller.findOne(id)).resolves.toEqual(result);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });
  describe('create', () => {
    it('should call create method from GenreService with correct DTO', async () => {
      const createGenrerDto = { name: 'kkk' };
      const result = { id: 1, ...createGenrerDto };

      jest
        .spyOn(mockGenreService, 'create')
        .mockResolvedValue(result as CreateGenreDto & Genre);

      expect(controller.create(createGenrerDto)).resolves.toEqual(result);
      expect(service.create).toHaveBeenCalledWith(createGenrerDto);
    });
  });
  describe('update', () => {
    it('should call genreService.update with correct parameters and return update genre', async () => {
      const id = 1;
      const updateGenreDto = { name: 'kk' };
      const result = { id: 1, ...updateGenreDto };

      jest.spyOn(service, 'update').mockResolvedValue(result as Genre);

      expect(controller.update(id, updateGenreDto)).resolves.toEqual(result);
      expect(service.update).toHaveBeenCalledWith(id, updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should call genreService.remove with correct id and return id of the removed genre ', async () => {
      const id = 1;

      jest.spyOn(service, 'remove').mockResolvedValue(id);

      expect(controller.remove(id)).resolves.toBe(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
