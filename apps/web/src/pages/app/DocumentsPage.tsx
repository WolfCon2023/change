/**
 * Documents Page
 * Document repository with categories and management
 */

import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  FolderOpen, 
  Building2, 
  Briefcase, 
  CheckCircle,
  Eye,
  Trash2,
  X,
  Search,
  Clock,
  Shield,
  AlertCircle,
  Upload,
  Download,
  File,
  Image,
  FileType,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useDocuments, useCreateDocument, useDeleteDocument, useUploadFile, type Document } from '../../lib/app-api';

// Document type configurations
const DOCUMENT_TYPES = {
  // Formation
  sos_filing: { label: 'SOS Filing', category: 'formation', icon: Building2 },
  articles_of_organization: { label: 'Articles of Organization', category: 'formation', icon: FileText },
  articles_of_incorporation: { label: 'Articles of Incorporation', category: 'formation', icon: FileText },
  formation_certificate: { label: 'Formation Certificate', category: 'formation', icon: CheckCircle },
  // Operational
  operating_agreement: { label: 'Operating Agreement', category: 'operational', icon: FileText },
  bylaws: { label: 'Bylaws', category: 'operational', icon: FileText },
  ein_application: { label: 'EIN Application', category: 'operational', icon: FileText },
  bank_statement: { label: 'Bank Statement', category: 'operational', icon: Briefcase },
  business_license: { label: 'Business License', category: 'operational', icon: Shield },
  // Evidence
  ein_confirmation: { label: 'EIN Confirmation', category: 'evidence', icon: CheckCircle },
  screenshot: { label: 'Screenshot', category: 'evidence', icon: Eye },
  confirmation: { label: 'Confirmation', category: 'evidence', icon: CheckCircle },
  receipt: { label: 'Receipt', category: 'evidence', icon: FileText },
  // Generic
  document: { label: 'Document', category: 'evidence', icon: FileText },
};

