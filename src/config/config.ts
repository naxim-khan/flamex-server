import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),
  API_VERSION: z.string().default('v1'),
  APP_NAME: z.string().default('Flamex POS'),
  DOMAIN: z.string().default('localhost'),

  DATABASE_URL: z.string().url(),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('flamex_pos'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_MAX_AGE: z.coerce.number().default(604800000),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_ORIGIN_LOCAL_HOST: z.string().optional(),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  PRINTER_VENDOR_ID: z.string().optional(),
  PRINTER_PRODUCT_ID: z.string().optional(),
  PRINTER_PORT: z.string().default('USB001'),

  BUSINESS_NAME: z.string().default('Flamex'),
  EASYPAISA_NAME: z.string().default('Abdullah Saleem'),
  EASYPAISA_ACCOUNT: z.string().default('03307072222'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10000), // Very high for development

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
  LOG_ERROR_FILE: z.string().default('logs/error.log'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables');
  console.table(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const config = parsed.data;
export default config;
