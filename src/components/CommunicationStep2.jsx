import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, FileText, Eye, Maximize2, X, Search, History, Clock, ArrowRight, CheckCircle, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { getCommunicationTemplates, getCommunicationTemplate, getCommunicationTemplateFile, getClientCommunicationHistory } from '../services/api';
import * as mammoth from 'mammoth';
import JoditEditor from 'jodit-react';

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

  const config = {
    readonly: true,
    toolbar: false,
    statusbar: false,
    height: '100%',
    minHeight: 500,
    width: '100%',
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    buttons: [],
    style: {
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem'
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
      <JoditEditor
        value={htmlContent}
        config={config}
        tabIndex={-1}
        onChange={() => { }}
      />
    </div>
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
            <p className="text-sm text-gray-600 mt-1">MIME: {previewFile.mimeType}</p>
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
            <div className="p-4 h-full">
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
        <div className="border-t border-gray-200 p-4 bg-white sticky bottom-0 flex justify-end">

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

const HistoryModal = ({ isOpen, onClose, historyData, onResume }) => {
  if (!isOpen) return null;

  const [expandedDrafts, setExpandedDrafts] = useState(true);
  const [expandedSent, setExpandedSent] = useState(true);

  const drafts = historyData.filter(item => item.status === 'DRAFT');
  const sent = historyData.filter(item => item.status === 'SENT');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6" />
            <div>
              <h3 className="font-bold text-lg">Historial de Comunicaciones</h3>
              <p className="text-blue-100 text-xs">Se encontraron comunicaciones previas para este cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">

          {/* Section: Enviados (SENT) - MOSTRAR PRIMERO */}
          {sent.length > 0 && (
            <div className="bg-white rounded-lg border border-green-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedSent(!expandedSent)}
                className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <h4 className="flex items-center gap-2 text-sm font-bold text-green-700 uppercase tracking-wider">
                  <CheckCircle className="h-4 w-4" /> Historial Enviados ({sent.length})
                </h4>
                {expandedSent ? <ChevronDown className="h-4 w-4 text-green-600" /> : <ChevronRight className="h-4 w-4 text-green-600" />}
              </button>

              {expandedSent && (
                <div className="p-3 space-y-2 border-t border-green-100">
                  {sent.map((comm) => (
                    <div key={comm.id} className="bg-white border-l-4 border-green-500 rounded-md border border-gray-100 shadow-sm p-3 opacity-90 hover:opacity-100 transition-opacity">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">SENT</span>
                            <span className="text-xs text-gray-500">
                              {comm.sent_at ? new Date(comm.sent_at).toLocaleString() : 'Fecha desconocida'}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{comm.details || 'Comunicación enviada'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-600">
                              {comm.channel === 'WHATSAPP' && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> WhatsApp</span>}
                              {comm.channel === 'EMAIL' && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Email</span>}
                              {comm.channel === 'SMS' && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> SMS</span>}
                              {!comm.channel && 'Canal desconocido'}
                            </p>
                            {comm.recipient_contact && (
                              <span className="text-xs text-gray-500">• {comm.recipient_contact}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Borradores (DRAFT) - MOSTRAR SEGUNDO */}
          {drafts.length > 0 && (
            <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedDrafts(!expandedDrafts)}
                className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <h4 className="flex items-center gap-2 text-sm font-bold text-orange-700 uppercase tracking-wider">
                  <Clock className="h-4 w-4" /> Borradores Pendientes ({drafts.length})
                </h4>
                {expandedDrafts ? <ChevronDown className="h-4 w-4 text-orange-600" /> : <ChevronRight className="h-4 w-4 text-orange-600" />}
              </button>

              {expandedDrafts && (
                <div className="p-3 space-y-2 border-t border-orange-100">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="bg-white border-l-4 border-orange-400 rounded-md border border-gray-100 shadow-sm p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">DRAFT</span>
                            <span className="text-xs text-gray-500 font-mono">ID: {draft.id.slice(0, 8)}...</span>
                          </div>
                          <p className="font-semibold text-gray-800 text-sm mb-0.5">{draft.details || 'Sin detalles'}</p>
                          <p className="text-xs text-gray-600">
                            {draft.channel ? `Canal: ${draft.channel}` : 'Sin canal definido'}
                          </p>
                        </div>
                        <button
                          onClick={() => onResume(draft)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-md border border-orange-200 transition-colors"
                        >
                          Retomar <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {drafts.length === 0 && sent.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay historial para mostrar.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cerrar y Nueva Comunicación
          </button>
        </div>
      </div>
    </div>
  );
};

const CommunicationStep2 = ({ communicationType, onNext, onBack, step1Data, initialData }) => {
  const [formData, setFormData] = useState({
    selectedTemplateId: initialData?.selectedTemplateId || initialData?.selectedTemplate?.id || '',
  });

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(initialData?.selectedTemplate || initialData?.template || null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // History Modal State
  const [historyData, setHistoryData] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Refs for duplicate request prevention
  const lastFetchedCedula = useRef(null);
  const lastFetchedApprovalType = useRef(null);

  // Cargar historial al montar
  useEffect(() => {
    // Si ya tenemos datos iniciales (ej: volviendo del paso 3 o 4), no mostrar modal automáticamente
    if (initialData?.selectedTemplate?.id || initialData?.selectedTemplateId) {
      if (initialData.selectedTemplate) {
        // Opcional: Fetch preview logic here if needed, but we might just trust the passed object
        // But usually we need to fetch the file blob again if it's not in memory.
        // Let's at least ensure we don't open the modal.
        // Calling fetchTemplatePreview might be needed to view the content.
        if (initialData.selectedTemplate.id) {
          // We can trigger preview fetch if we have the ID
          // But let's avoid side-effects inside this check for now, just skip modal.
        }
      }
      return;
    }

    const checkHistory = async () => {
      if (step1Data?.cedula) {
        // Prevent duplicate fetches
        if (lastFetchedCedula.current === step1Data.cedula) return;
        lastFetchedCedula.current = step1Data.cedula;

        try {
          const res = await getClientCommunicationHistory(step1Data.cedula);
          if (res?.pagination?.total_items > 0) {
            setHistoryData(res.data);
            setShowHistoryModal(true);
          }
        } catch (error) {
          console.error('Error fetching communication history:', error);
        }
      }
    };
    checkHistory();
  }, [step1Data?.cedula, initialData]);

  const handleResumeDraft = (draft) => {
    setShowHistoryModal(false);
    // Trigger parent Resume logic
    onNext({
      isResume: true,
      commId: draft.id,
      selectedTemplate: {
        id: draft.template_id,
        name: draft.details || 'Plantilla de borrador',
        type: draft.template_type || 'DRAFT_RESUME'
      },
      resumeData: draft
    });
  };

  // Cargar plantillas desde el endpoint
  useEffect(() => {
    if (step1Data?.tipoAprobacion && lastFetchedApprovalType.current !== step1Data.tipoAprobacion) {
      lastFetchedApprovalType.current = step1Data.tipoAprobacion;
      fetchTemplates();
    }
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

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col text-base">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-lg p-3 mb-3">
        <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
          <span className="text-lg">📋</span> Seleccionar Plantilla
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Estado: <span className="font-semibold text-slate-900">APROBADA</span>
        </p>
      </div>

      {/* Contenido Principal - 2 Columnas */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* Columna 1: Lista de Plantillas */}
        <div className="flex flex-col bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-3 overflow-hidden">
          <h4 className="font-semibold text-emerald-900 text-base mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-700" />
            Plantillas Disponibles
          </h4>

          {/* Buscador */}
          <div className="mb-3 relative">
            <input
              type="text"
              placeholder="Buscar plantilla..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/80 placeholder-emerald-400 text-emerald-900"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-emerald-400 hover:text-emerald-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {loadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-emerald-700">Cargando plantillas...</p>
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`p-2.5 rounded-lg border-2 transition-all cursor-pointer ${selectedTemplate?.id === template.id
                      ? 'border-emerald-600 bg-emerald-100 shadow-md shadow-emerald-200'
                      : 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-emerald-900 text-sm truncate">
                          {template.name}
                        </p>
                        <p className="text-sm text-emerald-700 line-clamp-2 mt-0.5">
                          {template.description}
                        </p>
                        <div className="flex gap-1 mt-1">
                          <span className="text-sm px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                            ✓ {template.status || 'APPROVED'}
                          </span>
                          <span className="text-sm text-emerald-600">
                            {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-emerald-600">
                    {searchQuery ? 'No se encontraron plantillas con ese criterio' : 'No hay plantillas disponibles'}
                  </p>
                </div>
              )}
            </div>
          )}

          {errors.selectedTemplateId && (
            <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.selectedTemplateId}
            </div>
          )}
        </div>

        {/* Columna 2: Preview */}
        <div className="flex flex-col bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 overflow-hidden">
          <h4 className="font-semibold text-purple-900 text-base mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-700" />
            Vista Previa
          </h4>

          {selectedTemplate ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {loadingPreview ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-purple-700">Cargando preview...</p>
                </div>
              ) : (
                <>
                  {/* Información de la plantilla */}
                  <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-2 mb-2 border border-purple-300">
                    <p className="font-semibold text-purple-900 text-sm">{selectedTemplate.name}</p>
                    <p className="text-sm text-purple-800 mt-0.5">{selectedTemplate.description}</p>
                  </div>

                  {/* Contenido del preview - Archivo o Texto */}
                  <div className="flex-1 bg-white rounded-lg p-2.5 border border-purple-300 overflow-y-auto flex flex-col">
                    {previewFile ? (
                      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-purple-200 p-6">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                          {previewFile.mimeType.startsWith('image/') ? (
                            <Eye className="h-12 w-12 text-purple-500" />
                          ) : previewFile.mimeType === 'application/pdf' ? (
                            <FileText className="h-12 w-12 text-red-500" />
                          ) : previewFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
                            <FileText className="h-12 w-12 text-blue-500" />
                          ) : (
                            <FileText className="h-12 w-12 text-gray-500" />
                          )}
                        </div>

                        <p className="text-purple-900 font-medium mb-1">Documento de Plantilla</p>
                        <p className="text-purple-600 text-xs mb-6">{previewFile.mimeType}</p>

                        <button
                          onClick={() => setShowFullModal(true)}
                          className="flex items-center justify-center gap-2 px-6 py-3 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <Maximize2 className="h-4 w-4" />
                          Ver Documento Completo
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Contenido de texto original */}
                        <div className="text-sm text-purple-900 leading-relaxed whitespace-pre-wrap">
                          {previewContent?.content || 'No hay contenido disponible'}
                        </div>

                        {/* Variables disponibles */}
                        {previewContent?.variables && previewContent.variables.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-purple-300">
                            <p className="text-sm font-semibold text-purple-700 mb-1">Variables disponibles:</p>
                            <div className="flex flex-wrap gap-1">
                              {previewContent.variables.map((variable, idx) => (
                                <span
                                  key={idx}
                                  className="text-sm bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full font-mono"
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
                <p className="text-sm text-purple-600">Selecciona una plantilla para ver el preview</p>
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

      {/* Modal de Historial */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        historyData={historyData}
        onResume={handleResumeDraft}
      />
    </div>
  );
};

export default CommunicationStep2;
