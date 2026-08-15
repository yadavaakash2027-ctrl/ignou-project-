import express, { Request, Response, NextFunction } from 'express';
import serverless from 'serverless-http';
import { apiRouter } from '../../server/routes';

const app = express();

// Enable CORS for all origins in serverless function
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// JSON and URL-encoded body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount router on /api, /.netlify/functions/api, and root / so every Netlify rewrite matches properly
app.use('/.netlify/functions/api', apiRouter);
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback error handler for serverless functions
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Netlify Function API Error]', err);
  res.status(500).json({
    error: err?.message || 'Internal Server Error in Netlify Function',
    status: 'error'
  });
});

export const handler = serverless(app);
