/**
 * Document Editor Component
 * Interactive document viewer with fillable fields, signatures, and email capability
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Send, 
  Download, 
  Pen, 
  FileText,
  Mail,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SignaturePad } from './SignaturePad';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface DocumentEditorProps {
  document: {
    id: string;
    name: string;
    type: string;
    textContent?: string;
    jsonContent?: Record<string, unknown>;
    storageType?: string;
  };
  onClose: () => void;
  onSave?: () => void;
}

// Pattern to match fillable fields: _____ (5+ underscores) or [FIELD_NAME]
const FILLABLE_FIELD_PATTERN = /_{5,}|\[([A-Z_]+)\]/g;

// Common fillable field labels
const FIELD_LABELS: Record<string, string> = {
  'COUNTY': 'County',
  'STATE': 'State (for notarization)',
  'CITY': 'City',
  'DATE': 'Date',
  'NAME': 'Name',
  'TITLE': 'Title',
  'WITNESS_NAME': 'Witness Name',
  'NOTARY_NAME': 'Notary Name',
  'COMMISSION_EXPIRES': 'Commission Expires',
};

export function DocumentEditor({ document, onClose, onSave }: DocumentEditorProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState(document.textContent || document.content || '');
  const [fillableFields, setFillableFields] = useState<Record<string, string>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    subject: `Document: ${document.name}`,
    message: '',
  });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Parse document content to find fillable fields
  const detectedFields = useMemo(() => {
    const fields: { id: string; label: string; position: number }[] = [];
    let match;
    let index = 0;
    
    // Reset regex
    FILLABLE_FIELD_PATTERN.lastIndex = 0;
    
    while ((match = FILLABLE_FIELD_PATTERN.exec(content)) !== null) {
      const fieldId = match[1] || `field_${index}`;
      const label = FIELD_LABELS[match[1]] || `Field ${index + 1}`;
      
      // Check context for better labels
      const contextBefore = content.substring(Math.max(0, match.index - 30), match.index);
      let contextLabel = label;
      
      if (contextBefore.toLowerCase().includes('county')) {
        contextLabel = 'County';
      } else if (contextBefore.toLowerCase().includes('state of')) {
        contextLabel = 'State';
      } else if (contextBefore.toLowerCase().includes('day of')) {
        contextLabel = 'Day';
      } else if (contextBefore.toLowerCase().includes('month')) {
        contextLabel = 'Month';
      } else if (contextBefore.toLowerCase().includes('year')) {
        contextLabel = 'Year';
      } else if (contextBefore.toLowerCase().includes('notary')) {
        contextLabel = 'Notary Public';
      } else if (contextBefore.toLowerCase().includes('commission')) {
        contextLabel = 'Commission Expiration';
      } else if (contextBefore.toLowerCase().includes('witness')) {
        contextLabel = 'Witness';
      }
      
      fields.push({
        id: fieldId,
        label: contextLabel,
        position: match.index,
      });
      index++;
    }
    
    return fields;
  }, [content]);

  // Initialize fillable fields
  useEffect(() => {
    const initial: Record<string, string> = {};
    detectedFields.forEach(field => {
      initial[field.id] = fillableFields[field.id] || '';
    });
    setFillableFields(initial);
  }, [detectedFields]);

  // Update content with filled values
  const processedContent = useMemo(() => {
    let result = content;
    let offset = 0;
    
    FILLABLE_FIELD_PATTERN.lastIndex = 0;
    let match;
    let index = 0;
    
    const matches: { start: number; end: number; fieldId: string }[] = [];
    
    while ((match = FILLABLE_FIELD_PATTERN.exec(content)) !== null) {
      const fieldId = match[1] || `field_${index}`;
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        fieldId,
      });
      index++;
    }
    
    // Replace from end to start to maintain positions
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const value = fillableFields[m.fieldId];
      if (value) {
        result = result.substring(0, m.start) + value + result.substring(m.end);
      }
    }
    
    return result;
  }, [content, fillableFields]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      await api.put(`/app/documents/${document.id}/content`, {
        content: processedContent,
        signature,
        signatureName,
        fillableFields,
      });
      
      setSuccess('Document saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      onSave?.();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  // Handle send email
  const handleSendEmail = async () => {
    if (!emailData.to.trim()) {
      setError('Please enter a recipient email address');
      return;
    }
    
    setSending(true);
    setError(null);
    
    try {
      await api.post(`/app/documents/${document.id}/send`, {
        to: emailData.to.split(',').map(e => e.trim()),
        cc: emailData.cc ? emailData.cc.split(',').map(e => e.trim()) : [],
        subject: emailData.subject,
        message: emailData.message,
        content: processedContent,
        signature,
      });
      
      setShowEmailModal(false);
      setSuccess('Document sent successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send document');
    } finally {
      setSending(false);
    }
  };

  // Handle signature change
  const handleSignatureChange = (sigData: string | null, name?: string) => {
    setSignature(sigData);
    if (name) setSignatureName(name);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-500">Edit document and add signature</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Success/Error messages */}
        {(success || error) && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm">{success || error}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Document preview */}
          <div className="flex-1 overflow-y-auto p-6 border-r">
            <div className="bg-gray-50 border rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {processedContent}
              
              {/* Signature area */}
              {signature && (
                <div className="mt-8 pt-4 border-t">
                  <img src={signature} alt="Signature" className="h-16 mb-2" />
                  <p className="text-sm">{signatureName}</p>
                  <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fillable fields panel */}
          <div className="w-80 overflow-y-auto p-4 bg-gray-50 flex-shrink-0">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Pen className="h-4 w-4" />
              Fillable Fields
            </h3>
            
            {detectedFields.length === 0 ? (
              <p className="text-sm text-gray-500">No fillable fields detected in this document.</p>
            ) : (
              <div className="space-y-3">
                {detectedFields.map((field, index) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id} className="text-xs">
                      {field.label}
                    </Label>
                    <Input
                      id={field.id}
                      value={fillableFields[field.id] || ''}
                      onChange={(e) => setFillableFields(prev => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="mt-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Signature section */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Pen className="h-4 w-4" />
                Digital Signature
              </h3>
              
              {signature ? (
                <div className="space-y-3">
                  <div className="bg-white border rounded-lg p-3">
                    <img src={signature} alt="Your signature" className="h-12 mx-auto" />
                    <p className="text-xs text-center text-gray-500 mt-2">{signatureName}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSignature(null);
                      setShowSignaturePad(true);
                    }}
                  >
                    Change Signature
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSignaturePad(true)}
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Add Signature
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Send via Email
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Document
            </Button>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Your Signature</h3>
              <button onClick={() => setShowSignaturePad(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <SignaturePad
              onSignatureChange={handleSignatureChange}
              signerName={user ? `${user.firstName} ${user.lastName}` : ''}
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowSignaturePad(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => setShowSignaturePad(false)}
                disabled={!signature}
              >
                Apply Signature
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Document
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailTo">To *</Label>
                <Input
                  id="emailTo"
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="recipient@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
              </div>
              
              <div>
                <Label htmlFor="emailCc">CC</Label>
                <Input
                  id="emailCc"
                  type="email"
                  value={emailData.cc}
                  onChange={(e) => setEmailData(prev => ({ ...prev, cc: e.target.value }))}
                  placeholder="cc@example.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="emailSubject">Subject</Label>
                <Input
                  id="emailSubject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="emailMessage">Message (optional)</Label>
                <textarea
                  id="emailMessage"
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a personal message..."
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={sending || !emailData.to.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
