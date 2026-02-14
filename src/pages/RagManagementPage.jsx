import React, { useState } from 'react';
import DocumentList from '../components/rag/DocumentList';
import DocumentUpload from '../components/rag/DocumentUpload';
import { Database, LayoutDashboard, Settings } from 'lucide-react';

const RagManagementPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    // Trigger list refresh
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="h-8 w-8 text-indigo-600" />
            Gestión de Conocimiento (RAG)
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Administra los documentos que alimentan la base de conocimiento del asistente virtual. 
            Sube manuales, políticas y guías para mejorar las respuestas de la IA.
          </p>
        </div>

        {/* Stats Section (Placeholder for now, could be added later) */}
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Upload */}
          <div className="lg:col-span-1 space-y-6">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            
            {/* Tips Card */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Tips para mejores resultados
              </h4>
              <ul className="text-xs text-blue-800 space-y-2 list-disc list-inside">
                <li>Sube documentos con texto seleccionable (no imágenes escaneadas).</li>
                <li>Usa nombres de archivo descriptivos.</li>
                <li>Divide documentos muy grandes (&gt;50MB) en partes más pequeñas si falla la carga.</li>
                <li>Categoriza correctamente para facilitar filtros futuros.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-2">
            {/* Pass refreshTrigger to force re-fetch if needed, or just let the component handle its own state. 
                Actually DocumentList needs a way to know when to refresh. 
                I'll add a 'key' prop or expose a ref, but 'key' is simplest for full reload.
            */}
            <DocumentList key={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RagManagementPage;
