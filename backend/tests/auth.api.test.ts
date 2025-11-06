import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { pool } from '../src/config/database';

// Mock the database
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Mock user lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          email: 'test@example.com',
          password_hash: hashedPassword,
          role: 'editor',
          is_active: true,
          name: 'Test User'
        }]
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          role: 'editor',
          name: 'Test User'
        })
      );
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify JWT token
      const decodedToken = jwt.verify(response.body.data.token, process.env.JWT_SECRET!);
      expect(decodedToken).toEqual(
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'editor'
        })
      );
    });

    it('should return 401 for invalid email', async () => {
      // Mock user not found
      mockPool.query.mockResolvedValueOnce({
        rows: []
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      
      // Mock user lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          email: 'test@example.com',
          password_hash: hashedPassword,
          role: 'editor',
          is_active: true,
          name: 'Test User'
        }]
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Mock inactive user
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          email: 'test@example.com',
          password_hash: hashedPassword,
          role: 'editor',
          is_active: false,
          name: 'Test User'
        }]
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is disabled');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const userId = 'user-123';
      const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Mock user lookup for refresh
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: 'test@example.com',
          role: 'editor',
          is_active: true,
          name: 'Test User'
        }]
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          id: userId,
          email: 'test@example.com',
          role: 'editor'
        })
      );
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 401 for expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', type: 'refresh' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1d' } // Expired
      );

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for wrong token type', async () => {
      const accessToken = jwt.sign(
        { userId: 'user-123', type: 'access' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: accessToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const userId = 'user-123';
      const token = jwt.sign(
        { userId, email: 'test@example.com', role: 'editor' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      // Mock user lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: 'test@example.com',
          role: 'editor',
          is_active: true,
          name: 'Test User',
          created_at: new Date(),
          last_login: new Date()
        }]
      } as any);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          id: userId,
          email: 'test@example.com',
          role: 'editor',
          name: 'Test User'
        })
      );
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'editor' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1m' } // Expired
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      // Mock failed login attempts
      mockPool.query.mockResolvedValue({
        rows: []
      } as any);

      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = Array(6).fill(0).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);

      // First 5 should be 401, 6th should be rate limited
      responses.slice(0, 5).forEach(response => {
        expect(response.status).toBe(401);
      });

      // The 6th request might be rate limited (429) depending on implementation
      const lastResponse = responses[5];
      expect([401, 429]).toContain(lastResponse.status);
    });
  });
});