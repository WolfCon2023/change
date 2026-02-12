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
import analyticsRoutes from './analytics.routes.js';

// Debug: log route loading
console.log('[App Routes] Loading routes - documents:', typeof documentsRoutes);
console.log('[App Routes] Loading routes - analytics:', typeof analyticsRoutes);

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
router.use('/analytics', analyticsRoutes);

// Debug: direct documents test endpoint
router.get('/documents-test', async (req: Request, res: Response) => {
  try {
    const { Artifact, BusinessProfile } = await import('../../db/models/index.js');
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.json({
        success: false,
        error: 'No tenant ID',
        user: req.user ? 'exists' : 'null',
      });
    }
    
    const docCount = await Artifact.countDocuments({ tenantId });
    const profileExists = await BusinessProfile.exists({ tenantId });
    
    res.json({
      success: true,
      data: {
        tenantId,
        documentCount: docCount,
        hasProfile: !!profileExists,
        message: 'Documents test endpoint working',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check for app routes
router.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'App routes healthy',
    version: '2025-02-12-v7',
    routeLoaders: {
      documents: typeof documentsRoutes,
      analytics: typeof analyticsRoutes,
    },
    routes: [
      '/archetypes',
      '/setup',
      '/profile',
      '/home',
      '/reference',
      '/documents',
      '/tasks',
      '/uploads',
      '/billing',
      '/analytics',
    ],
  });
});

export default router;
