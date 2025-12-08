// test/user.test.ts
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/server/app';
import prisma from '../src/prismaClient';

let token: string;

beforeAll(async () => {
  // Login as admin and get access token
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      username: 'admin',
      password: 'admin123',
    });

  token = response.body.data.accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('User Routes', () => {
  // ===================== GET /users/:id =====================
  describe('GET /api/v1/users/:id', () => {
    it('should return a user by ID', async () => {
      const response = await request(app)
        .get('/api/v1/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 1);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ===================== PUT /users/:id =====================
  describe('PUT /api/v1/users/:id', () => {
    it('should update user details successfully', async () => {
      const payload = {
        username: "cashier1",
        fullName: "Cashier One Updated",
        role: "manager",
        email: "cashier.updated@flamex.com",
        phone: "03009876544",
        status: "active",
        // password: "newpassword" // optional
      };

      const response = await request(app)
        .put('/api/v1/users/5')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        id: 5,
        username: payload.username,
        fullName: payload.fullName,
        role: payload.role,
        email: payload.email,
        phone: payload.phone,
        status: payload.status,
      });
    });

    it('should return 404 if user is not found', async () => {
      const response = await request(app)
        .put('/api/v1/users/3')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: "ghost",
          fullName: "Ghost User",
          role: "manager",
          email: "ghost@none.com",
          phone: "03000000000",
          status: "inactive",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .put('/api/v1/users/5')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: "", // invalid
          email: "not-an-email", // invalid
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });
});
