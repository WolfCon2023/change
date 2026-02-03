/**
 * Documents Routes
 * Document management for business artifacts and generated documents
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Artifact, BusinessProfile } from '../../db/models/index.js';

const router = Router();

// Document categories for organization
const DOCUMENT_CATEGORIES = {
  formation: 'Formation Documents',
  operational: 'Operational Documents',
  evidence: 'Evidence and Confirmations',
};

/**
 * GET /app/documents
 * Get all documents for the current user's business
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    // Get business profile
    const profile = await BusinessProfile.findOne({ tenantId }).lean();
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_PROFILE', message: 'Business profile not found' },
      });
    }
    
    // Get all artifacts/documents for this tenant
    const documents = await Artifact.find({ tenantId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Categorize documents
    const categorized = {
      formation: documents.filter(d => 
        ['sos_filing', 'articles_of_organization', 'articles_of_incorporation', 'formation_certificate'].includes(d.type)
      ),
      operational: documents.filter(d => 
        ['operating_agreement', 'bylaws', 'ein_application', 'bank_statement', 'business_license'].includes(d.type)
      ),
      evidence: documents.filter(d => 
        ['ein_confirmation', 'screenshot', 'confirmation', 'receipt'].includes(d.type)
      ),
    };
    
    // Count by category
    const counts = {
      formation: categorized.formation.length,
      operational: categorized.operational.length,
      evidence: categorized.evidence.length,
      total: documents.length,
    };
    
    res.json({
      success: true,
      data: {
        documents,
        categorized,
        counts,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /app/documents/:id
 * Get a specific document
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const document = await Artifact.findOne({ _id: id, tenantId }).lean();
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }
    
    res.json({
      success: true,
      data: document,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /app/documents
 * Create a new document/artifact
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    
    if (!tenantId || !userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { type, name, description, category, storageType, textContent, jsonContent, tags } = req.body;
    
    // Get business profile
    const profile = await BusinessProfile.findOne({ tenantId }).lean();
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_PROFILE', message: 'Business profile not found' },
      });
    }
    
    const document = await Artifact.create({
      tenantId,
      type: type || 'document',
      name,
      description,
      category,
      storageType: storageType || 'text',
      textContent,
      jsonContent,
      linkedEntityType: 'business_profile',
      linkedEntityId: profile._id.toString(),
      tags: tags || [],
      isVerified: false,
      isConfidential: false,
      createdBy: userId,
    });
    
    res.status(201).json({
      success: true,
      data: document,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /app/documents/:id
 * Update a document
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { name, description, tags, isVerified, verificationNotes } = req.body;
    
    const document = await Artifact.findOneAndUpdate(
      { _id: id, tenantId },
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(tags && { tags }),
        ...(isVerified !== undefined && { 
          isVerified,
          verifiedBy: isVerified ? userId : undefined,
          verifiedAt: isVerified ? new Date() : undefined,
          verificationNotes,
        }),
        updatedBy: userId,
      },
      { new: true }
    ).lean();
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }
    
    res.json({
      success: true,
      data: document,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /app/documents/:id
 * Delete a document
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const result = await Artifact.findOneAndDelete({ _id: id, tenantId });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }
    
    res.json({
      success: true,
      message: 'Document deleted successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
