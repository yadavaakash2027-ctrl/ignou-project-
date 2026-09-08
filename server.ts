import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { initInsForgeDatabase, syncAllStudentsToInsForge } from './server/insforge';
import { db } from './server/db';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes mount FIRST (both with /api prefix and direct fallback)
  app.use('/api', apiRouter);
  app.use('/auth', apiRouter);
  app.use('/projects', apiRouter);
  app.use('/topics', apiRouter);
  app.use('/programs', apiRouter);
  app.use('/subjects', apiRouter);
  app.use('/payment', apiRouter);
  app.use('/admin', apiRouter);
  app.use('/jobs', apiRouter);

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IGNOU Project Hub] Server running on http://0.0.0.0:${PORT}`);

    // Initialize InsForge PostgreSQL Database table and sync students
    initInsForgeDatabase()
      .then((ok) => {
        if (ok) {
          const students = db.getStudents();
          if (students.length > 0) {
            syncAllStudentsToInsForge(students).then(({ synced, total }) => {
              console.log(`[InsForge] Automatically synchronized ${synced}/${total} students to InsForge PostgreSQL`);
            }).catch((err) => {
              console.warn('[InsForge Sync Warning]:', err?.message);
            });
          }
        }
      })
      .catch((err) => {
        console.warn('[InsForge Startup Warning]:', err?.message);
      });
  });
}

startServer().catch((err) => {
  console.error('Failed to start IGNOU Project Hub server:', err);
});
