import { Router } from 'express';
import { getConnectionStatus } from '../db/connection.js';
import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbStatus.isConnected,
        readyState: dbStatus.readyState,
      },
    },
  });
});

/**
 * GET /health/ready
 * Readiness probe for k8s/Railway
 */
router.get('/ready', (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();

  if (!dbStatus.isConnected) {
    res.status(503).json({
      success: false,
      error: {
        code: 'NOT_READY',
        message: 'Database not connected',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      status: 'ready',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /health/live
 * Liveness probe for k8s/Railway
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
