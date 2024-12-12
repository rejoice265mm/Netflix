import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { Repository } from 'typeorm';
import { Director } from './entity/director.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { NotFoundException } from '@nestjs/common';

const mockDirectorRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DirectorService', () => {
  let directorRepository: Repository<Director>;
  let directorService: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new director', async () => {
      const createDirectorDto = {
        name: 'kkkdjf difjdk',
      };
      jest
        .spyOn(mockDirectorRepository, 'save')
        .mockResolvedValue(createDirectorDto);
      const result = await directorService.create(
        createDirectorDto as CreateDirectorDto,
      );

      expect(directorRepository.save).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(createDirectorDto);
    });
  });

  describe('findAll', () => {
    it('should return all director', async () => {
      const directors = [{ id: 1, name: 'kkk' }];

      jest.spyOn(mockDirectorRepository, 'find').mockResolvedValue(directors);
      const result = await directorService.findAll();

      expect(mockDirectorRepository.find).toHaveBeenCalled();
      expect(result).toEqual(directors);
    });
  });

  describe('findOne', () => {
    it('should return a director by id', async () => {
      const director = { id: 1, name: 'kkk' };

      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValue(director as Director);

      const result = await directorService.findOne(director.id);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(director);
    });
  });

  describe('update', () => {
    it('should update a director', async () => {
      const updateDirectorDto = { name: 'kkk' };
      const existingDirector = { id: 1, name: 'kkk' };
      const updateDirector = { id: 1, name: 'kkkk' };

      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValueOnce(existingDirector);
      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValueOnce(updateDirector);

      const result = await directorService.update(1, updateDirectorDto);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockDirectorRepository.update).toHaveBeenCalledWith(
        {
          id: 1,
        },
        updateDirectorDto,
      );
      expect(result).toEqual(updateDirector);
    });

    it('should throw a NotFoundException if director does not exist', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      expect(directorService.update(1, { name: 'kkk' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('shold delete a director by id', async () => {
      const director = { id: 1, name: 'dijfik' };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);
      const result = await directorService.remove(1);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockDirectorRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(1);
    });

    it('should throw a NotFoundException if director does not exist', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      expect(directorService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
