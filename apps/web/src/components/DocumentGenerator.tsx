/**
 * Document Generator Component
 * Generates documents from templates using business profile data
 * Supports categorized templates for Business Transformation Platform
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Sparkles, 
  X, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Printer,
  ChevronDown,
  ChevronRight,
  Building2,
  Shield,
  DollarSign,
  Settings,
  ClipboardCheck,
  TrendingUp,
  Eye,
} from 'lucide-react';
import axios from 'axios';

interface Template {
  type: string;
  name: string;
  description?: string;
  category: string;
  priority: string;
  advisorReviewRequired: boolean;
}

interface TemplatesByCategory {
  categories: Record<string, Template[]>;
  categoryOrder: string[];
}

interface GeneratedDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  status: string;
  generatedAt?: string;
  hasContent?: boolean;
}

interface DocumentGeneratorProps {
  onClose: () => void;
  onDocumentGenerated?: () => void;
}

const CATEGORY_CONFIG: Record<string, { 
  label: string; 
  icon: typeof FileText; 
  color: string;
  description: string;
}> = {
  formation: { 
    label: 'Formation', 
    icon: Building2, 
    color: 'blue',
    description: 'Entity formation and organization documents',
  },
  governance: { 
    label: 'Governance', 
    icon: Shield, 
    color: 'purple',
    description: 'Corporate governance, resolutions, and policies',
  },
  financial: { 
    label: 'Financial', 
    icon: DollarSign, 
    color: 'green',
    description: 'Financial records, ownership, and distributions',
  },
  operations: { 
    label: 'Operations', 
    icon: Settings, 
    color: 'orange',
    description: 'Business processes, SOPs, and operational documents',
  },
  compliance: { 
    label: 'Compliance', 
    icon: ClipboardCheck, 
    color: 'red',
    description: 'Compliance calendars, licenses, and internal controls',
  },
  improvement: { 
    label: 'Improvement', 
    icon: TrendingUp, 
    color: 'teal',
    description: 'Lean Six Sigma, SIPOC, DMAIC, and continuous improvement',
  },
};

export function DocumentGenerator({ onClose, onDocumentGenerated }: DocumentGeneratorProps) {
  const { accessToken } = useAuthStore();
  const [templateData, setTemplateData] = useState<TemplatesByCategory | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewingDoc, setViewingDoc] = useState<GeneratedDocument | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['formation']));
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [templatesRes, generatedRes] = await Promise.all([
        axios.get(`${API_URL}/app/documents/templates?grouped=true`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get(`${API_URL}/app/documents/generated`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      
      setTemplateData(templatesRes.data.data || null);
      setGeneratedDocs(generatedRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await axios.post(
        `${API_URL}/app/documents/generate`,
        { templateType: selectedTemplate.type },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      const newDoc = response.data.data;
      setGeneratedDocs(prev => [newDoc, ...prev]);
      setViewingDoc(newDoc);
      setSuccessMessage('Document generated successfully!');
      setSelectedTemplate(null);
      setActiveTab('history');
      onDocumentGenerated?.();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewDocument = async (doc: GeneratedDocument) => {
    try {
      const response = await axios.get(
        `${API_URL}/app/documents/generated/${doc.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setViewingDoc(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load document');
    }
  };

  const handlePrint = () => {
    if (!viewingDoc?.content) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${viewingDoc.name}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              max-width: 8.5in;
              margin: 1in auto;
              padding: 0 0.5in;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: inherit;
              font-size: inherit;
              margin: 0;
            }
            @media print {
              body { margin: 0; padding: 0.5in; }
            }
          </style>
        </head>
        <body>
          <pre>${viewingDoc.content}</pre>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'required':
        return <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Required</span>;
      case 'recommended':
        return <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Recommended</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-center mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Document Generator</h2>
              <p className="text-sm text-gray-500">Generate professional documents from templates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => { setActiveTab('generate'); setViewingDoc(null); }}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'generate' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Generate New
          </button>
          <button
            onClick={() => { setActiveTab('history'); setViewingDoc(null); }}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Generated Documents ({generatedDocs.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {/* View Generated Document */}
          {viewingDoc ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{viewingDoc.name}</h3>
                  <p className="text-sm text-gray-500">
                    Generated {viewingDoc.generatedAt ? new Date(viewingDoc.generatedAt).toLocaleString() : 'recently'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" />
                    Print / PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setViewingDoc(null)}>
                    Back
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-6 bg-gray-50 font-mono text-sm whitespace-pre-wrap max-h-[60vh] overflow-auto">
                {viewingDoc.content}
              </div>
            </div>
          ) : activeTab === 'generate' ? (
            /* Generate New Tab */
            <div className="space-y-4">
              {templateData?.categoryOrder.map(category => {
                const config = CATEGORY_CONFIG[category] || { 
                  label: category, 
                  icon: FileText, 
                  color: 'gray',
                  description: '' 
                };
                const CategoryIcon = config.icon;
                const templates = templateData.categories[category] || [];
                const isExpanded = expandedCategories.has(category);
                
                if (templates.length === 0) return null;
                
                return (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-full flex items-center justify-between p-4 bg-gradient-to-r hover:opacity-90 transition-opacity ${
                        config.color === 'blue' ? 'from-blue-50 to-blue-100' :
                        config.color === 'purple' ? 'from-purple-50 to-purple-100' :
                        config.color === 'green' ? 'from-green-50 to-green-100' :
                        config.color === 'orange' ? 'from-orange-50 to-orange-100' :
                        config.color === 'red' ? 'from-red-50 to-red-100' :
                        config.color === 'teal' ? 'from-teal-50 to-teal-100' :
                        'from-gray-50 to-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon className={`h-5 w-5 ${
                          config.color === 'blue' ? 'text-blue-600' :
                          config.color === 'purple' ? 'text-purple-600' :
                          config.color === 'green' ? 'text-green-600' :
                          config.color === 'orange' ? 'text-orange-600' :
                          config.color === 'red' ? 'text-red-600' :
                          config.color === 'teal' ? 'text-teal-600' :
                          'text-gray-600'
                        }`} />
                        <div className="text-left">
                          <h3 className="font-medium text-gray-900">{config.label}</h3>
                          <p className="text-xs text-gray-500">{config.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{templates.length} templates</span>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>
                    
                    {/* Templates List */}
                    {isExpanded && (
                      <div className="p-2 space-y-1 bg-white">
                        {templates.map(template => (
                          <button
                            key={template.type}
                            onClick={() => setSelectedTemplate(template)}
                            className={`w-full p-3 rounded-lg text-left transition-colors ${
                              selectedTemplate?.type === template.type
                                ? 'bg-blue-100 border-2 border-blue-500'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <FileText className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                  selectedTemplate?.type === template.type ? 'text-blue-600' : 'text-gray-400'
                                }`} />
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">{template.name}</p>
                                  {template.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{template.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {getPriorityBadge(template.priority)}
                                {template.advisorReviewRequired && (
                                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    Review
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Generate Button */}
              {selectedTemplate && (
                <div className="sticky bottom-0 bg-white border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{selectedTemplate.name}</span>
                      {selectedTemplate.advisorReviewRequired && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Requires Advisor Review
                        </span>
                      )}
                    </div>
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Document
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-2">
              {generatedDocs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents generated yet.</p>
                  <p className="text-sm mt-1">Select a template and generate your first document.</p>
                </div>
              ) : (
                generatedDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleViewDocument(doc)}
                    className="w-full p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {doc.generatedAt ? new Date(doc.generatedAt).toLocaleDateString() : 'Recently generated'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          doc.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                          doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Documents are generated using your business profile information. Review all documents carefully before official use.
          </p>
        </div>
      </div>
    </div>
  );
}
