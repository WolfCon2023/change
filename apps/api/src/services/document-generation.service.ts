/**
 * Document Generation Service
 * Generates documents from templates by replacing merge fields with actual data
 */

import mongoose from 'mongoose';
import { DocumentType, DocumentStatus, type DocumentTypeValue } from '@change/shared';
import { DocumentTemplate, DocumentInstance, BusinessProfile, Person } from '../db/models/index.js';
import type { IBusinessProfile } from '../db/models/business-profile.model.js';
import type { IMergeField } from '../db/models/document-template.model.js';

interface GenerateDocumentParams {
  templateType: DocumentTypeValue;
  tenantId: string;
  businessProfileId: string;
  userId: string;
  customData?: Record<string, string>;
}

interface GeneratedDocument {
  id: string;
  name: string;
  type: DocumentTypeValue;
  content: string;
  status: string;
}

class DocumentGenerationService {
  /**
   * Generate a document from a template
   */
  async generateDocument(params: GenerateDocumentParams): Promise<GeneratedDocument> {
    const { templateType, tenantId, businessProfileId, userId, customData = {} } = params;

    // Find the latest template for this type
    const template = await DocumentTemplate.findOne({
      type: templateType,
      isActive: true,
      isLatestVersion: true,
    });

    if (!template) {
      throw new Error(`No active template found for type: ${templateType}`);
    }

    // Get business profile
    const profile = await BusinessProfile.findById(businessProfileId);
    if (!profile) {
      throw new Error('Business profile not found');
    }

    // Get owners/persons for this business
    const persons = await Person.find({ tenantId }).lean();

    // Build merge data from profile and persons
    const mergeData = this.buildMergeData(template.mergeFields, profile, persons, customData);

    // Replace merge fields in template content
    const generatedContent = this.replaceMergeFields(template.content, mergeData);

    // Create document instance
    const docInstance = new DocumentInstance({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      templateId: template._id,
      templateVersion: template.version,
      businessProfileId: new mongoose.Types.ObjectId(businessProfileId),
      name: `${template.name} - ${profile.businessName || 'Draft'}`,
      type: templateType,
      status: DocumentStatus.DRAFT,
      content: generatedContent,
      mergeData,
      generatedAt: new Date(),
      generatedBy: new mongoose.Types.ObjectId(userId),
      versionHistory: [{
        version: 1,
        content: generatedContent,
        createdAt: new Date(),
        createdBy: new mongoose.Types.ObjectId(userId),
        notes: 'Initial generation',
      }],
    });

    await docInstance.save();

    return {
      id: docInstance._id.toString(),
      name: docInstance.name,
      type: docInstance.type,
      content: generatedContent,
      status: docInstance.status,
    };
  }

  /**
   * Build merge data from business profile and persons
   */
  private buildMergeData(
    mergeFields: IMergeField[],
    profile: IBusinessProfile,
    persons: any[],
    customData: Record<string, string>
  ): Record<string, string> {
    const data: Record<string, string> = {};

    for (const field of mergeFields) {
      let value: string = '';

      if (customData[field.key]) {
        // Custom data takes precedence
        value = customData[field.key];
      } else if (field.source === 'business_profile' && field.sourcePath) {
        // Get value from business profile
        value = this.getNestedValue(profile, field.sourcePath) || '';
      } else if (field.source === 'person' && field.sourcePath) {
        // Get value from persons (e.g., first owner)
        const primaryOwner = persons.find(p => p.isPrimaryContact) || persons[0];
        if (primaryOwner) {
          value = this.getNestedValue(primaryOwner, field.sourcePath) || '';
        }
      }

      // Apply default value if empty and default exists
      if (!value && field.defaultValue) {
        value = field.defaultValue;
      }

      data[field.key] = value;
    }

    // Add common dynamic fields
    data['date'] = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    data['year'] = new Date().getFullYear().toString();

    // Add formatted registered agent info
    if (profile.registeredAgent) {
      data['registeredAgentName'] = profile.registeredAgent.name || '';
      const raAddr = profile.registeredAgent.address;
      if (raAddr) {
        data['registeredAgentAddress'] = this.formatAddress(raAddr);
      }
    }

    // Add formatted business address
    if (profile.principalAddress) {
      data['businessAddress'] = this.formatAddress(profile.principalAddress);
    }

    // Add owner names
    const ownerNames = persons
      .filter(p => p.ownershipPercentage && p.ownershipPercentage > 0)
      .map(p => `${p.firstName} ${p.lastName}`)
      .join(', ');
    data['ownerNames'] = ownerNames;

    // Add signatory (first owner or primary contact)
    const signatory = persons.find(p => p.isPrimaryContact) || persons[0];
    if (signatory) {
      data['signatoryName'] = `${signatory.firstName} ${signatory.lastName}`;
      data['signatoryTitle'] = signatory.title || 'Member';
    }

    return data;
  }

