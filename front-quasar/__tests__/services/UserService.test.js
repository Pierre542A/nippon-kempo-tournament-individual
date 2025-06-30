// __tests__/services/UserService.test.js
const UserService = require('../../../api-fastify/services/userService');

describe('UserService - createUser', () => {
  let mockClient;
  let service;

  beforeEach(() => {
    mockClient = { execute: jest.fn() };
    service = new UserService({ mysql: mockClient });
  });

  it('should insert a new user and return its id', async () => {
    mockClient.execute
      .mockResolvedValueOnce([[]])              // aucun email existant
      .mockResolvedValueOnce([{ insertId: 42 }]); // insertion réussie

    const userData = {
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean@example.com',
      password: 'secret',
      birth_date: '1990-01-01'
    };

    const result = await service.createUser(userData);
    expect(mockClient.execute).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: 42 });
  });

  it('should throw if email already exists', async () => {
    mockClient.execute.mockResolvedValueOnce([[{ id: 1 }]]);

    const userData = { email: 'dupont@example.com' };
    await expect(service.createUser(userData)).rejects.toThrow('Cette adresse email est déjà utilisée.');
  });
});

// __tests__/controllers/UserController.test.js
// Mocks pour les dépendances externes
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed')
}));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'token') }));
jest.mock('../../src/middlewares/sendEmail', () => jest.fn());

const UserController = require('../../src/controllers/UserController');

describe('UserController - signup', () => {
  let mockFastify;
  let controller;
  let reply;

  beforeEach(() => {
    mockFastify = {
      jwtSecret: 'secret',
      userService: {
        createUser: jest.fn(),
        getUserById: jest.fn()
      }
    };
    controller = new UserController(mockFastify);
    reply = {
      setCookie: jest.fn(),
      code: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  it('should return 400 if password missing or too short', async () => {
    const req = { body: { first_name: 'T', last_name: 'U', email: 't@u.com', password: '123' } };
    await controller.signup(req, reply);
    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('should create user and set cookie on success', async () => {
    const newUser = { id: 7 };
    const fullUser = { id: 7, id_role: 3, first_name: 'Alice', last_name: 'Lefevre' };

    mockFastify.userService.createUser.mockResolvedValue(newUser);
    mockFastify.userService.getUserById.mockResolvedValue(fullUser);

    const req = {
      body: {
        first_name: 'Alice',
        last_name: 'Lefevre',
        email: 'a@ex.com',
        password: 'longpassword',
        birth_date: '1985-05-05'
      }
    };

    await controller.signup(req, reply);

    expect(mockFastify.userService.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@ex.com' }));
    expect(reply.setCookie).toHaveBeenCalledWith(
      'auth_token_nippon',
      'token',
      expect.objectContaining({ path: '/', httpOnly: true })
    );
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, user: { first_name: 'Alice', last_name: 'Lefevre' } })
    );
  });
});
