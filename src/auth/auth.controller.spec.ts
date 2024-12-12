import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  tokenBolck: jest.fn(),
  issueToken: jest.fn(),
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register a user', () => {
      const token = 'Basic dkjiefjdsfds';
      const result = { id: 1, email: 'test@example.com' };

      jest.spyOn(authService, 'register').mockResolvedValue(result as User);

      expect(authController.registerUser(token)).resolves.toEqual(result);
      expect(authService.register).toHaveBeenCalledWith(token);
    });
  });

  describe('loginUser', () => {
    it('should loign a user', async () => {
      const token = 'Basic asdkdlfijskfl';
      const result = {
        refreshToken: 'mock.refresh.token',
        accessToken: 'mock.access.token',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(result);

      expect(authController.loginUser(token)).resolves.toEqual(result);
      expect(authService.login).toHaveBeenCalledWith(token);
    });
  });

  describe('bolcktoken', () => {
    it('should block a token', async () => {
      const token = 'some.jwt.token';

      jest.spyOn(authService, 'tokenBolck').mockResolvedValue(true);

      expect(authController.bolcktoken(token)).resolves.toBe(true);
      expect(authService.tokenBolck).toHaveBeenCalledWith(token);
    });
  });

  describe('rotateAcessToken', () => {
    it('should rotate acess Token  ', async () => {
      const accessToken = 'mock.access.token';

      jest.spyOn(authService, 'issueToken').mockResolvedValue(accessToken);

      const result = await authController.rotateAcessToken({ user: 'a' });

      expect(authService.issueToken).toHaveBeenCalledWith('a', false);
      expect(result).toEqual({ accessToken });
    });
  });

  describe('loginUserPassport', () => {
    it('should login user using passport strategy', async () => {
      const user = { id: 1, role: 'user' };
      const req = { user };
      const accessToken = 'mock.access.token';
      const refreshToken = 'mock.refresh.token';

      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(accessToken);

      const result = await authController.loginUserPassport(req);

      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(2, user, false);
      expect(result).toEqual({ refreshToken, accessToken });
    });
  });
});
