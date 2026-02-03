/**
 * Documents Page
 * Document repository and generation wizard
 * 
 * NOTE: Placeholder - full implementation in Module 3.
 */

import { FileText, Plus, Upload, FolderOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function DocumentsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Business documents and artifacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>
      
      {/* Categories */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-white border rounded-lg p-4 hover:border-blue-300 cursor-pointer">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900">Formation Documents</h3>
          <p className="text-sm text-gray-600 mt-1">0 documents</p>
        </div>
        <div className="bg-white border rounded-lg p-4 hover:border-blue-300 cursor-pointer">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900">Operational Documents</h3>
          <p className="text-sm text-gray-600 mt-1">0 documents</p>
        </div>
        <div className="bg-white border rounded-lg p-4 hover:border-blue-300 cursor-pointer">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900">Evidence and Confirmations</h3>
          <p className="text-sm text-gray-600 mt-1">0 documents</p>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg p-12 text-center">
        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h2>
        <p className="text-gray-600 mb-4">
          Documents will be generated and stored as you progress through business formation.
        </p>
      </div>
    </div>
  );
}
