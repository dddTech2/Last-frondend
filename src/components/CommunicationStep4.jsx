import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader, CheckCircle2, ArrowLeft, Maximize2, X, Send } from 'lucide-react';
import { generateCommunication, getCommunicationPreview, sendCommunication, sendBatchCommunication, checkMyEmployeeCredentials } from '../services/api';
import { useAuth } from '../context/AuthContext';
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

// Modal de Error Específico
const ErrorModal = ({ isOpen, onClose, error }) => {
  if (!isOpen || !error) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border-2 border-red-100">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-50 p-4 rounded-full mb-4 ring-4 ring-red-100">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error de Generación</h3>
          <div className="w-full bg-red-50 rounded-lg p-4 mb-6 border border-red-100">
            <p className="text-red-800 font-medium text-sm break-words">{error}</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de Alerta para Múltiples Documentos
const MultipleDocsAlertModal = ({ isOpen, onClose, count }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-300 border-4 border-amber-400">
        <div className="flex flex-col items-center text-center">
          <div className="bg-amber-100 p-5 rounded-full mb-6 ring-4 ring-amber-200 animate-bounce">
            <AlertCircle className="h-14 w-14 text-amber-600" />
          </div>
          <h2 className="text-3xl font-black text-amber-600 mb-4 uppercase tracking-wide">
            ¡Atención!
          </h2>
          <div className="w-full bg-amber-50 rounded-xl p-6 mb-8 border border-amber-200 shadow-inner">
            <p className="text-amber-900 font-bold text-lg mb-2">
              Se han generado <span className="text-2xl font-black bg-amber-200 px-2 py-1 rounded mx-1">{count}</span> documentos.
            </p>
            <p className="text-amber-800 text-base font-medium mt-3">
              Por favor, revisa <span className="underline font-bold">cada uno de ellos a detalle</span> usando las pestañas de la parte superior antes de proceder a enviarlos.
            </p>
          </div>
          <button
             onClick={onClose}
             className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            ¡Entendido, los revisaré!
          </button>
        </div>
      </div>
    </div>
  );
};

