import { Router } from 'express';
import { getConnectionStatus } from '../db/connection.js';
import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
// Build version for deployment verification
const BUILD_VERSION = '2025-02-12-v9';

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: BUILD_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbStatus.isConnected,
        readyState: dbStatus.readyState,
      },
      routes: {
        analytics: true,
        mfa: true,
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
