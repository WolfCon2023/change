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
    const rawDocuments = await Artifact.find({ tenantId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Transform _id to id for frontend compatibility
    const documents = rawDocuments.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
    }));
    
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
    
    const rawDoc = await Artifact.findOne({ _id: id, tenantId }).lean();
    
    if (!rawDoc) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }
    
    // Transform _id to id
    const document = {
      ...rawDoc,
      id: rawDoc._id.toString(),
      _id: undefined,
    };
    
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
    
    const rawDoc = await Artifact.findOneAndUpdate(
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
    
    if (!rawDoc) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }
    
    // Transform _id to id
    const document = {
      ...rawDoc,
      id: rawDoc._id.toString(),
      _id: undefined,
    };
    
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
 * Delete a document (handles file cleanup if needed)
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
    
    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Document ID is required' },
      });
    }
    
    // Find the document first to check if it has a file
    const artifact = await Artifact.findOne({ _id: id, tenantId });
    
    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }
    
    // If it's a file, try to delete the physical file
    if (artifact.storageType === 'file' && artifact.storageKey) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
        const filePath = path.default.join(UPLOAD_DIR, artifact.storageKey);
        if (fs.default.existsSync(filePath)) {
          fs.default.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.error('Failed to delete file:', fileErr);
        // Continue with database deletion even if file deletion fails
      }
    }
    
    // Delete the database record
    await Artifact.deleteOne({ _id: id, tenantId });
    
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
