import React, { useState, useEffect } from 'react';
import EmailPreview from './wizards/EmailPreview';
import WhatsAppPreview from './WhatsAppPreview';
import { getTemplatePreview } from '../services/api';

// Función para traducir los motivos de rechazo de Meta (copiada de TemplateList.jsx)
const getTranslatedRejectionReason = (reason) => {
  switch (reason) {
    case 'NONE':
      return 'Sin razón específica';
    case 'INVALID_FORMAT':
      return 'Formato inválido';
    // Agrega más casos según sea necesario
    default:
      return reason || 'Razón desconocida';
  }
};

const TemplatePreviewModal = ({ template, onClose }) => {
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isRejected = template.status?.includes('REJECTED');

  // Mapeo de estados a texto amigable
  const getStatusInfo = (status) => {
    const statusMap = {
      'APPROVED': { text: 'Aprobada', color: 'text-green-600', icon: '✓' },
      'PENDING_INTERNAL_APPROVAL': { text: 'Pendiente Aprobación Interna', color: 'text-amber-600', icon: '⏳' },
      'PENDING_OPERATIONS_APPROVAL': { text: 'Pendiente Aprobación Operaciones', color: 'text-amber-600', icon: '⏳' },
      'PENDING_META_APPROVAL': { text: 'Pendiente Aprobación Meta', color: 'text-orange-600', icon: '⏳' },
      'PENDING': { text: 'Pendiente', color: 'text-amber-600', icon: '⏳' },
      'REJECTED_INTERNAL': { text: 'Rechazada (Interno)', color: 'text-red-600', icon: '✗' },
      'REJECTED_OPERATIONS': { text: 'Rechazada (Operaciones)', color: 'text-red-600', icon: '✗' },
      'REJECTED_META': { text: 'Rechazada (Meta)', color: 'text-red-600', icon: '✗' },
      'REJECTED': { text: 'Rechazada', color: 'text-red-600', icon: '✗' },
      'DRAFT': { text: 'Borrador', color: 'text-blue-600', icon: '📝' },
    };
    return statusMap[status] || { text: status || 'Desconocido', color: 'text-gray-600', icon: '•' };
  };

  const statusInfo = getStatusInfo(template.status);

  // Cargar preview con signed URLs cuando el modal se abre (solo para WhatsApp)
  useEffect(() => {
    const fetchPreview = async () => {
      if (template.channel_type !== 'WHATSAPP') return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTemplatePreview(template.id);
        setPreviewData(data);
      } catch (err) {
        console.error('Error al obtener preview de plantilla:', err);
        setError('No se pudo cargar la vista previa de medios');
        // Fallback: usar los componentes originales de la plantilla
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [template.id, template.channel_type]);

  // Obtiene los componentes de WhatsApp, priorizando los del preview (con public_url)
  const getWhatsAppComponents = () => {
    // Si tenemos datos del preview, usarlos (incluyen public_url con signed URLs)
    if (previewData?.components) {
      return previewData.components;
    }
    
    // Fallback: extraer componentes de la plantilla original (sin signed URLs)
    if (!template) return {};
    if (template.components && typeof template.components === 'object') {
      return template.components;
    }
    const content = template.content;
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          return parsed.components || parsed;
        }
      } catch (e) {
        // Si no es JSON, tratamos el contenido como body.text plano
        return { body: { text: content } };
      }
    }
    return {};
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header del modal */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Visualizar Plantilla</h2>
            <p className="text-sm text-gray-500 mt-0.5">{template.name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            template.channel_type === 'WHATSAPP' ? 'bg-green-100 text-green-700' :
            template.channel_type === 'EMAIL' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {template.channel_type === 'WHATSAPP' && '📱 '}
            {template.channel_type === 'EMAIL' && '✉️ '}
            {template.channel_type}
          </span>
        </div>
        
        {/* Contenido principal - 2 columnas para WhatsApp */}
        <div className="flex-1 overflow-y-auto">
          {template.channel_type === 'WHATSAPP' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 h-full">
              {/* Columna izquierda - Información (2/5) */}
              <div className="lg:col-span-2 p-6 border-r border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Información de la Plantilla</h3>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <label className="text-xs font-medium text-gray-400 uppercase">Nombre</label>
                    <p className="text-gray-800 font-medium mt-1">{template.name}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <label className="text-xs font-medium text-gray-400 uppercase">Creado por</label>
                    <p className="text-gray-800 mt-1">{template.creator?.full_name || 'Usuario desconocido'}</p>
                    {template.creator?.email && (
                      <p className="text-gray-500 text-sm">{template.creator.email}</p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <label className="text-xs font-medium text-gray-400 uppercase">Estado</label>
                    <p className={`mt-1 font-medium ${statusInfo.color}`}>
                      {statusInfo.icon} {statusInfo.text}
                    </p>
                  </div>

                  {isRejected && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <label className="text-xs font-medium text-red-500 uppercase">Motivo de Rechazo</label>
                      <p className="text-red-700 mt-1">
                        {template.status === 'REJECTED_META' 
                          ? getTranslatedRejectionReason(template.rejection_reason) 
                          : (template.rejection_reason || 'No se proporcionó una razón específica.')}
                      </p>
                      {template.reviewed_at && (
                        <p className="text-red-600 text-sm mt-2">
                          📅 {new Date(template.reviewed_at).toLocaleString()}
                        </p>
                      )}
                      {template.reviewer?.full_name && (
                        <p className="text-red-600 text-sm">
                          👤 Revisado por: {template.reviewer.full_name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Columna derecha - Vista previa WhatsApp (3/5) */}
              <div className="lg:col-span-3 p-6 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Vista Previa</h3>
                
                {isLoading ? (
                  <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
                      <span className="mt-3 text-gray-600 block">Cargando vista previa...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="text-amber-600 text-sm mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                        ⚠️ {error}
                      </div>
                    )}
                    <div className="flex-1 flex items-start justify-center">
                      <WhatsAppPreview components={getWhatsAppComponents()} compact={true} />
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Layout para EMAIL y otros canales */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-400 uppercase">Nombre</label>
                  <p className="text-gray-800 font-medium mt-1">{template.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-400 uppercase">Creado por</label>
                  <p className="text-gray-800 mt-1">{template.creator?.full_name || 'Usuario desconocido'}</p>
                </div>
                {template.subject && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-400 uppercase">Asunto</label>
                    <p className="text-gray-800 mt-1">{template.subject}</p>
                  </div>
                )}
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <span className="text-sm font-medium text-gray-600">Contenido</span>
                </div>
                {template.channel_type === 'EMAIL' ? (
                  <EmailPreview subject={template.subject} htmlContent={template.content} />
                ) : (
                  <div className="p-4 bg-white whitespace-pre-wrap text-gray-700">
                    {template.content}
                  </div>
                )}
              </div>

              {isRejected && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-700 mb-2">Detalles de Rechazo</h3>
                  <p className="text-sm text-red-800">
                    <strong>Razón:</strong> {template.status === 'REJECTED_META' 
                                              ? getTranslatedRejectionReason(template.rejection_reason) 
                                              : (template.rejection_reason || 'No se proporcionó una razón específica.')}
                  </p>
                  {template.reviewed_at && (
                    <p className="text-sm text-red-800 mt-1">
                      <strong>Fecha:</strong> {new Date(template.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer del modal */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
