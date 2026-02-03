/**
 * Uploads Routes
 * File upload handling with local storage (Railway volume compatible)
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Artifact, BusinessProfile } from '../../db/models/index.js';

const router = Router();

// Upload directory - can be mapped to Railway volume
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: PDF, PNG, JPG, GIF, DOC, DOCX, TXT`));
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * POST /app/uploads
 * Upload a file and create a document artifact
 */
router.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    
    if (!tenantId || !userId) {
      // Clean up uploaded file if auth fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }
    
    // Get business profile
    const profile = await BusinessProfile.findOne({ tenantId }).lean();
    if (!profile) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: { code: 'NO_PROFILE', message: 'Business profile not found' },
      });
    }
    
    const { type, name, description, category } = req.body;
    
    // Create artifact record
    const artifact = await Artifact.create({
      tenantId,
      type: type || 'document',
      name: name || req.file.originalname,
      description,
      category,
      storageType: 'file',
      storageKey: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      linkedEntityType: 'business_profile',
      linkedEntityId: profile._id.toString(),
      tags: [],
      isVerified: false,
      isConfidential: false,
      createdBy: userId,
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: artifact._id.toString(),
        name: artifact.name,
        type: artifact.type,
        mimeType: artifact.mimeType,
        fileSize: artifact.fileSize,
        createdAt: artifact.createdAt,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * GET /app/uploads/:id
 * Download/view a file
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
    
    // Find artifact
    const artifact = await Artifact.findOne({ _id: id, tenantId }).lean();
    
    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found' },
      });
    }
    
    if (artifact.storageType !== 'file' || !artifact.storageKey) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_A_FILE', message: 'This document does not have an associated file' },
      });
    }
    
    const filePath = path.join(UPLOAD_DIR, artifact.storageKey);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_MISSING', message: 'File not found on disk' },
      });
    }
    
    // Set headers for download/view
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', artifact.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${disposition}; filename="${artifact.name}"`);
    res.setHeader('Content-Length', artifact.fileSize || 0);
    
    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /app/uploads/:id
 * Delete an uploaded file
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
    
    // Find artifact
    const artifact = await Artifact.findOne({ _id: id, tenantId });
    
    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found' },
      });
    }
    
    // Delete file from disk if it exists
    if (artifact.storageType === 'file' && artifact.storageKey) {
      const filePath = path.join(UPLOAD_DIR, artifact.storageKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete artifact record
    await Artifact.deleteOne({ _id: id, tenantId });
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Error handler for multer errors
router.use((error: any, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds 10MB limit' },
      });
    }
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: error.message },
    });
  }
  if (error.message && error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: error.message },
    });
  }
  next(error);
});

export default router;