  /**
   * Get nested value from object using dot notation path
   */
  private getNestedValue(obj: any, path: string): string {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return '';
      }
      current = current[part];
    }

    if (current === null || current === undefined) {
      return '';
    }

    return String(current);
  }

  /**
   * Format address object into string
   */
  private formatAddress(addr: any): string {
    const parts = [];
    if (addr.street1) parts.push(addr.street1);
    if (addr.street2) parts.push(addr.street2);
    
    const cityStateZip = [];
    if (addr.city) cityStateZip.push(addr.city);
    if (addr.state) cityStateZip.push(addr.state);
    if (addr.zip || addr.zipCode) cityStateZip.push(addr.zip || addr.zipCode);
    
    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '));
    }
    
    return parts.join('\n');
  }

  /**
   * Replace merge fields in content with actual values
   */
  private replaceMergeFields(content: string, data: Record<string, string>): string {
    let result = content;

    for (const [key, value] of Object.entries(data)) {
      // Replace {{key}} patterns
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(pattern, value || '_______________');
    }

    // Replace any remaining unfilled merge fields with blanks
    result = result.replace(/\{\{[^}]+\}\}/g, '_______________');

    return result;
  }

  /**
   * Get available templates for a business type and state
   */
  async getAvailableTemplates(
    businessType?: string,
    state?: string
  ): Promise<Array<{ type: string; name: string; description?: string }>> {
    const filter: any = {
      isActive: true,
      isLatestVersion: true,
    };

    if (businessType) {
      filter.applicableBusinessTypes = businessType;
    }

    const templates = await DocumentTemplate.find(filter)
      .select('type name description')
      .lean();

    // Filter by state if provided
    return templates
      .filter((t: any) => {
        if (!state || !t.applicableStates || t.applicableStates.length === 0) {
          return true;
        }
        return t.applicableStates.includes(state);
      })
      .map((t: any) => ({
        type: t.type,
        name: t.name,
        description: t.description,
      }));
  }

  /**
   * Regenerate an existing document with updated data
   */
  async regenerateDocument(
    documentId: string,
    userId: string,
    customData?: Record<string, string>
  ): Promise<GeneratedDocument> {
    const doc = await DocumentInstance.findById(documentId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // Get the template
    const template = await DocumentTemplate.findById(doc.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Get business profile
    const profile = await BusinessProfile.findById(doc.businessProfileId);
    if (!profile) {
      throw new Error('Business profile not found');
    }

    // Get persons
    const persons = await Person.find({ tenantId: doc.tenantId }).lean();

    // Build new merge data
    const mergeData = this.buildMergeData(
      template.mergeFields,
      profile,
      persons,
      customData || {}
    );

    // Generate new content
    const generatedContent = this.replaceMergeFields(template.content, mergeData);

    // Update document
    doc.content = generatedContent;
    doc.mergeData = mergeData;
    doc.generatedAt = new Date();
    doc.generatedBy = new mongoose.Types.ObjectId(userId);
    doc.status = DocumentStatus.DRAFT;
    doc.addVersionEntry(generatedContent, new mongoose.Types.ObjectId(userId), 'Regenerated');

    await doc.save();

    return {
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type,
      content: generatedContent,
      status: doc.status,
    };
  }
}

export const documentGenerationService = new DocumentGenerationService();
