/**
 * Documents Routes
 * Document management for business artifacts and generated documents
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Artifact, BusinessProfile, DocumentInstance } from '../../db/models/index.js';
import { documentGenerationService } from '../../services/document-generation.service.js';
import { validate } from '../../middleware/index.js';

const router = Router();

// Validation schema for document generation
const generateDocumentSchema = z.object({
  templateType: z.string().min(1),
  customData: z.record(z.string()).optional(),
});

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
 * GET /app/documents/templates
 * Get available document templates for the business
 * NOTE: This route must be defined BEFORE /:id to avoid matching "templates" as an ID
 */
router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { grouped } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    // Get business profile to determine applicable templates
    const profile = await BusinessProfile.findOne({ tenantId }).lean();
    
    if (grouped === 'true') {
      // Return templates organized by category
      const templatesByCategory = await documentGenerationService.getTemplatesByCategory(
        profile?.businessType,
        profile?.formationState
      );
      
      res.json({
        success: true,
        data: {
          categories: templatesByCategory,
          categoryOrder: ['formation', 'governance', 'financial', 'operations', 'compliance', 'improvement'],
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } else {
      // Return flat list of templates
      const templates = await documentGenerationService.getAvailableTemplates(
        profile?.businessType,
        profile?.formationState
      );
      
      res.json({
        success: true,
        data: templates,
        meta: { timestamp: new Date().toISOString() },
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /app/documents/generate
 * Generate a document from a template
 */
router.post(
  '/generate',
  validate(generateDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      
      if (!tenantId || !userId) {
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
      
      const { templateType, customData } = req.body;
      
      const document = await documentGenerationService.generateDocument({
        templateType,
        tenantId,
        businessProfileId: profile._id.toString(),
        userId,
        customData,
      });
      
      res.status(201).json({
        success: true,
        data: document,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      if (error.message?.includes('No active template')) {
        return res.status(404).json({
          success: false,
          error: { code: 'TEMPLATE_NOT_FOUND', message: error.message },
        });
      }
      next(error);
    }
  }
);

/**
 * GET /app/documents/generated
 * Get all generated documents for the business
 */
router.get('/generated', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const documents = await DocumentInstance.find({ tenantId })
      .sort({ createdAt: -1 })
      .select('name type status content generatedAt')
      .lean();
    
    res.json({
      success: true,
      data: documents.map(d => ({
        id: d._id.toString(),
        name: d.name,
        type: d.type,
        status: d.status,
        generatedAt: d.generatedAt,
        hasContent: !!d.content,
      })),
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /app/documents/generated/:id
 * Get a specific generated document with full content
 */
router.get('/generated/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const document = await DocumentInstance.findOne({ _id: id, tenantId }).lean();
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }
    
    res.json({
      success: true,
      data: {
        id: document._id.toString(),
        name: document.name,
        type: document.type,
        status: document.status,
        content: document.content,
        mergeData: document.mergeData,
        generatedAt: document.generatedAt,
        versionHistory: document.versionHistory,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /app/documents/generated/:id/regenerate
 * Regenerate a document with updated data
 */
router.post('/generated/:id/regenerate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { customData } = req.body;
    
    if (!tenantId || !userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    // Verify document belongs to tenant
    const existing = await DocumentInstance.findOne({ _id: id, tenantId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }
    
    const document = await documentGenerationService.regenerateDocument(id, userId, customData);
    
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
 * GET /app/documents/:id
 * Get a specific document (artifact)
 * NOTE: This must come AFTER all specific routes like /templates, /generated, etc.
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
