// __tests__/controllers/UserController.test.js
const UserController = require('../../../api-fastify/controllers/UserController');

describe('UserController - signup', () => {
  let mockFastify;
  let controller;
  let reply;

  beforeEach(() => {
    mockFastify = {
      jwt: { sign: jest.fn(() => 'token') },
      userService: { createUser: jest.fn(), getUserById: jest.fn() }
    };
    controller = new UserController(mockFastify);
    reply = {
      setCookie: jest.fn(),
      code: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  it('should return 400 if password missing or too short', async () => {
    const req = { body: { first_name: 'Test', email: 't@t.com', password: '123' } };
    await controller.signup(req, reply);
    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it('should create user and set cookie on success', async () => {
    const newUser = { id: 7 };
    const fullUser = { id: 7, first_name: 'Alice', last_name: 'Lefevre', id_role: 3 };

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

    expect(mockFastify.userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@ex.com' })
    );
    expect(reply.setCookie).toHaveBeenCalledWith(
      'auth_token_nippon',
      'token',
      expect.objectContaining({ path: '/', httpOnly: true })
    );
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, user: fullUser })
    );
  });
});
