import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, Eye, Download, Maximize2, X } from 'lucide-react';
import { getCommunicationTemplates, getCommunicationTemplate, getCommunicationTemplateFile } from '../services/api';
import * as mammoth from 'mammoth';

// Componente helper para renderizar texto desde Blob
const TextPreview = ({ blob }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setText(e.target.result);
    reader.readAsText(blob);
  }, [blob]);

  return <>{text}</>;
};

// Componente para renderizar documentos DOCX
const DocxPreview = ({ blob }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const renderDocx = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
      } catch (err) {
        console.error('Error rendering DOCX:', err);
        setError('Error al renderizar el documento');
      } finally {
        setLoading(false);
      }
    };

    renderDocx();
  }, [blob]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-600">Renderizando documento...</p></div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  return (
    <div 
      className="prose prose-sm max-w-none p-4 bg-white rounded-lg"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

// Modal para visualizar documento completo
const FullDocumentModal = ({ isOpen, onClose, previewFile, templateName }) => {
  if (!isOpen || !previewFile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">{templateName}</h3>
            <p className="text-xs text-gray-600 mt-1">MIME: {previewFile.mimeType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {previewFile.mimeType.startsWith('image/') ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={previewFile.url}
                alt={templateName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : previewFile.mimeType === 'application/pdf' ? (
            <iframe
              src={previewFile.url}
              className="w-full h-full border-0"
              title={`${templateName} PDF`}
            />
          ) : previewFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
            // DOCX
            <div className="p-4">
              {previewFile.blob && <DocxPreview blob={previewFile.blob} />}
            </div>
          ) : previewFile.mimeType.startsWith('text/') ? (
            <div className="p-4">
              <pre className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans bg-white p-4 rounded-lg border border-gray-200">
                {previewFile.blob && <TextPreview blob={previewFile.blob} />}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Tipo de archivo: {previewFile.mimeType}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="border-t border-gray-200 p-4 bg-white sticky bottom-0 flex justify-between">
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = previewFile.url;
              a.download = `${templateName}`;
              a.click();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const CommunicationStep2 = ({ communicationType, onNext, onBack, step1Data }) => {
  const [formData, setFormData] = useState({
    selectedTemplateId: '',
  });

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);

  // Cargar plantillas desde el endpoint
  useEffect(() => {
    fetchTemplates();
  }, [step1Data?.tipoAprobacion]);

  // Cleanup de URLs de objeto cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (previewFile?.url) {
        URL.revokeObjectURL(previewFile.url);
      }
    };
  }, [previewFile?.url]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      let data = [];

      // Determinar qué tipo de plantillas listar según tipoAprobacion
      if (step1Data?.tipoAprobacion === 'con_aprobacion') {
        // Solo plantillas LEGAL
        data = await getCommunicationTemplates('APPROVED', 'LEGAL');
      } else if (step1Data?.tipoAprobacion === 'sin_aprobacion') {
        // Plantillas AUTOMATIC y FORM - hacer dos llamadas y combinar
        const automaticTemplates = await getCommunicationTemplates('APPROVED', 'AUTOMATIC');
        const formTemplates = await getCommunicationTemplates('APPROVED', 'FORM');
        data = [...(automaticTemplates || []), ...(formTemplates || [])];
      }

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
    setPreviewContent(null);
    setPreviewFile(null);
    try {
      const data = await getCommunicationTemplate(templateId);
      setPreviewContent(data);

      // Si existe template_file_path, cargar el archivo
      if (data?.template_file_path) {
        try {
          const fileData = await getCommunicationTemplateFile(data.template_file_path);
          setPreviewFile(fileData);
        } catch (fileError) {
          console.error('Error cargando archivo de plantilla:', fileError);
          // Continuar sin el archivo
        }
      }
    } catch (error) {
      console.error('Error cargando preview:', error);
      setPreviewContent(null);
      setPreviewFile(null);
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

                  {/* Contenido del preview - Archivo o Texto */}
                  <div className="flex-1 bg-white rounded-lg p-2.5 border border-purple-300 overflow-y-auto flex flex-col">
                    {previewFile ? (
                      <>
                        {/* Vista previa del archivo */}
                        <div className="flex-1 flex flex-col min-h-0 bg-gray-50 rounded-lg border border-purple-200 p-2 mb-2">
                          {previewFile.mimeType.startsWith('image/') ? (
                            // Imagen
                            <div className="flex items-center justify-center h-full">
                              <img 
                                src={previewFile.url} 
                                alt="Template preview" 
                                className="max-w-full max-h-full object-contain rounded"
                              />
                            </div>
                          ) : previewFile.mimeType === 'application/pdf' ? (
                            // PDF
                            <div className="w-full h-full flex flex-col">
                              <iframe
                                src={previewFile.url}
                                className="flex-1 rounded border border-gray-300"
                                title="PDF Preview"
                              />
                            </div>
                          ) : previewFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
                            // DOCX
                            <div className="overflow-auto">
                              {previewFile.blob && <DocxPreview blob={previewFile.blob} />}
                            </div>
                          ) : previewFile.mimeType.startsWith('text/') ? (
                            // Texto
                            <div className="overflow-auto">
                              <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono p-2 bg-white rounded">
                                {previewFile.blob && <TextPreview blob={previewFile.blob} />}
                              </pre>
                            </div>
                          ) : (
                            // Archivo genérico
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <FileText className="h-12 w-12 text-purple-300 mb-2" />
                              <p className="text-xs text-purple-600">Archivo: {previewFile.mimeType}</p>
                            </div>
                          )}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2 pt-2 border-t border-purple-300">
                          <button
                            onClick={() => setShowFullModal(true)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors"
                          >
                            <Maximize2 className="h-3 w-3" />
                            Ver Completo
                          </button>
                          <button
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = previewFile.url;
                              a.download = `${selectedTemplate.name}`;
                              a.click();
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            Descargar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Contenido de texto original */}
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
                      </>
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

      {/* Modal de documento completo */}
      <FullDocumentModal
        isOpen={showFullModal}
        onClose={() => setShowFullModal(false)}
        previewFile={previewFile}
        templateName={selectedTemplate?.name || 'Documento'}
      />
    </div>
  );
};

export default CommunicationStep2;
