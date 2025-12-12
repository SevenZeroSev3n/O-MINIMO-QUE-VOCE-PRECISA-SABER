/**
 * Testes da API Backend
 * Usa Node.js Test Runner nativo + Supertest
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// URL base da API (o servidor precisa estar rodando)
const API_URL = process.env.TEST_API_URL || 'http://127.0.0.1:3000';

describe('API - Rotas Publicas', () => {

  describe('GET /', () => {
    it('deve retornar status 200 e mensagem de health check', async () => {
      const response = await request(API_URL).get('/');

      assert.strictEqual(response.status, 200);
      assert.ok(response.body.message);
      assert.ok(response.body.message.includes('API is running'));
    });

    it('deve retornar informacoes de seguranca', async () => {
      const response = await request(API_URL).get('/');

      assert.ok(response.body.security);
      assert.ok(response.body.security.rateLimit);
      assert.ok(response.body.security.validation);
    });
  });

  describe('GET /api/courses', () => {
    it('deve retornar status 200', async () => {
      const response = await request(API_URL).get('/api/courses');

      assert.strictEqual(response.status, 200);
    });

    it('deve retornar um array de cursos', async () => {
      const response = await request(API_URL).get('/api/courses');

      assert.ok(Array.isArray(response.body));
    });

    it('cursos devem ter campos obrigatorios', async () => {
      const response = await request(API_URL).get('/api/courses');

      if (response.body.length > 0) {
        const course = response.body[0];
        assert.ok(course.id, 'Curso deve ter id');
        assert.ok(course.title, 'Curso deve ter title');
        assert.ok(course.modules, 'Curso deve ter modules');
      }
    });
  });

  describe('POST /api/leads', () => {
    it('deve rejeitar lead sem dados obrigatorios', async () => {
      const response = await request(API_URL)
        .post('/api/leads')
        .send({});

      assert.strictEqual(response.status, 400);
      assert.ok(response.body.error);
    });

    it('deve rejeitar lead sem nome', async () => {
      const response = await request(API_URL)
        .post('/api/leads')
        .send({ whatsapp: '11999999999' });

      assert.strictEqual(response.status, 400);
    });

    it('deve rejeitar lead sem whatsapp', async () => {
      const response = await request(API_URL)
        .post('/api/leads')
        .send({ name: 'Test User' });

      assert.strictEqual(response.status, 400);
    });

    it('deve rejeitar whatsapp invalido', async () => {
      const response = await request(API_URL)
        .post('/api/leads')
        .send({
          name: 'Test User',
          whatsapp: 'abc'
        });

      assert.strictEqual(response.status, 400);
    });

    it('deve criar lead com dados validos', async () => {
      const leadData = {
        name: 'Test User',
        whatsapp: '+1 555 123 4567',
        email: 'test@example.com',
        city: 'Miami',
        level: 'Iniciante',
        goal: 'Trabalho',
        source: 'test'
      };

      const response = await request(API_URL)
        .post('/api/leads')
        .send(leadData);

      assert.ok(
        response.status === 201 || response.status === 429,
        `Status deve ser 201 ou 429, recebeu: ${response.status}`
      );

      if (response.status === 201) {
        assert.ok(response.body.success);
        assert.ok(response.body.lead);
        assert.ok(response.body.lead.id);
      }
    });

    it('deve aceitar UTM parameters', async () => {
      const leadData = {
        name: 'UTM Test User',
        whatsapp: '+1 555 987 6543',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test_campaign'
      };

      const response = await request(API_URL)
        .post('/api/leads')
        .send(leadData);

      assert.ok(
        response.status === 201 || response.status === 429,
        `Status deve ser 201 ou 429, recebeu: ${response.status}`
      );
    });
  });
});

describe('API - Autenticacao', () => {

  describe('POST /api/auth/login', () => {
    it('deve rejeitar login sem credenciais', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({});

      assert.strictEqual(response.status, 400);
    });

    it('deve rejeitar login com email invalido', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'somepassword'
        });

      assert.ok(
        response.status === 400 || response.status === 429,
        `Status deve ser 400 ou 429, recebeu: ${response.status}`
      );
    });

    it('deve rejeitar credenciais incorretas', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });

      assert.ok(
        response.status === 401 || response.status === 429,
        `Status deve ser 401 ou 429, recebeu: ${response.status}`
      );
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve rejeitar sem token', async () => {
      const response = await request(API_URL).get('/api/auth/me');

      assert.strictEqual(response.status, 401);
      assert.ok(response.body.error);
    });

    it('deve rejeitar com token invalido', async () => {
      const response = await request(API_URL)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      assert.strictEqual(response.status, 401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('deve retornar sucesso', async () => {
      const response = await request(API_URL)
        .post('/api/auth/logout');

      assert.strictEqual(response.status, 200);
      assert.ok(response.body.success);
    });
  });
});

describe('API - Rotas Admin (Protegidas)', () => {

  describe('GET /api/admin/leads', () => {
    it('deve rejeitar sem autenticacao', async () => {
      const response = await request(API_URL).get('/api/admin/leads');

      assert.strictEqual(response.status, 401);
    });

    it('deve rejeitar com token invalido', async () => {
      const response = await request(API_URL)
        .get('/api/admin/leads')
        .set('Authorization', 'Bearer fake-token');

      assert.strictEqual(response.status, 401);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('deve rejeitar sem autenticacao', async () => {
      const response = await request(API_URL).get('/api/admin/stats');

      assert.strictEqual(response.status, 401);
    });
  });

  describe('GET /api/admin/stats/sources', () => {
    it('deve rejeitar sem autenticacao', async () => {
      const response = await request(API_URL).get('/api/admin/stats/sources');

      assert.strictEqual(response.status, 401);
    });
  });

  describe('PATCH /api/admin/leads/:id/status', () => {
    it('deve rejeitar sem autenticacao', async () => {
      const response = await request(API_URL)
        .patch('/api/admin/leads/1/status')
        .send({ status: 'contacted' });

      assert.strictEqual(response.status, 401);
    });
  });

  describe('DELETE /api/admin/leads/:id', () => {
    it('deve rejeitar sem autenticacao', async () => {
      const response = await request(API_URL)
        .delete('/api/admin/leads/1');

      assert.strictEqual(response.status, 401);
    });
  });
});

describe('API - Seguranca', () => {

  describe('CORS', () => {
    it('deve permitir requests sem origin (como Postman)', async () => {
      const response = await request(API_URL).get('/');

      assert.strictEqual(response.status, 200);
    });
  });

  describe('Validacao de Input', () => {
    it('deve rejeitar nome muito longo', async () => {
      const response = await request(API_URL)
        .post('/api/leads')
        .send({
          name: 'A'.repeat(200),
          whatsapp: '11999999999'
        });

      assert.strictEqual(response.status, 400);
    });

    it('deve sanitizar campos opcionais vazios', async () => {
      const response = await request(API_URL)
        .post('/api/leads')
        .send({
          name: 'Test User',
          whatsapp: '11999999999',
          email: '',
          city: ''
        });

      assert.ok(
        response.status === 201 || response.status === 429,
        `Status deve ser 201 ou 429, recebeu: ${response.status}`
      );
    });
  });

  describe('CSRF Token', () => {
    it('deve fornecer CSRF token', async () => {
      const response = await request(API_URL).get('/api/csrf-token');

      assert.strictEqual(response.status, 200);
      assert.ok(response.body.csrfToken);
    });
  });
});
