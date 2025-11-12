import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, Eye } from 'lucide-react';
import { getCommunicationTemplates, getCommunicationTemplate } from '../services/api';

const CommunicationStep2 = ({ communicationType, onNext, onBack, step1Data }) => {
  const [formData, setFormData] = useState({
    selectedTemplateId: '',
  });

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Cargar plantillas desde el endpoint
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      // Pasar status_filter='APPROVED' como parámetro al endpoint
      const data = await getCommunicationTemplates('APPROVED');
      setTemplates(data || []);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Cargar preview de plantilla seleccionada
  const fetchTemplatePreview = async (templateId) => {
    setLoadingPreview(true);
    try {
      const data = await getCommunicationTemplate(templateId);
      setPreviewContent(data);
    } catch (error) {
      console.error('Error cargando preview:', error);
      setPreviewContent(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({ ...prev, selectedTemplateId: template.id }));
    setErrors({});
    fetchTemplatePreview(template.id);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.selectedTemplateId) {
      newErrors.selectedTemplateId = 'Debes seleccionar una plantilla';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Si es sin aprobación, pasar type: AUTOMATIC
      const submissionData = {
        ...formData,
        selectedTemplate: selectedTemplate,
        previewContent: previewContent,
      };

      // Agregar type: AUTOMATIC si tipoAprobacion es sin_aprobacion
      if (step1Data?.tipoAprobacion === 'sin_aprobacion') {
        submissionData.type = 'AUTOMATIC';
      }

      onNext(submissionData);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-lg p-3 mb-3">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <span className="text-lg">📋</span> Seleccionar Plantilla
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Estado: <span className="font-semibold text-slate-900">APROBADA</span>
        </p>
      </div>

      {/* Contenido Principal - 2 Columnas */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* Columna 1: Lista de Plantillas */}
        <div className="flex flex-col bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-3 overflow-hidden">
          <h4 className="font-semibold text-emerald-900 text-sm mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-700" />
            Plantillas Disponibles
          </h4>

          {loadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-emerald-700">Cargando plantillas...</p>
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`p-2.5 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedTemplate?.id === template.id
                        ? 'border-emerald-600 bg-emerald-100 shadow-md shadow-emerald-200'
                        : 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-emerald-900 text-xs truncate">
                          {template.name}
                        </p>
                        <p className="text-xs text-emerald-700 line-clamp-2 mt-0.5">
                          {template.description}
                        </p>
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                            ✓ {template.status || 'APPROVED'}
                          </span>
                          <span className="text-xs text-emerald-600">
                            {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-emerald-600">No hay plantillas disponibles</p>
                </div>
              )}
            </div>
          )}

          {errors.selectedTemplateId && (
            <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.selectedTemplateId}
            </div>
          )}
        </div>

        {/* Columna 2: Preview */}
        <div className="flex flex-col bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 overflow-hidden">
          <h4 className="font-semibold text-purple-900 text-sm mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-700" />
            Vista Previa
          </h4>

          {selectedTemplate ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {loadingPreview ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-purple-700">Cargando preview...</p>
                </div>
              ) : (
                <>
                  {/* Información de la plantilla */}
                  <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-2 mb-2 border border-purple-300">
                    <p className="font-semibold text-purple-900 text-xs">{selectedTemplate.name}</p>
                    <p className="text-xs text-purple-800 mt-0.5">{selectedTemplate.description}</p>
                  </div>

                  {/* Contenido del preview */}
                  <div className="flex-1 bg-white rounded-lg p-2.5 border border-purple-300 overflow-y-auto">
                    <div className="text-xs text-purple-900 leading-relaxed whitespace-pre-wrap">
                      {previewContent?.content || 'No hay contenido disponible'}
                    </div>

                    {/* Variables disponibles */}
                    {previewContent?.variables && previewContent.variables.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-purple-300">
                        <p className="text-xs font-semibold text-purple-700 mb-1">Variables disponibles:</p>
                        <div className="flex flex-wrap gap-1">
                          {previewContent.variables.map((variable, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full font-mono"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Eye className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                <p className="text-xs text-purple-600">Selecciona una plantilla para ver el preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Navegación */}
      <div className="flex gap-3 pt-3 border-t border-purple-300 mt-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 text-xs rounded-lg font-bold text-white bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg ml-auto"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default CommunicationStep2;