const CommunicationStep4 = ({ campaignConfig, onBack, onComplete, runId }) => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showMultipleDocsAlert, setShowMultipleDocsAlert] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState([]);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const commId = generatedDocs[selectedDocIndex]?.id;

  const [previewData, setPreviewData] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullModal, setShowFullModal] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [senderPassword, setSenderPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState('');
  const [previewsCache, setPreviewsCache] = useState({});
  const [hasCredentials, setHasCredentials] = useState(false);
  const [checkingCredentials, setCheckingCredentials] = useState(true);
  const runIdRef = useRef(runId);

  useEffect(() => {
    runIdRef.current = runId;
  }, [runId]);

  useEffect(() => {
    setGenerating(false);
    setGeneratedDocs([]);
    setSelectedDocIndex(0);
    setPreviewData(null);
    setPreviewFile(null);
    setPreviewLoading(false);
    setError(null);
    setShowFullModal(false);
    setShowPasswordPrompt(false);
    setShowMultipleDocsAlert(false);
    setSenderPassword('');
    setSending(false);
    setSendError(null);
    setSendSuccess('');
    setPreviewsCache({});
    setCheckingCredentials(true);
    setHasCredentials(false);
  }, [runId, campaignConfig]);

  // Check if user has SMTP credentials stored (using optimized endpoint)
  useEffect(() => {
    const checkCredentials = async () => {
      try {
        setCheckingCredentials(true);
        console.log('Checking user credentials via /me/check...');
        
        const status = await checkMyEmployeeCredentials();
        console.log('Credential status:', status);

        // Check both has_credentials AND is_active
        if (status && status.has_credentials && status.is_active) {
          console.log('User has active stored credentials, password prompt will be skipped');
          setHasCredentials(true);
        } else {
          console.log('User has NO active credentials or credentials inactive');
          setHasCredentials(false);
        }
      } catch (error) {
        console.error('Error checking credentials:', error);
        // Fallback to safety: ask for password
        setHasCredentials(false);
      } finally {
        setCheckingCredentials(false);
      }
    };

    checkCredentials();
  }, []); // Only run once on mount, backend handles 'me' context

  // Initialize generatedDocs from resumeCommId if present (for draft resume)
  useEffect(() => {
    if (campaignConfig.resumeCommId && generatedDocs.length === 0) {
      console.log('Resuming draft with commId:', campaignConfig.resumeCommId);
      setGeneratedDocs([{ id: campaignConfig.resumeCommId }]);
      setSelectedDocIndex(0);
    }
  }, [campaignConfig.resumeCommId]);

  useEffect(() => {
    setPreviewData(null);
    setPreviewFile(null);
  }, [selectedDocIndex]);

  // Logging al recibir en Step4
  useEffect(() => {
    console.log('=== STEP 4 RECEIVED ===');
    console.log('campaignConfig.templateFields keys:', Object.keys(campaignConfig.templateFields || {}));
    console.log('campaignConfig.templateFields:', campaignConfig.templateFields);
    console.log('campaignConfig.fieldMetadata:', campaignConfig.fieldMetadata);
  }, [campaignConfig.templateFields, campaignConfig.fieldMetadata]);

  // Cargar preview cuando se obtiene comm_id
  useEffect(() => {
    if (commId) {
      if (previewsCache[commId]) {
        setPreviewFile(previewsCache[commId]);
      } else {
        loadPreview();
      }
    }
  }, [commId]);

  const channelParam = (campaignConfig.canalComunicacion || '').toUpperCase();
  const channelFriendlyName = campaignConfig.canalComunicacion === 'email'
    ? 'Correo electrónico'
    : campaignConfig.canalComunicacion === 'whatsapp'
      ? 'WhatsApp'
      : campaignConfig.canalComunicacion === 'sms'
        ? 'SMS'
        : campaignConfig.canalComunicacion || 'Canal';
  const recipientContact = campaignConfig.contactValue || '';
  const contactLabel = campaignConfig.canalComunicacion === 'email'
    ? 'Correo de salida'
    : campaignConfig.canalComunicacion === 'whatsapp'
      ? 'Número de salida'
      : 'Contacto';
  const canSend = Boolean(commId && recipientContact && channelParam);

  const handleOpenPasswordPrompt = () => {
    setSenderPassword('');
    setSendError(null);
    setShowPasswordPrompt(true);
  };

  const handleSendClick = () => {
    // If user has credentials, send directly without password prompt
    if (hasCredentials) {
      handleConfirmSend();
    } else {
      // Otherwise, show password prompt
      handleOpenPasswordPrompt();
    }
  };

  const handleClosePasswordPrompt = () => {
    if (sending) return;
    setShowPasswordPrompt(false);
    setSenderPassword('');
    setSendError(null);
  };

  const handleConfirmSend = async () => {
    // If user has credentials, we don't need password
    // Otherwise, validate password was entered
    if (!hasCredentials && !senderPassword.trim()) {
      setSendError('Debes ingresar la contraseña de envío.');
      return;
    }
    if (!canSend) {
      setSendError('Faltan datos para enviar la comunicación.');
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      const passwordToUse = hasCredentials ? null : senderPassword.trim();

      // Use batch sending for multiple email documents
      if (generatedDocs.length > 1 && channelParam === 'EMAIL') {
        console.log('Using batch send for multiple email documents');
        const communication_ids = generatedDocs.map(doc => doc.id);
        const response = await sendBatchCommunication(
          communication_ids,
          recipientContact,
          passwordToUse
        );
        
        setShowPasswordPrompt(false);
        setSenderPassword('');
        setSendSuccess(response.message || `¡${response.sent_count} comunicaciones enviadas con éxito!`);
      } else {
        // Use individual sending for single documents or non-email channels
        console.log('Using individual send');
        for (const doc of generatedDocs) {
          await sendCommunication(doc.id, channelParam, {
            recipient_contact: recipientContact,
            sender_password: passwordToUse,
          });
        }
        setShowPasswordPrompt(false);
        setSenderPassword('');
        setSendSuccess(generatedDocs.length > 1
          ? '¡Comunicaciones enviadas con éxito!'
          : '¡Comunicación enviada con éxito!');
      }
    } catch (err) {
      setSendError(err.message || 'No se pudo enviar la comunicación');
    } finally {
      setSending(false);
    }
  };

  const handleFinishAfterSend = () => {
    if (onComplete) {
      onComplete(commId);
    }
  };

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
          setPreviewsCache(prev => ({ ...prev, [commId]: fileObj }));
        }
      }
    } catch (err) {
      console.error('Error loading preview:', err);
      if (runIdRef.current === currentRunId) {
        const errorMessage = campaignConfig.resumeCommId 
          ? `No se pudo cargar el borrador. Es posible que haya sido eliminado. Presiona "Atrás" y vuelve a generarlo.`
          : `No se pudo cargar el preview: ${err.message}`;
        setError(errorMessage);
      }
    } finally {
      if (runIdRef.current === currentRunId) {
        setPreviewLoading(false);
      }
    }
  };

  const handleGenerateCommunication = async () => {
    // Prevent regenerating resumed drafts
    if (campaignConfig.resumeCommId) {
      setError('Este borrador ya ha sido generado. Usa "Atrás" para modificarlo o eliminar el borrador.');
      setShowErrorModal(true);
      return;
    }

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
        template_id: campaignConfig.selectedTemplateId || campaignConfig.selectedTemplate?.id || campaignConfig.template_id,
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

      // Manejar si la respuesta es un array (el backend podría devolver una lista)
      const docs = Array.isArray(response) ? response : [response];

      if (docs.length > 0 && docs[0]?.id) {
        setGeneratedDocs(docs);
        setSelectedDocIndex(0);
        console.log('Communications generated successfully:', docs);
        
        // Show alert if multiple documents are generated
        if (docs.length > 1) {
          setShowMultipleDocsAlert(true);
        }
      } else {
        throw new Error('No se recibió ID de comunicación');
      }
    } catch (err) {
      console.error('Error generating communication:', err);
      setError(err.message || 'Error al generar el documento');
      setShowErrorModal(true);
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-purple-900 mb-1 text-base flex items-center gap-2">
                <span className="text-lg">✓</span> Resumen Final
              </h3>
              <p className="text-purple-700 text-sm font-medium ml-7">
                Revisa la información y genera el documento
              </p>
            </div>

            {error && (
              <div className="flex-1 max-w-[50%] flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg animate-pulse min-h-[3.5rem]">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="break-words leading-tight">Error: {error}</span>
              </div>
            )}
          </div>
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
                  <p><strong>Canal:</strong> {
                    campaignConfig.canalComunicacion === 'email' 
                      ? 'Correo Electrónico' 
                      : campaignConfig.canalComunicacion === 'sms'
                        ? 'SMS'
                        : 'WhatsApp'
                  }</p>
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

        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          error={error}
        />
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
                <p className="text-sm"><strong>Canal:</strong> {
                  campaignConfig.canalComunicacion === 'email' 
                    ? 'Correo' 
                    : campaignConfig.canalComunicacion === 'sms'
                      ? 'SMS'
                      : 'WhatsApp'
                }</p>
                <p className="text-sm"><strong>Plantilla:</strong> {campaignConfig.selectedTemplate?.name}</p>
              </div>
              <div className="bg-white border border-blue-200 rounded-lg p-2">
                <p className="text-sm"><strong>Canal:</strong> {
                  campaignConfig.canalComunicacion === 'email' 
                    ? 'Correo' 
                    : campaignConfig.canalComunicacion === 'sms'
                      ? 'SMS'
                      : 'WhatsApp'
                }</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-900 mb-1 text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Documento Generado {generatedDocs.length > 1 ? `(${selectedDocIndex + 1}/${generatedDocs.length})` : ''}
            </h3>
            <p className="text-green-700 text-sm">
              ID: <code className="bg-white px-1.5 rounded">{commId}</code>
            </p>
            {sendError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg animate-pulse">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="break-words leading-tight">{sendError}</span>
              </div>
            )}
          </div>

          {generatedDocs.length > 1 && (
            <div className="flex gap-2">
              {generatedDocs.map((doc, index) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocIndex(index)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedDocIndex === index
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
                    }`}
                >
                  Doc {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {sendSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">{sendSuccess}</p>
              <p className="text-xs text-emerald-700">Puedes cerrar este flujo cuando estés listo.</p>
            </div>
          </div>
          <button
            onClick={handleFinishAfterSend}
            className="px-4 py-2 text-xs rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all shadow"
          >
            Cerrar y finalizar
          </button>
        </div>
      )}

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
                <p><strong>Canal:</strong> {
                  campaignConfig.canalComunicacion === 'email' 
                    ? 'Correo' 
                    : campaignConfig.canalComunicacion === 'sms'
                      ? 'SMS'
                      : 'WhatsApp'
                }</p>
                <p><strong>Tipo:</strong> {campaignConfig.tipoAprobacion === 'sin_aprobacion' ? 'Sin Aprobación' : 'Con Aprobación'}</p>
                <p><strong>{contactLabel}:</strong> {recipientContact || 'No disponible'}</p>
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

      {/* Alerta de múltiples documentos */}
      <MultipleDocsAlertModal
        isOpen={showMultipleDocsAlert}
        onClose={() => setShowMultipleDocsAlert(false)}
        count={generatedDocs.length}
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
        {sendSuccess ? (
          <button
            onClick={handleFinishAfterSend}
            className="px-5 py-2 text-sm rounded-lg font-bold text-white bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg ml-auto flex items-center gap-2"
          >
            <CheckCircle2 className="h-3 w-3" />
            Finalizar
          </button>
        ) : (
          <button
            onClick={handleSendClick}
            disabled={!canSend || sending || checkingCredentials}
            className="px-5 py-2 text-sm rounded-lg font-bold text-white bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg ml-auto flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="h-3 w-3" />
            {checkingCredentials ? 'Verificando...' : 'Confirmar y enviar'}
          </button>
        )}
      </div>

      {!recipientContact && (
        <p className="text-xs text-red-600 mt-2">
          No encontramos un contacto para este canal. Regresa al Paso 1 para seleccionarlo.
        </p>
      )}

      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            {sending ? (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-4">
                  <Loader className="h-8 w-8 text-purple-600 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-purple-900 mb-1">Enviando comunicación...</p>
                <p className="text-xs text-purple-600">Esto puede tardar unos segundos.</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar y enviar</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Se enviará por <strong>{channelFriendlyName}</strong> desde:
                    <span className="block text-gray-900 font-medium">{recipientContact || 'No disponible'}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña del remitente *</label>
                  <input
                    type="password"
                    value={senderPassword}
                    onChange={(e) => setSenderPassword(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ingresa tu contraseña"
                    disabled={sending}
                  />
                  {sendError && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {sendError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={handleClosePasswordPrompt}
                    disabled={sending}
                    className="px-4 py-2 text-sm rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmSend}
                    disabled={sending}
                    className="px-5 py-2 text-sm rounded-lg font-bold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition disabled:opacity-60 flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Enviar ahora
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationStep4;
