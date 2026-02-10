/**
 * Document Generator Component
 * Generates documents from templates using business profile data
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
} from 'lucide-react';
import axios from 'axios';

interface Template {
  type: string;
  name: string;
  description?: string;
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

export function DocumentGenerator({ onClose, onDocumentGenerated }: DocumentGeneratorProps) {
  const { accessToken } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<GeneratedDocument | null>(null);
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
        axios.get(`${API_URL}/app/documents/templates`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get(`${API_URL}/app/documents/generated`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      
      setTemplates(templatesRes.data.data || []);
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
        { templateType: selectedTemplate },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      const newDoc = response.data.data;
      setGeneratedDocs(prev => [newDoc, ...prev]);
      setViewingDoc(newDoc);
      setSuccessMessage('Document generated successfully!');
      setSelectedTemplate(null);
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

  const getTemplateLabel = (type: string) => {
    const labels: Record<string, string> = {
      articles_of_organization: 'Articles of Organization',
      articles_of_incorporation: 'Articles of Incorporation',
      operating_agreement: 'Operating Agreement',
      bylaws: 'Bylaws',
      ein_application: 'EIN Application Letter',
    };
    return labels[type] || type;
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Document Generator</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
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
              
              <div className="border rounded-lg p-6 bg-gray-50 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
                {viewingDoc.content}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Generate New */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Generate New Document</h3>
                {templates.length === 0 ? (
                  <p className="text-gray-500 text-sm">No templates available for your business type.</p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.type}
                        onClick={() => setSelectedTemplate(template.type)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedTemplate === template.type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className={`h-5 w-5 ${
                            selectedTemplate === template.type ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{template.name}</p>
                            {template.description && (
                              <p className="text-sm text-gray-500">{template.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedTemplate && (
                  <Button 
                    className="mt-4 w-full"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
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
                )}
              </div>

              {/* Previously Generated */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Previously Generated</h3>
                {generatedDocs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No documents generated yet.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-auto">
                    {generatedDocs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleViewDocument(doc)}
                        className="w-full p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {getTemplateLabel(doc.type)} • {doc.generatedAt ? new Date(doc.generatedAt).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            doc.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                            doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Documents are generated using your business profile information. Review carefully before use.
          </p>
        </div>
      </div>
    </div>
  );
}
