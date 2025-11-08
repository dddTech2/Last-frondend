import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const CommunicationStep3 = ({ communicationType, campaignConfig, onNext, onBack, onPreview }) => {
  const [messageContent, setMessageContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!messageContent.trim()) {
      newErrors.messageContent = 'El contenido del mensaje es requerido';
    }
    
    const charLimit = communicationType.id === 'sms' ? 160 : 5000;
    if (messageContent.length > charLimit) {
      newErrors.messageContent = `El contenido excede el límite de ${charLimit} caracteres`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext({
        ...campaignConfig,
        messageContent,
      });
    }
  };

  const charLimit = communicationType.id === 'sms' ? 160 : 5000;
  const charCount = messageContent.length;
  const charPercentage = (charCount / charLimit) * 100;

  const getPreviewComponent = () => {
    switch (communicationType.id) {
      case 'email':
        return <EmailPreview content={messageContent} />;
      case 'sms':
        return <SMSPreview content={messageContent} />;
      case 'whatsapp':
        return <WhatsAppPreview content={messageContent} />;
      default:
        return null;
    }
  };

  const insertPlaceholder = (placeholder) => {
    setMessageContent(prev => prev + ` ${placeholder}`);
  };

  const placeholders = [
    { label: '{nombre_cliente}', hint: 'Nombre del cliente' },
    { label: '{email}', hint: 'Email del cliente' },
    { label: '{telefono}', hint: 'Teléfono del cliente' },
    { label: '{fecha}', hint: 'Fecha actual' },
    { label: '{saldo}', hint: 'Saldo pendiente' },
  ];

  return (
    <div className="space-y-4 text-sm max-h-full overflow-y-auto">
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-3">
        <h3 className="font-semibold text-emerald-900 mb-2 text-sm flex items-center gap-2">
          <span className="text-lg">✏️</span> Redacta tu Mensaje
        </h3>
        <p className="text-emerald-700 text-sm font-medium">
          Canal: <span className="font-semibold">{communicationType.title}</span>
        </p>
      </div>

      {/* Editor */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">
          Contenido *
        </label>
        
        {communicationType.id === 'email' ? (
          <RichTextEditor
            value={messageContent}
            onChange={setMessageContent}
            placeholder="Escribe tu email..."
          />
        ) : (
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={`Escribe tu ${communicationType.id === 'sms' ? 'SMS' : 'WhatsApp'}...`}
            rows="3"
            className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono resize-none ${
              errors.messageContent ? 'border-red-500 bg-red-50' : 'border-emerald-300 bg-white'
            }`}
          />
        )}
        
        {errors.messageContent && (
          <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.messageContent}
          </p>
        )}
      </div>

      {/* Character Counter */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 p-2 rounded-lg text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-gray-700">
            Caracteres: <span className={charPercentage > 80 ? 'text-red-600 font-bold' : 'text-emerald-600'}>{charCount}</span> / {charLimit}
          </span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all rounded-full ${
              charPercentage > 90 ? 'bg-red-600' : charPercentage > 80 ? 'bg-yellow-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(charPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Placeholders */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 p-2 rounded-lg text-xs">
        <p className="font-semibold text-purple-900 mb-2">📌 Personalización</p>
        <div className="flex flex-wrap gap-1.5">
          {placeholders.map((ph) => (
            <button
              key={ph.label}
              onClick={() => insertPlaceholder(ph.label)}
              title={ph.hint}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-xs rounded-md font-bold transition-all shadow-sm hover:shadow-md"
            >
              <span>+</span>
              <code className="font-bold text-xs">{ph.label}</code>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="border-t border-gray-300 pt-2 space-y-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Ocultar' : 'Ver'} Preview
        </button>

        {showPreview && messageContent && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-300 rounded-lg p-2 max-h-36 overflow-y-auto text-xs">
            {getPreviewComponent()}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-2 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-blue-900 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span><strong>Campaña:</strong> {campaignConfig.campaignName}</span>
        </div>
        <div className="flex items-center gap-2 text-blue-900 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span><strong>Envío:</strong> {campaignConfig.schedule === 'immediate' ? 'Inmediato' : 'Programado'}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-300">
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 text-xs rounded-lg font-bold text-white bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg ml-auto"
        >
          Crear Campaña
        </button>
      </div>
    </div>
  );
};

// Preview Components
const EmailPreview = ({ content }) => (
  <div className="bg-white rounded border border-gray-300 overflow-hidden text-xs">
    <div className="bg-gray-100 px-2 py-1.5 border-b border-gray-300">
      <p className="text-xs text-gray-600 font-semibold">communications@renovar.com</p>
      <p className="text-xs text-gray-600">to: cliente@example.com</p>
    </div>
    <div className="p-2">
      <div className="prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  </div>
);

const SMSPreview = ({ content }) => (
  <div className="space-y-2">
    <div className="flex justify-end">
      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-3 py-1.5 max-w-xs text-xs">
        {content}
      </div>
    </div>
  </div>
);

const WhatsAppPreview = ({ content }) => (
  <div className="bg-green-100 rounded-lg p-2 space-y-2">
    <div className="flex justify-end">
      <div className="bg-green-200 text-gray-900 rounded-lg rounded-tr-none px-2 py-1 max-w-xs text-xs">
        <p>{content}</p>
        <p className="text-xs text-gray-600 mt-0.5 text-right">09:34</p>
      </div>
    </div>
  </div>
);

export default CommunicationStep3;
