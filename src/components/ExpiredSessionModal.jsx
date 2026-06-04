import React, { useState, useEffect } from 'react';
import { getTemplates, sendTemplatedMessage, getTemplatePreviewWithCedula } from '../services/api';
import { toast } from 'sonner';

const ExpiredSessionModal = ({ isOpen, onClose, onConversationInitiated, conversation, clientInfo, onTemplateSelect, onObligationSelect }) => {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [obligaciones, setObligaciones] = useState([]);
  const [selectedObligacion, setSelectedObligacion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (clientInfo && clientInfo.obligaciones) {
        const clientObligaciones = clientInfo.obligaciones.obligaciones || [];
        setObligaciones(clientObligaciones);
        if (clientObligaciones.length === 1) {
          setSelectedObligacion(clientObligaciones[0].obligacion);
        }
      }
    } else {
      resetState();
    }
  }, [isOpen, clientInfo]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const allTemplates = await getTemplates();
      const whatsAppTemplates = allTemplates.filter(
        (t) => t.channel_type === 'WHATSAPP' && t.status === 'APPROVED'
      );
      setTemplates(whatsAppTemplates);
      if (whatsAppTemplates.length > 0) {
        setSelectedTemplate(whatsAppTemplates[0]);
      }
    } catch (err) {
      const message = err?.message || 'Error al cargar las plantillas';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setTemplates([]);
    setSelectedTemplate(null);
    setObligaciones([]);
    setSelectedObligacion('');
    setIsLoading(false);
    setError('');
    setPreviewContent('');
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleTemplateSubmit = async () => {
    if (obligaciones.length === 1) {
      await fetchPreview(selectedObligacion);
    } else {
      setStep(2);
    }
  };

  const handleObligacionSelect = (obligacion) => {
    setSelectedObligacion(obligacion);
    onObligationSelect(obligacion);
  };

  const fetchPreview = async (obligacion) => {
    if (!selectedTemplate || !conversation.client_cedula) return;
    setIsLoading(true);
    try {
      const preview = await getTemplatePreviewWithCedula(selectedTemplate.id, conversation.client_cedula, obligacion);
      setPreviewContent(preview.preview_content);
      setStep(3);
    } catch (err) {
      const message = err?.message || 'Error al generar la previsualización';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTemplate || !selectedObligacion) return;
    setIsLoading(true);
    setError('');
    try {
      await sendTemplatedMessage({
        template_id: selectedTemplate.id,
        phone_number: conversation.customer_phone_number,
        cedula: conversation.client_cedula,
        obligacion: selectedObligacion,
      });
      toast.success('Plantilla enviada correctamente');
      onConversationInitiated();
      onClose();
    } catch (err) {
      const message = err?.message || 'Error al enviar el mensaje';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Plantilla</h2>
            {isLoading && <p>Cargando plantillas...</p>}
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex space-x-4">
              <div className="w-1/3 max-h-[400px] overflow-y-auto">
                <ul className="space-y-2">
                  {templates.map((template) => (
                    <li
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-2 border rounded-lg cursor-pointer ${selectedTemplate?.id === template.id ? 'border-green-500 bg-green-50' : 'hover:bg-gray-100'}`}
                    >
                      {template.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-2/3 p-4 border rounded-lg max-h-[400px] overflow-y-auto">
                {selectedTemplate && (
                  <div>
                    <h3 className="font-semibold">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-500">{selectedTemplate.category}</p>
                    <div
                      className="mt-2 p-2 bg-gray-100 rounded"
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                    />
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleTemplateSubmit} disabled={!selectedTemplate} className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg disabled:bg-gray-400">
              Siguiente
            </button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Obligación</h2>
            {isLoading && <p>Cargando obligaciones...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {obligaciones.map((obligacion, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  id={`obligacion-${index}`}
                  name="obligacion"
                  value={obligacion.obligacion}
                  checked={selectedObligacion === obligacion.obligacion}
                  onChange={() => handleObligacionSelect(obligacion.obligacion)}
                  className="mr-2"
                />
                <label htmlFor={`obligacion-${index}`}>{obligacion.obligacion}</label>
              </div>
            ))}
            <button onClick={() => fetchPreview(selectedObligacion)} disabled={!selectedObligacion} className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg disabled:bg-gray-400">
              Previsualizar
            </button>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirmar Envío</h2>
            {error && <p className="text-red-500 mb-4 font-semibold">{error}</p>}
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="font-semibold">Destinatario:</p>
              <p>{conversation.customer_phone_number}</p>
              <p className="font-semibold mt-2">Obligación:</p>
              <p>{selectedObligacion}</p>
              <p className="font-semibold mt-4">Mensaje:</p>
              <div className="p-2 border rounded-md bg-white max-h-[200px] overflow-y-auto">
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(obligaciones.length > 1 ? 2 : 1)} className="px-4 py-2 bg-gray-200 rounded-lg">
                Atrás
              </button>
              <button onClick={handleSendMessage} disabled={isLoading} className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:bg-gray-400">
                {isLoading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
        {renderStep()}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiredSessionModal;