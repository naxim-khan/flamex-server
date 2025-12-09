import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import config from '../config/config';
import logger from '../config/logger';
import { rateLimiter } from '../middlewares/rateLimiter';
import { errorHandler } from '../middlewares/errorHandler';
import routes from '../routes/index';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOrigins = [
  ...config.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean),
  ...(config.CORS_ORIGIN_LOCAL_HOST ? config.CORS_ORIGIN_LOCAL_HOST.split(',').map(o => o.trim()).filter(Boolean) : []),
];

const corsOptions = {
  origin: corsOrigins,
  credentials: config.CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
// Remove this line as cors middleware already handles OPTIONS
// app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: config.SESSION_COOKIE_MAX_AGE,
    },
  }),
);

// Compression
app.use(compression());

// Logging
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }),
);

// Rate limiting
app.use(rateLimiter);

// Trust proxy
app.set('trust proxy', 1);

// API routes
// app.use(`/api/${config.API_VERSION}`, routes);

// API routes
app.use(`/api`, routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
  });
});

// 404 handler
app.use('/:any', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling
app.use(errorHandler);

export default app;