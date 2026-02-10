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
import documentsRoutes from './documents.routes.js';
import tasksRoutes from './tasks.routes.js';
import uploadsRoutes from './uploads.routes.js';
import billingRoutes from './billing.routes.js';

const router = Router();

// All app routes require authentication
router.use(authenticate);

// Mount sub-routes
router.use('/archetypes', archetypesRoutes);
router.use('/setup', setupRoutes);
router.use('/profile', profileRoutes);
router.use('/home', homeRoutes);
router.use('/reference', referenceRoutes);
router.use('/documents', documentsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/billing', billingRoutes);

// Health check for app routes
router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'App routes healthy' });
});

export default router;
