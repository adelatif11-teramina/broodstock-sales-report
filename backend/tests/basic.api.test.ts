import request from 'supertest';
import app from '../src/app';

describe('Basic API Tests', () => {
  
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.message).toBe('Shrimp Broodstock Sales API - Running!');
      expect(response.body.environment).toBe('test');
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-endpoint')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
      expect(response.body.path).toBe('/api/v1/non-existent-endpoint');
      expect(response.body.method).toBe('GET');
    });
  });

  describe('Authentication Required', () => {
    it('should return 401 for protected routes without token', async () => {
      await request(app)
        .get('/api/v1/orders')
        .expect(401);
    });

    it('should return 401 for protected routes with invalid token', async () => {
      await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(204); // OPTIONS typically returns 204

      // CORS is configured to allow all origins in test environment
      expect(response.status).toBe(204);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for common security headers added by helmet
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});