const CATEGORY_CONFIG = {
  formation: { 
    label: 'Formation Documents', 
    description: 'Articles, certificates, and state filings',
    icon: Building2, 
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  operational: { 
    label: 'Operational Documents', 
    description: 'Agreements, applications, and ongoing records',
    icon: Briefcase, 
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  evidence: { 
    label: 'Evidence and Confirmations', 
    description: 'Screenshots, confirmations, and receipts',
    icon: CheckCircle, 
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
};

export default function DocumentsPage() {
  const { data, isLoading, error } = useDocuments();
  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();
  const uploadFileMutation = useUploadFile();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<Document | null>(null);
  const [newDocument, setNewDocument] = useState({
    name: '',
    description: '',
    type: 'document',
    textContent: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDetails, setUploadDetails] = useState({
    name: '',
    description: '',
    type: 'document',
  });
  const [uploadProgress, setUploadProgress] = useState(false);
  
  // Filter documents
  const filteredDocuments = data?.documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || 
      DOCUMENT_TYPES[doc.type as keyof typeof DOCUMENT_TYPES]?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];
  
  // Handle create document
  const handleCreateDocument = async () => {
    if (!newDocument.name.trim()) return;
    
    await createDocumentMutation.mutateAsync({
      name: newDocument.name,
      description: newDocument.description,
      type: newDocument.type,
      storageType: 'text',
      textContent: newDocument.textContent,
    });
    
    setShowAddModal(false);
    setNewDocument({ name: '', description: '', type: 'document', textContent: '' });
  };
  
  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    setUploadProgress(true);
    try {
      await uploadFileMutation.mutateAsync({
        file: uploadFile,
        name: uploadDetails.name || uploadFile.name,
        description: uploadDetails.description,
        type: uploadDetails.type,
      });
      
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDetails({ name: '', description: '', type: 'document' });
    } finally {
      setUploadProgress(false);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setUploadFile(file);
      setUploadDetails(prev => ({ ...prev, name: file.name }));
    }
  };
  
  // Get file icon based on mime type
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return FileType;
    return File;
  };
  
  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Get download URL
  const getDownloadUrl = (docId: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    return `${baseUrl}/app/uploads/${docId}?download=true`;
  };
  
  // Get view URL
  const getViewUrl = (docId: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    return `${baseUrl}/app/uploads/${docId}`;
  };
  
  // Handle delete document
  const handleDeleteDocument = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocumentMutation.mutateAsync(id);
    }
  };
  
  // Get document type info
  const getDocTypeInfo = (type: string) => {
    return DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES] || DOCUMENT_TYPES.document;
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Documents</h2>
          <p className="text-red-700">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Business documents and artifacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>
      
      {/* Category cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = data?.counts[key as keyof typeof data.counts] || 0;
          const isSelected = selectedCategory === key;
          
          return (
            <div 
              key={key}
              onClick={() => setSelectedCategory(isSelected ? null : key)}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected ? `${config.borderColor} ring-2 ring-${config.color}-200` : 'hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              <h3 className="font-medium text-gray-900">{config.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
              <p className="text-sm text-gray-600 mt-2 font-medium">{count} document{count !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>
      
      {/* Search and filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedCategory && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Clear Filter
            <X className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      
      {/* Documents list */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || selectedCategory ? 'No Matching Documents' : 'No Documents Yet'}
          </h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria.'
              : 'Documents will be generated and stored as you progress through business formation.'}
          </p>
          {!searchTerm && !selectedCategory && (
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Document
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDocuments.map(doc => {
                const typeInfo = getDocTypeInfo(doc.type);
                const categoryConfig = CATEGORY_CONFIG[typeInfo.category as keyof typeof CATEGORY_CONFIG];
                const isFile = doc.storageType === 'file';
                const FileIcon = isFile ? getFileIcon(doc.mimeType) : typeInfo.icon;
                
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${categoryConfig.iconBg} rounded-lg flex items-center justify-center`}>
                          <FileIcon className={`h-4 w-4 ${categoryConfig.iconColor}`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {doc.description && (
                              <span className="truncate max-w-[200px]">{doc.description}</span>
                            )}
                            {isFile && doc.fileSize && (
                              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                {formatFileSize(doc.fileSize)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${categoryConfig.bgColor} ${categoryConfig.iconColor}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(doc.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isFile ? (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 flex items-center gap-1 w-fit">
                          <File className="h-3 w-3" />
                          File
                        </span>
                      ) : doc.isVerified ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                          Note
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isFile && (
                          <a
                            href={getDownloadUrl(doc.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => isFile ? window.open(getViewUrl(doc.id), '_blank') : setShowViewModal(doc)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Document</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="docName">Document Name *</Label>
                <Input
                  id="docName"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                  placeholder="e.g., EIN Confirmation Letter"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="docType">Document Type</Label>
                <select
                  id="docType"
                  value={newDocument.type}
                  onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                >
                  <optgroup label="Formation">
                    <option value="sos_filing">SOS Filing</option>
                    <option value="articles_of_organization">Articles of Organization</option>
                    <option value="articles_of_incorporation">Articles of Incorporation</option>
                    <option value="formation_certificate">Formation Certificate</option>
                  </optgroup>
                  <optgroup label="Operational">
                    <option value="operating_agreement">Operating Agreement</option>
                    <option value="bylaws">Bylaws</option>
                    <option value="ein_application">EIN Application</option>
                    <option value="bank_statement">Bank Statement</option>
                    <option value="business_license">Business License</option>
                  </optgroup>
                  <optgroup label="Evidence">
                    <option value="ein_confirmation">EIN Confirmation</option>
                    <option value="screenshot">Screenshot</option>
                    <option value="confirmation">Confirmation</option>
                    <option value="receipt">Receipt</option>
                    <option value="document">Other Document</option>
                  </optgroup>
                </select>
              </div>
              
              <div>
                <Label htmlFor="docDesc">Description</Label>
                <Input
                  id="docDesc"
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  placeholder="Brief description of the document"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="docContent">Content / Notes</Label>
                <textarea
                  id="docContent"
                  value={newDocument.textContent}
                  onChange={(e) => setNewDocument({ ...newDocument, textContent: e.target.value })}
                  placeholder="Paste document content or add notes..."
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[100px]"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateDocument}
                disabled={!newDocument.name.trim() || createDocumentMutation.isPending}
              >
                {createDocumentMutation.isPending ? 'Adding...' : 'Add Document'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* View Document Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{showViewModal.name}</h3>
                <p className="text-sm text-gray-500">{getDocTypeInfo(showViewModal.type).label}</p>
              </div>
              <button onClick={() => setShowViewModal(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {showViewModal.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-gray-600">{showViewModal.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Added</h4>
                  <p className="text-gray-600">{formatDate(showViewModal.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
                  <p className="text-gray-600">{showViewModal.isVerified ? 'Verified' : 'Stored'}</p>
                </div>
              </div>
              
              {showViewModal.textContent && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                  <div className="bg-gray-50 border rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {showViewModal.textContent}
                  </div>
                </div>
              )}
              
              {showViewModal.jsonContent && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Data</h4>
                  <pre className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700 overflow-auto">
                    {JSON.stringify(showViewModal.jsonContent, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end">
              <Button variant="outline" onClick={() => setShowViewModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* File drop zone */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  uploadFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  type="file"
                  id="fileUpload"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt"
                />
                {uploadFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                    <p className="font-medium text-green-700">{uploadFile.name}</p>
                    <p className="text-sm text-green-600">{formatFileSize(uploadFile.size)}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('fileUpload')?.click()}
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">Choose a file to upload</p>
                    <p className="text-sm text-gray-500 mt-1">PDF, PNG, JPG, GIF, DOC, DOCX, TXT (max 10MB)</p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => document.getElementById('fileUpload')?.click()}
                    >
                      Select File
                    </Button>
                  </>
                )}
              </div>
              
              {uploadFile && (
                <>
                  <div>
                    <Label htmlFor="uploadName">Document Name</Label>
                    <Input
                      id="uploadName"
                      value={uploadDetails.name}
                      onChange={(e) => setUploadDetails({ ...uploadDetails, name: e.target.value })}
                      placeholder="Enter document name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="uploadType">Document Type</Label>
                    <select
                      id="uploadType"
                      value={uploadDetails.type}
                      onChange={(e) => setUploadDetails({ ...uploadDetails, type: e.target.value })}
                      className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <optgroup label="Formation">
                        <option value="sos_filing">SOS Filing</option>
                        <option value="articles_of_organization">Articles of Organization</option>
                        <option value="articles_of_incorporation">Articles of Incorporation</option>
                        <option value="formation_certificate">Formation Certificate</option>
                      </optgroup>
                      <optgroup label="Operational">
                        <option value="operating_agreement">Operating Agreement</option>
                        <option value="bylaws">Bylaws</option>
                        <option value="ein_application">EIN Application</option>
                        <option value="bank_statement">Bank Statement</option>
                        <option value="business_license">Business License</option>
                      </optgroup>
                      <optgroup label="Evidence">
                        <option value="ein_confirmation">EIN Confirmation</option>
                        <option value="screenshot">Screenshot</option>
                        <option value="confirmation">Confirmation</option>
                        <option value="receipt">Receipt</option>
                        <option value="document">Other Document</option>
                      </optgroup>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="uploadDesc">Description (optional)</Label>
                    <Input
                      id="uploadDesc"
                      value={uploadDetails.description}
                      onChange={(e) => setUploadDetails({ ...uploadDetails, description: e.target.value })}
                      placeholder="Brief description"
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShowUploadModal(false); setUploadFile(null); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleFileUpload}
                disabled={!uploadFile || uploadProgress}
              >
                {uploadProgress ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
