import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('LuxeMode API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ── Health ─────────────────────────────────────────────────────────────────

  describe('GET /api/v1/health', () => {
    it('returns 200 with status ok', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ status: 'ok' });
    });
  });

  // ── Public Product Endpoints ───────────────────────────────────────────────

  describe('GET /api/v1/products', () => {
    it('returns 200 with paginated product list', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.products)).toBe(true);
      expect(body.data).toHaveProperty('total');
    });

    it('filters by search query', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/products?search=shirt')
        .expect(200);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.products)).toBe(true);
    });

    it('filters by minPrice and maxPrice', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/products?minPrice=0&maxPrice=100')
        .expect(200);

      expect(body.success).toBe(true);
      if (body.data.products.length > 0) {
        body.data.products.forEach((p: { price: number }) => {
          expect(p.price).toBeGreaterThanOrEqual(0);
          expect(p.price).toBeLessThanOrEqual(100);
        });
      }
    });
  });

  describe('GET /api/v1/products/:slug', () => {
    it('returns 404 for a non-existent slug', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/products/this-product-does-not-exist-xyz')
        .expect(404);

      expect(body.success).toBe(false);
    });
  });

  // ── Public Category Endpoints ──────────────────────────────────────────────

  describe('GET /api/v1/categories', () => {
    it('returns 200 with category list', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.categories)).toBe(true);
    });
  });

  // ── Public Blog Endpoints ──────────────────────────────────────────────────

  describe('GET /api/v1/blog/posts', () => {
    it('returns 200 with published posts', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/blog/posts')
        .expect(200);

      expect(body.success).toBe(true);
    });
  });

  // ── Auth Flow ──────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('returns 401 for wrong credentials', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrongpassword' })
        .expect(401);

      expect(body.success).toBe(false);
    });

    it('returns 400 for malformed body (missing password)', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(body.success).toBe(false);
    });
  });

  // ── Protected Endpoints Without Auth ──────────────────────────────────────

  describe('Protected endpoints require auth', () => {
    it('GET /api/v1/auth/me returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('GET /api/v1/orders returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/orders').expect(401);
    });

    it('GET /api/v1/admin/analytics returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/admin/analytics').expect(401);
    });
  });

  // ── Brands ────────────────────────────────────────────────────────────────

  describe('GET /api/v1/brands', () => {
    it('returns 200 with brand list', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/brands')
        .expect(200);

      expect(body.success).toBe(true);
    });
  });

  // ── Cart (session-based) ──────────────────────────────────────────────────

  describe('GET /api/v1/cart', () => {
    it('returns an empty cart for a new session', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .expect(200);

      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
      expect(body.data.subtotal).toBe(0);
    });
  });
});
