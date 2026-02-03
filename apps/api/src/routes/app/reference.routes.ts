/**
 * Reference Routes
 * Static reference data endpoints for the business application
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAllStatePortals, getStatePortal, STATE_OPTIONS, isValidStateCode } from '@change/shared';

const router = Router();

/**
 * GET /app/reference/state-filing-portals
 * Returns all state filing portal information
 */
router.get('/state-filing-portals', (_req: Request, res: Response) => {
  const portals = getAllStatePortals();
  
  res.json({
    success: true,
    data: portals,
    meta: {
      timestamp: new Date().toISOString(),
      count: portals.length,
    },
  });
});

/**
 * GET /app/reference/state-filing-portals/:code
 * Returns filing portal information for a specific state
 */
router.get('/state-filing-portals/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  
  if (!isValidStateCode(code)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATE_CODE',
        message: `Invalid state code: ${code}`,
      },
    });
  }
  
  const portal = getStatePortal(code);
  
  if (!portal) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `State portal not found for code: ${code}`,
      },
    });
  }
  
  res.json({
    success: true,
    data: portal,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /app/reference/state-options
 * Returns simplified state options for dropdowns
 */
router.get('/state-options', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: STATE_OPTIONS,
    meta: {
      timestamp: new Date().toISOString(),
      count: STATE_OPTIONS.length,
    },
  });
});

export default router;
