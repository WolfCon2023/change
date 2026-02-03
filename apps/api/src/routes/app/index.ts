/**
 * App Routes Index
 * Core business application API routes
 * 
 * All routes are tenant-scoped and require authentication.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/index.js';

import archetypesRoutes from './archetypes.routes.js';
import setupRoutes from './setup.routes.js';
import profileRoutes from './profile.routes.js';
import homeRoutes from './home.routes.js';
import referenceRoutes from './reference.routes.js';

const router = Router();

// All app routes require authentication
router.use(authenticate);

// Mount sub-routes
router.use('/archetypes', archetypesRoutes);
router.use('/setup', setupRoutes);
router.use('/profile', profileRoutes);
router.use('/home', homeRoutes);
router.use('/reference', referenceRoutes);

// Health check for app routes
router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'App routes healthy' });
});

export default router;
