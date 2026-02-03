/**
 * Archetypes Routes
 * Read-only access to business archetype library
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { BusinessArchetype } from '../../db/models/index.js';

const router = Router();

/**
 * GET /app/archetypes
 * List all active archetypes
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, tags } = req.query;
    
    const query: Record<string, unknown> = { isActive: true };
    
    // Search by name or description
    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Filter by tags
    if (tags && typeof tags === 'string') {
      query.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
    }
    
    const archetypes = await BusinessArchetype.find(query)
      .select('key name description icon tags recommendedEntityTypes industryExamples displayOrder')
      .sort({ displayOrder: 1 })
      .lean();
    
    // Transform _id to id
    const transformed = archetypes.map(a => ({
      ...a,
      id: a._id.toString(),
      _id: undefined,
    }));
    
    res.json({
      success: true,
      data: transformed,
      meta: { 
        timestamp: new Date().toISOString(),
        count: transformed.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /app/archetypes/:key
 * Get full archetype details including processes, KPIs, docs
 */
router.get('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    
    const archetype = await BusinessArchetype.findOne({ key, isActive: true }).lean();
    
    if (!archetype) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Archetype not found' },
      });
    }
    
    // Transform _id to id
    const transformed = {
      ...archetype,
      id: archetype._id.toString(),
      _id: undefined,
    };
    
    res.json({
      success: true,
      data: transformed,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /app/archetypes/:key/preview
 * Get archetype preview data (processes + KPIs only)
 */
router.get('/:key/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    
    const archetype = await BusinessArchetype.findOne({ key, isActive: true })
      .select('key name description commonProcesses defaultKPIs recommendedEntityTypes riskChecklist')
      .lean();
    
    if (!archetype) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Archetype not found' },
      });
    }
    
    res.json({
      success: true,
      data: {
        key: archetype.key,
        name: archetype.name,
        description: archetype.description,
        recommendedEntityTypes: archetype.recommendedEntityTypes,
        topProcesses: archetype.commonProcesses.slice(0, 5),
        topKPIs: archetype.defaultKPIs.slice(0, 8),
        keyRisks: archetype.riskChecklist.filter(r => r.severity === 'critical' || r.severity === 'high'),
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
