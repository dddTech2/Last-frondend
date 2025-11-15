import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader, CheckCircle2, Download, Eye, ArrowLeft, Maximize2, X } from 'lucide-react';
import { generateCommunication, getCommunicationPreview } from '../services/api';
import * as mammoth from 'mammoth';

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
const FullDocumentModal = ({ isOpen, onClose, previewFile }) => {
  if (!isOpen || !previewFile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col">
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Vista Previa Completa</h3>
            <p className="text-sm text-gray-600 mt-1">
              {previewFile.mimeType || 'Documento'}
            </p>
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
          {previewFile.mimeType?.startsWith('image/') ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={previewFile.url}
                alt="Documento"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : previewFile.mimeType === 'application/pdf' ? (
            <div className="flex-1 bg-slate-100 flex items-center justify-center overflow-auto p-4">
              <div className="shadow-2xl border border-gray-300 bg-white" style={{ width: '816px', height: '1056px' }}>
                <iframe
                  src={`${previewFile.url}#view=FitH`}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              </div>
            </div>
          ) : previewFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
            <div className="p-4">
              {previewFile.blob && <DocxPreview blob={previewFile.blob} />}
            </div>
          ) : previewFile.mimeType?.startsWith('text/') ? (
            <div className="p-4 bg-white">
              <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 break-words">
                {previewFile.text || previewFile.url}
              </pre>
            </div>
          ) : (
            <div className="p-4 flex items-center justify-center h-full">
              <p className="text-gray-500">Formato no soportado para vista previa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CommunicationStep4 = ({ campaignConfig, onBack, onComplete, runId }) => {
  const [generating, setGenerating] = useState(false);
  const [commId, setCommId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullModal, setShowFullModal] = useState(false);
  const runIdRef = useRef(runId);

  useEffect(() => {
    runIdRef.current = runId;
  }, [runId]);

  useEffect(() => {
    setGenerating(false);
    setCommId(null);
    setPreviewData(null);
    setPreviewFile(null);
    setPreviewLoading(false);
    setError(null);
    setShowFullModal(false);
  }, [runId, campaignConfig]);

  // Logging al recibir en Step4
  useEffect(() => {
    console.log('=== STEP 4 RECEIVED ===');
    console.log('campaignConfig.templateFields keys:', Object.keys(campaignConfig.templateFields || {}));
    console.log('campaignConfig.templateFields:', campaignConfig.templateFields);
    console.log('campaignConfig.fieldMetadata:', campaignConfig.fieldMetadata);
  }, [campaignConfig.templateFields, campaignConfig.fieldMetadata]);

  // Cargar preview cuando se obtiene comm_id
  useEffect(() => {
    if (commId && !previewData) {
      loadPreview();
    }
  }, [commId]);

  const loadPreview = async () => {
    const currentRunId = runIdRef.current;
    setPreviewLoading(true);
    try {
      console.log('Cargando preview para comm_id:', commId);
      const response = await getCommunicationPreview(commId);
      console.log('Preview response type:', typeof response);
      console.log('Preview response:', response);
      console.log('Is Blob?', response instanceof Blob);
      console.log('Is File?', response instanceof File);
      
      setPreviewData(response);

      // Procesar el preview según el tipo de respuesta
      if (response) {
        let fileObj = {};

        // Si es un Blob o File
        if (response instanceof Blob || response instanceof File) {
          console.log('Procesando como Blob/File');
          const mimeType = response.type || 'application/octet-stream';
          fileObj = {
            blob: response,
            mimeType: mimeType,
            url: URL.createObjectURL(response)
          };
          console.log('fileObj creado:', fileObj);
        }
        // Si es un string (texto o URL)
        else if (typeof response === 'string') {
          console.log('Procesando como string');
          fileObj = {
            text: response,
            mimeType: 'text/plain',
            url: response
          };
        }
        // Si es un objeto con propiedades (JSON)
        else if (typeof response === 'object') {
          console.log('Procesando como objeto');
          
          // Si tiene una propiedad 'data' que es un Blob/ArrayBuffer
          if (response.data instanceof Blob) {
            fileObj = {
              blob: response.data,
              mimeType: response.mimeType || response.type || 'application/octet-stream',
              url: URL.createObjectURL(response.data)
            };
          } else if (response.data && typeof response.data === 'string') {
            fileObj = {
              text: response.data,
              mimeType: response.mimeType || 'text/plain',
              url: response.data
            };
          } else {
            // Es un objeto JSON, mostrarlo como texto
            fileObj = {
              text: JSON.stringify(response, null, 2),
              mimeType: 'text/plain',
              url: JSON.stringify(response, null, 2)
            };
          }
        } else {
          console.log('Tipo de respuesta desconocido');
          fileObj = {
            text: String(response),
            mimeType: 'text/plain',
            url: String(response)
          };
        }

        console.log('fileObj final:', fileObj);
        if (runIdRef.current === currentRunId) {
          setPreviewFile(fileObj);
        }
      }
    } catch (err) {
      console.error('Error loading preview:', err);
      if (runIdRef.current === currentRunId) {
        setError(`No se pudo cargar el preview: ${err.message}`);
      }
    } finally {
      if (runIdRef.current === currentRunId) {
        setPreviewLoading(false);
      }
    }
  };

  const handleGenerateCommunication = async () => {
    setGenerating(true);
    setError(null);

    try {
      console.log('=== GENERATING COMMUNICATION ===');
      console.log('campaignConfig:', campaignConfig);
      console.log('templateFields keys:', Object.keys(campaignConfig.templateFields || {}));
      console.log('Full templateFields:', campaignConfig.templateFields);

      // Construir el body para la API
      // El form_data debe contener EXACTAMENTE los campos esperados por el API
      const form_data = { ...campaignConfig.templateFields };
      
      // Asegurar que los campos están presentes (de lo contrario el API rechaza)
      console.log('form_data a enviar:', form_data);
      console.log('form_data keys:', Object.keys(form_data));
      
      const communicationData = {
        template_id: campaignConfig.selectedTemplateId,
        client_id: campaignConfig.cedula,
        client_role: campaignConfig.tipoDeudor?.toUpperCase() || 'DEUDOR',
        form_data: form_data
      };

      console.log('Communication data to send:', communicationData);
      console.log('Form data entries:');
      Object.entries(form_data).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} (${typeof value})`);
      });

      // Enviar solicitud para generar el documento
      const response = await generateCommunication(communicationData);
      console.log('Generate response:', response);

      if (response?.id) {
        setCommId(response.id);
        console.log('Communication generated successfully with ID:', response.id);
      } else {
        throw new Error('No se recibió ID de comunicación');
      }
    } catch (err) {
      console.error('Error generating communication:', err);
      setError(err.message || 'Error al generar el documento');
    } finally {
      setGenerating(false);
    }
  };

  // Si aún no ha generado el documento
  if (!commId) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 mb-3">
          <h3 className="font-semibold text-purple-900 mb-2 text-base flex items-center gap-2">
            <span className="text-lg">✓</span> Resumen Final
          </h3>
          <p className="text-purple-700 text-sm font-medium">
            Revisa la información y genera el documento
          </p>
        </div>

        {/* Contenido Principal - 2 Columnas */}
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
          {/* Columna 1: Resumen de datos */}
          <div className="flex flex-col bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3 overflow-y-auto">
            <h4 className="font-semibold text-blue-900 text-base mb-2 flex items-center gap-2">
              <span>📋</span> Resumen de Datos
            </h4>

            <div className="space-y-3">
              {/* Datos del cliente */}
              <div className="bg-white border border-blue-200 rounded-lg p-2">
                <h5 className="text-sm font-bold text-blue-900 mb-1.5">👤 Datos del Cliente</h5>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Cédula:</strong> {campaignConfig.cedula || 'N/A'}</p>
                  <p><strong>Tipo de Deudor:</strong> {campaignConfig.tipoDeudor === 'deudor' ? 'Deudor' : 'Codeudor'}</p>
                </div>
              </div>

              {/* Datos de la comunicación */}
              <div className="bg-white border border-blue-200 rounded-lg p-2">
                <h5 className="text-sm font-bold text-blue-900 mb-1.5">📧 Comunicación</h5>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Canal:</strong> {campaignConfig.canalComunicacion === 'email' ? 'Correo Electrónico' : 'WhatsApp'}</p>
                  <p><strong>Tipo:</strong> {campaignConfig.tipoAprobacion === 'sin_aprobacion' ? 'Sin Aprobación' : 'Con Aprobación'}</p>
                </div>
              </div>

              {/* Plantilla */}
              <div className="bg-white border border-blue-200 rounded-lg p-2">
                <h5 className="text-sm font-bold text-blue-900 mb-1.5">📄 Plantilla</h5>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Nombre:</strong> {campaignConfig.selectedTemplate?.name || 'N/A'}</p>
                  <p><strong>Tipo:</strong> {campaignConfig.selectedTemplate?.type || 'N/A'}</p>
                </div>
              </div>

            {/* Campos rellenados (si hay) */}
            {campaignConfig.templateFields && Object.keys(campaignConfig.templateFields).length > 0 && (
              <div className="bg-white border border-blue-200 rounded-lg p-2">
                <h5 className="text-sm font-bold text-blue-900 mb-1.5">📝 Campos Completados</h5>
                <div className="space-y-1 text-sm text-blue-800 max-h-32 overflow-y-auto">
                  {Object.entries(campaignConfig.templateFields).map(([key, value]) => {
                    const metadata = campaignConfig.fieldMetadata?.[key];
                    const label = metadata?.label || key;
                    return (
                      <p key={key}>
                        <strong>{label}:</strong> {String(value || '(vacío)').substring(0, 50)}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna 2: Acción de generar */}
          <div className="flex flex-col bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 overflow-y-auto">
            <h4 className="font-semibold text-purple-900 text-sm mb-2 flex items-center gap-2">
              <span>✨</span> Generar Documento
            </h4>

            {/* Área central vacía con instrucciones y botón */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-8">
              <div className="bg-purple-100 rounded-full p-4">
                <CheckCircle2 className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-900 mb-1">¡Listo para Generar!</p>
                <p className="text-sm text-purple-700 mb-4">
                  Presiona el botón para generar el documento y ver su vista previa
                </p>
              </div>
              <button
                onClick={handleGenerateCommunication}
                disabled={generating}
                className="px-6 py-3 text-sm rounded-lg font-bold text-white bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Generar Documento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Botones de Navegación */}
        <div className="flex gap-3 pt-3 border-t border-purple-300 mt-3">
          <button
            onClick={onBack}
            disabled={generating}
            className="px-4 py-2 text-sm rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Atrás
          </button>
        </div>
      </div>
    );
  }

  // Si está cargando el preview
  if (previewLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 mb-3">
          <h3 className="font-semibold text-purple-900 mb-2 text-base flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            Generando Preview
          </h3>
          <p className="text-purple-700 text-sm font-medium">
            Estamos preparando la vista previa del documento...
          </p>
        </div>

        {/* Contenido Principal - 2 Columnas */}
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
          {/* Columna 1: Resumen */}
          <div className="flex flex-col bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3 overflow-y-auto">
            <h4 className="font-semibold text-blue-900 text-base mb-2">📋 Resumen de Datos</h4>
            <div className="space-y-2">
              <div className="bg-white border border-blue-200 rounded-lg p-2">
                <p className="text-sm"><strong>Cédula:</strong> {campaignConfig.cedula}</p>
                <p className="text-sm"><strong>Deudor:</strong> {campaignConfig.tipoDeudor === 'deudor' ? 'Deudor' : 'Codeudor'}</p>
              </div>
              <div className="bg-white border border-blue-200 rounded-lg p-2">
                <p className="text-sm"><strong>Canal:</strong> {campaignConfig.canalComunicacion === 'email' ? 'Correo' : 'WhatsApp'}</p>
                <p className="text-sm"><strong>Plantilla:</strong> {campaignConfig.selectedTemplate?.name}</p>
              </div>
            </div>
          </div>

          {/* Columna 2: Loading */}
          <div className="flex flex-col bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 items-center justify-center">
            <Loader className="h-8 w-8 text-purple-600 animate-spin mb-2" />
            <p className="text-sm text-purple-700">Preparando preview...</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-3 border-t border-purple-300 mt-3">
          <button
            onClick={onBack}
            disabled={true}
            className="px-4 py-2 text-sm rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Atrás
          </button>
        </div>
      </div>
    );
  }

  // Si tiene preview - Mostrar resumen + preview lado a lado
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-3 mb-3">
        <h3 className="font-semibold text-green-900 mb-1 text-base flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Documento Generado
        </h3>
        <p className="text-green-700 text-sm">
          ID: <code className="bg-white px-1.5 rounded">{commId}</code>
        </p>
      </div>

      {/* Contenido Principal - 2 Columnas */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* Columna 1: Resumen de datos */}
        <div className="flex flex-col bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3 overflow-y-auto">
          <h4 className="font-semibold text-blue-900 text-base mb-2 flex items-center gap-2">
            <span>📋</span> Resumen de Datos
          </h4>

          <div className="space-y-2.5">
            {/* Datos del cliente */}
            <div className="bg-white border border-blue-200 rounded-lg p-2">
              <h5 className="text-sm font-bold text-blue-900 mb-1">👤 Cliente</h5>
              <div className="space-y-0.5 text-sm text-blue-800">
                <p><strong>Cédula:</strong> {campaignConfig.cedula || 'N/A'}</p>
                <p><strong>Tipo:</strong> {campaignConfig.tipoDeudor === 'deudor' ? 'Deudor' : 'Codeudor'}</p>
              </div>
            </div>

            {/* Datos de la comunicación */}
            <div className="bg-white border border-blue-200 rounded-lg p-2">
              <h5 className="text-sm font-bold text-blue-900 mb-1">📧 Comunicación</h5>
              <div className="space-y-0.5 text-sm text-blue-800">
                <p><strong>Canal:</strong> {campaignConfig.canalComunicacion === 'email' ? 'Correo' : 'WhatsApp'}</p>
                <p><strong>Tipo:</strong> {campaignConfig.tipoAprobacion === 'sin_aprobacion' ? 'Sin Aprobación' : 'Con Aprobación'}</p>
              </div>
            </div>

            {/* Plantilla */}
            <div className="bg-white border border-blue-200 rounded-lg p-2">
              <h5 className="text-sm font-bold text-blue-900 mb-1">📄 Plantilla</h5>
              <div className="space-y-0.5 text-sm text-blue-800">
                <p><strong>Nombre:</strong> {campaignConfig.selectedTemplate?.name || 'N/A'}</p>
                <p><strong>Tipo:</strong> {campaignConfig.selectedTemplate?.type || 'N/A'}</p>
              </div>
            </div>

            {/* Campos rellenados */}
            {campaignConfig.templateFields && Object.keys(campaignConfig.templateFields).length > 0 && (
              <div className="bg-white border border-blue-200 rounded-lg p-2">
                <h5 className="text-sm font-bold text-blue-900 mb-1">📝 Campos</h5>
                <div className="space-y-0.5 text-sm text-blue-800 max-h-24 overflow-y-auto">
                  {Object.entries(campaignConfig.templateFields).map(([key, value]) => {
                    const metadata = campaignConfig.fieldMetadata?.[key];
                    const label = metadata?.label || key;
                    return (
                      <p key={key}>
                        <strong>{label}:</strong> {String(value || '').substring(0, 30)}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna 2: Preview del documento */}
        <div className="flex flex-col bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-purple-900 text-base">✨ Vista Previa</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => previewFile?.url && window.open(previewFile.url, '_blank')}
                disabled={!previewFile?.url}
                className="px-2.5 py-1 text-sm rounded-lg font-semibold text-gray-700 bg-white/90 hover:bg-white shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Abrir pestaña
              </button>
              <button
                onClick={() => previewFile && setShowFullModal(true)}
                disabled={!previewFile}
                className="px-2.5 py-1 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Maximize2 className="h-3 w-3" />
                Expandir
              </button>
            </div>
          </div>

          {/* Preview pequeño */}
          <div className="flex-1 bg-white rounded-lg border border-purple-300 overflow-y-auto flex flex-col">
            {previewFile ? (
              <>
                {previewFile.mimeType?.startsWith('image/') ? (
                  <div className="flex items-center justify-center p-4 bg-gray-50 h-full">
                    <img
                      src={previewFile.url}
                      alt="Documento"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : previewFile.mimeType === 'application/pdf' ? (
                  <div className="relative h-full bg-slate-100 rounded-lg overflow-auto py-6">
                    <div className="mx-auto shadow-xl border border-purple-200 bg-white" style={{ width: '816px', height: '1056px' }}>
                      <iframe
                        src={`${previewFile.url}#view=FitH`}
                        className="w-full h-full border-0"
                        title="Vista previa PDF"
                      />
                    </div>
                  </div>
                ) : previewFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
                  <div className="p-4 overflow-auto">
                    {previewFile.blob && <DocxPreview blob={previewFile.blob} />}
                  </div>
                ) : previewFile.mimeType?.startsWith('text/') ? (
                  <div className="p-4 bg-white overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 break-words">
                      {previewFile.text || previewFile.url}
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-sm">Tipo: {previewFile.mimeType || 'desconocido'}</p>
                  </div>
                )}
              </>
            ) : error ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500">Sin vista previa disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para vista completa */}
      <FullDocumentModal
        isOpen={showFullModal}
        onClose={() => setShowFullModal(false)}
        previewFile={previewFile}
      />

      {/* Botones de Navegación */}
      <div className="flex gap-3 pt-3 border-t border-purple-300 mt-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Atrás
        </button>
        <button
          onClick={() => onComplete && onComplete(commId)}
          className="px-5 py-2 text-sm rounded-lg font-bold text-white bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg ml-auto flex items-center gap-2"
        >
          <Download className="h-3 w-3" />
          Confirmar y Continuar
        </button>
      </div>
    </div>
  );
};

export default CommunicationStep4;
