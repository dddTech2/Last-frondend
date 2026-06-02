import React, { useState, useEffect, useCallback } from 'react';
import { 
  getTemplates, 
  getClientActiveNumbersByCedula, 
  getClientProfile,
  checkRoutingChannel,
  sendTemplatedMessage, 
  sendDirectWhatsAppMessage,
  getTemplatePreviewWithCedula, 
  getObligacionesByCedula,
  getConversation 
} from '../services/api';
import { debounce } from 'lodash';
import { MessageSquare, Phone } from 'lucide-react';

const InitiateConversationModal = ({ isOpen, onClose, onConversationInitiated }) => {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [cedula, setCedula] = useState('');
  const [phones, setPhones] = useState([]); // [{ phone, hasConversation }]
  const [selectedPhone, setSelectedPhone] = useState('');
  
  const [routingChannel, setRoutingChannel] = useState(null); // 'META' or 'EVOLUTION'
  const [sendMode, setSendMode] = useState(''); // 'template' or 'free_text'
  const [freeTextContent, setFreeTextContent] = useState('');
  
  const [obligaciones, setObligaciones] = useState([]);
  const [selectedObligacion, setSelectedObligacion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Preview messages state
  const [previewMessages, setPreviewMessages] = useState({});
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    } else {
      resetState();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const allTemplates = await getTemplates();
      const whatsAppTemplates = allTemplates.filter(
        (t) => t.channel_type === 'WHATSAPP' && t.status === 'APPROVED'
      );
      setTemplates(whatsAppTemplates);
    } catch (err) {
      console.error('Error fetching templates', err);
    }
  };

  const resetState = () => {
    setStep(1);
    setCedula('');
    setPhones([]);
    setSelectedPhone('');
    setRoutingChannel(null);
    setSendMode('');
    setFreeTextContent('');
    setSelectedTemplate(null);
    setObligaciones([]);
    setSelectedObligacion('');
    setIsLoading(false);
    setError('');
    setPreviewContent('');
  };

  const debouncedSearch = useCallback(
    debounce(async (cedula) => {
      if (cedula.length < 5) {
        setPhones([]);
        setError('');
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        // Fetch phones and conversations in parallel
        const [phonesData, profileData] = await Promise.all([
          getClientActiveNumbersByCedula(cedula).catch(() => ({ active_numbers: [] })),
          getClientProfile(cedula, 'conversations').catch(() => null)
        ]);

        const phoneNumbers = phonesData.active_numbers || [];
        const existingConversations = profileData?.whatsapp_conversations?.conversations || [];
        
        const phonesList = phoneNumbers.map(phone => {
          // Normalize phone for comparison
          const normalizedPhone = phone.startsWith('57') ? phone.slice(2) : phone;
          const conv = existingConversations.find(c => {
            const convPhone = c.customer_phone_number || '';
            const normalizedConvPhone = convPhone.startsWith('57') ? convPhone.slice(2) : convPhone;
            return normalizedConvPhone === normalizedPhone;
          });
          
          return { 
            phone, 
            hasConversation: !!conv,
            conversationContext: conv ? {
              conversationId: conv.conversation_id,
              updatedAt: conv.updated_at,
              assignedTo: conv.assigned_to_name,
              messageCount: conv.message_count
            } : null
          };
        });

        setPhones(phonesList);
        if (phonesList.length === 0) {
          setError('No se encontraron números para la cédula ingresada.');
        }
      } catch (err) {
        setError('Error al buscar el cliente.');
        setPhones([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  const handleCedulaChange = (e) => {
    const newCedula = e.target.value;
    setCedula(newCedula);
    setSelectedPhone('');
    setPhones([]);
    debouncedSearch(newCedula);
  };

  const handlePreviewMessagesClick = async (e, conversationId) => {
    e.stopPropagation();
    if (previewMessages[conversationId]) {
      // Toggle off
      setPreviewMessages(prev => {
        const copy = { ...prev };
        delete copy[conversationId];
        return copy;
      });
      return;
    }

    setLoadingPreviewId(conversationId);
    try {
      const response = await getConversation(conversationId, { limit: 5 });
      setPreviewMessages(prev => ({
        ...prev,
        [conversationId]: response.messages || []
      }));
    } catch (err) {
      console.error('Error fetching preview messages:', err);
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handlePhoneSelect = async (phone) => {
    setSelectedPhone(phone);
    setIsLoading(true);
    setError('');
    try {
      const routingData = await checkRoutingChannel(phone);
      const channel = routingData.channel; // 'META' or 'EVOLUTION'
      setRoutingChannel(channel);
      
      // If Meta, force template. If Evolution, we'll ask the user.
      if (channel === 'META') {
        setSendMode('template');
        setStep(2);
      } else {
        // Evolution allows both. Let's go to step 2 to show options.
        setSendMode('template'); // default but can be changed in UI
        setStep(2);
      }
    } catch (err) {
      setError('Error al validar el canal de ruteo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const proceedFromTemplateSelection = async () => {
    if (sendMode === 'free_text') {
      if (!freeTextContent.trim()) {
        setError('El mensaje no puede estar vacío.');
        return;
      }
      // For free text, skip obligation and go straight to preview/confirm
      setStep(4);
      return;
    }

    if (!selectedTemplate) {
      setError('Debe seleccionar una plantilla.');
      return;
    }

    // Template mode: fetch obligations
    setIsLoading(true);
    setError('');
    try {
      const data = await getObligacionesByCedula(cedula);
      const clientObligaciones = data.obligaciones || [];
      setObligaciones(clientObligaciones);
      
      if (clientObligaciones.length === 1) {
        // Auto-select and skip to preview
        const obligacion = clientObligaciones[0].obligacion;
        setSelectedObligacion(obligacion);
        await fetchPreview(obligacion);
      } else if (clientObligaciones.length === 0) {
        setError('El cliente no tiene obligaciones para esta plantilla.');
      } else {
        setStep(3);
      }
    } catch (err) {
      setError('Error al obtener las obligaciones.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreview = async (obligacion) => {
    setIsLoading(true);
    try {
      const preview = await getTemplatePreviewWithCedula(selectedTemplate.id, cedula, obligacion);
      setPreviewContent(preview.preview_content);
      setStep(4);
    } catch (err) {
      setError('Error al generar la previsualización.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleObligacionSelect = (obligacion) => {
    setSelectedObligacion(obligacion);
  };

  const handleSendMessage = async () => {
    setIsLoading(true);
    try {
      if (sendMode === 'free_text') {
        await sendDirectWhatsAppMessage({
          to: selectedPhone,
          type: 'text',
          text: { body: freeTextContent }
        });
      } else {
        await sendTemplatedMessage({
          template_id: selectedTemplate.id,
          phone_number: selectedPhone,
          cedula,
          obligacion: selectedObligacion,
        });
      }
      onConversationInitiated();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al enviar el mensaje.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ingresar Cédula y Seleccionar Destinatario</h2>
            <input
              type="text"
              value={cedula}
              onChange={handleCedulaChange}
              placeholder="Cédula del cliente..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
            />
            {isLoading && <p className="text-sm text-gray-500">Buscando...</p>}
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            
            {phones.length > 0 && (
              <div className="space-y-2 mt-2">
                <p className="text-sm font-medium text-gray-700">Seleccione un número para iniciar:</p>
                {phones.map((item, index) => (
                  <div 
                    key={index} 
                    onClick={() => handlePhoneSelect(item.phone)}
                    className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPhone === item.phone ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-800">{item.phone}</span>
                      </div>
                      {item.hasConversation && (
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <MessageSquare className="h-3 w-3" /> Chat Previo
                        </span>
                      )}
                    </div>
                    {item.hasConversation && item.conversationContext && (
                      <div className="mt-2 text-xs text-gray-500 flex flex-col gap-2 pl-7">
                        <div className="flex gap-4 items-center">
                          {item.conversationContext.updatedAt && (
                            <span>Últ. act: {new Date(item.conversationContext.updatedAt).toLocaleDateString()}</span>
                          )}
                          {item.conversationContext.assignedTo && (
                            <span>Asignado a: {item.conversationContext.assignedTo}</span>
                          )}
                          <span>({item.conversationContext.messageCount} msjs)</span>
                          <button 
                            onClick={(e) => handlePreviewMessagesClick(e, item.conversationContext.conversationId)}
                            className="text-blue-500 hover:text-blue-700 underline"
                          >
                            {previewMessages[item.conversationContext.conversationId] ? 'Ocultar mensajes' : 'Ver últimos mensajes'}
                          </button>
                          {loadingPreviewId === item.conversationContext.conversationId && (
                            <span className="text-gray-400">Cargando...</span>
                          )}
                        </div>
                        
                        {previewMessages[item.conversationContext.conversationId] && (
                          <div className="mt-2 bg-gray-100 p-2 rounded max-h-40 overflow-y-auto space-y-1">
                            {previewMessages[item.conversationContext.conversationId].slice().reverse().map(msg => (
                              <div key={msg.id} className={`flex flex-col ${msg.direction === 'outbound' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-2 py-1 rounded text-xs max-w-[80%] ${msg.direction === 'outbound' ? 'bg-green-100 text-green-800' : 'bg-white text-gray-800 border'}`}>
                                  <span className="break-words">{msg.body || '(Multimedia)'}</span>
                                </div>
                              </div>
                            ))}
                            {previewMessages[item.conversationContext.conversationId].length === 0 && (
                              <p className="text-gray-400 text-center italic">No hay mensajes recientes.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Configurar Mensaje</h2>
            <div className="mb-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p><span className="font-semibold">Destinatario:</span> {selectedPhone}</p>
              <p><span className="font-semibold">Ruta asignada:</span> {routingChannel === 'EVOLUTION' ? 'Evolution API' : 'Meta Oficial'}</p>
            </div>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {routingChannel === 'EVOLUTION' && (
              <div className="flex gap-4 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={sendMode === 'template'} 
                    onChange={() => setSendMode('template')} 
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span>Usar Plantilla</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={sendMode === 'free_text'} 
                    onChange={() => setSendMode('free_text')} 
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span>Texto Libre</span>
                </label>
              </div>
            )}

            {sendMode === 'free_text' ? (
              <div className="animate-in fade-in">
                <p className="text-sm text-gray-600 mb-2">Escribe el mensaje directo para iniciar la conversación:</p>
                <textarea
                  value={freeTextContent}
                  onChange={(e) => setFreeTextContent(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Hola, te contactamos de..."
                />
              </div>
            ) : (
              <div className="animate-in fade-in flex space-x-4">
                <div className="w-1/3 max-h-[300px] overflow-y-auto pr-2 border-r">
                  <ul className="space-y-2">
                    {templates.map((template) => (
                      <li
                        key={template.id}
                        title={template.name}
                        onClick={() => handleTemplateSelect(template)}
                        className={`p-2 border rounded-lg cursor-pointer text-sm truncate ${selectedTemplate?.id === template.id ? 'border-green-500 bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        {template.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-2/3 pl-2 max-h-[300px] overflow-y-auto">
                  {selectedTemplate ? (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-800">{selectedTemplate.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{selectedTemplate.category}</p>
                      <div
                        className="text-sm text-gray-700 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                      Selecciona una plantilla de la lista
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                Atrás
              </button>
              <button 
                onClick={proceedFromTemplateSelection} 
                disabled={isLoading || (sendMode === 'template' && !selectedTemplate) || (sendMode === 'free_text' && !freeTextContent.trim())} 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Cargando...' : 'Siguiente'}
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Obligación</h2>
            <p className="text-sm text-gray-600 mb-4">El cliente tiene varias obligaciones asociadas. Selecciona una para rellenar las variables de la plantilla.</p>
            {isLoading && <p className="text-sm text-gray-500">Cargando obligaciones...</p>}
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {obligaciones.map((obligacion, index) => (
                <div 
                  key={index} 
                  onClick={() => handleObligacionSelect(obligacion.obligacion)}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedObligacion === obligacion.obligacion ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center mr-3">
                    {selectedObligacion === obligacion.obligacion && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  </div>
                  <span className="font-medium text-gray-800">{obligacion.obligacion}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                Atrás
              </button>
              <button 
                onClick={() => fetchPreview(selectedObligacion)} 
                disabled={!selectedObligacion || isLoading} 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Cargando...' : 'Previsualizar'}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirmar Envío</h2>
            {error && <p className="text-sm text-red-500 mb-4 font-semibold">{error}</p>}
            
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Destinatario</span>
                  <span className="font-medium text-gray-900">{selectedPhone}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Modalidad</span>
                  <span className="font-medium text-gray-900">{sendMode === 'free_text' ? 'Texto Libre' : 'Plantilla'}</span>
                </div>
                {sendMode === 'template' && (
                  <>
                    <div className="col-span-2">
                      <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Obligación</span>
                      <span className="font-medium text-gray-900">{selectedObligacion}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="p-4 bg-gray-100">
                <span className="block text-gray-500 text-xs uppercase tracking-wider mb-2">Mensaje a enviar</span>
                <div className="bg-white p-3 rounded-md shadow-sm text-sm text-gray-800 border border-gray-200 max-h-[200px] overflow-y-auto">
                  {sendMode === 'free_text' ? (
                    <div className="whitespace-pre-wrap">{freeTextContent}</div>
                  ) : (
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: previewContent }} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button 
                onClick={() => setStep(sendMode === 'free_text' ? 2 : (obligaciones.length > 1 ? 3 : 2))} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Atrás
              </button>
              <button 
                onClick={handleSendMessage} 
                disabled={isLoading} 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : 'Confirmar y Enviar'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-6">
          {renderStep()}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitiateConversationModal;