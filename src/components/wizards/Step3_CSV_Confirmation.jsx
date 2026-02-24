import React, { useState } from 'react';
import { FileText, Send, Users, MessageSquare, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { testCampaignCSV } from '../../services/api';

const Step3_CSV_Confirmation = ({ campaignData }) => {
  const [testNumber, setTestNumber] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const getBatchSize = () => {
    switch (campaignData.channel?.toUpperCase()) {
      case 'WHATSAPP':
        return '1,000';
      case 'SMS':
      case 'EMAIL':
        return '10,000';
      default:
        return '1,000';
    }
  };

  const getChannelIcon = () => {
    switch (campaignData.channel?.toUpperCase()) {
      case 'WHATSAPP':
        return '📱';
      case 'SMS':
        return '💬';
      case 'EMAIL':
        return '📧';
      default:
        return '📨';
    }
  };

  const handleTestMessage = async () => {
    if (!testNumber || testNumber.trim() === '') {
      toast.error('Por favor ingresa un número de teléfono válido.');
      return;
    }

    try {
      setIsTesting(true);
      
      const formData = new FormData();
      
      // Clona el archivo para evitar problemas de ERR_UPLOAD_FILE_CHANGED en el navegador
      // Esto sucede cuando se usa el mismo File object en múltiples FormData
      const clonedFile = new File([await campaignData.csvFile.arrayBuffer()], campaignData.csvFile.name, { type: campaignData.csvFile.type });
      formData.append('file', clonedFile);

      formData.append('template_id', campaignData.message_template_id);
      formData.append('channel', campaignData.channel?.toUpperCase() || 'WHATSAPP');
      formData.append('campaign_name', campaignData.name);
      formData.append('test_number', testNumber);

      const response = await testCampaignCSV(formData);
      
      if (response && response.status === 'success') {
        toast.success(`Mensaje de prueba enviado correctamente a ${testNumber}`);
        setTestNumber('');
      } else {
        toast.success('Prueba enviada. Por favor verifica tu dispositivo.');
      }
    } catch (error) {
      console.error('Error enviando mensaje de prueba:', error);
      toast.error(`Error en la prueba: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Confirmar Envío de Campaña</h2>
        <p className="text-gray-600 mt-2">
          Revisa los detalles antes de lanzar tu campaña
        </p>
      </div>

      {/* Resumen de la Campaña */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Resumen de la Campaña
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nombre de Campaña</p>
            <p className="text-lg font-semibold text-gray-900">{campaignData.name}</p>
          </div>

          {/* Canal */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Canal</p>
            <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>{getChannelIcon()}</span>
              {campaignData.channel?.toUpperCase()}
            </p>
          </div>

          {/* Plantilla */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Plantilla</p>
            <p className="text-base font-medium text-gray-900">{campaignData.templateName || 'N/A'}</p>
          </div>

          {/* Destinatarios */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Destinatarios</p>
            <p className="text-lg font-semibold text-green-600 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {campaignData.csvRowCount?.toLocaleString() || 0}
            </p>
          </div>

          {/* Batch Size */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tamaño de Lote</p>
            <p className="text-base font-medium text-gray-900">{getBatchSize()} mensajes/lote</p>
          </div>

          {/* Tipo de Envío */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo de Envío</p>
            <p className="text-base font-medium text-blue-600 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Inmediato
            </p>
          </div>
        </div>
      </div>

      {/* Mensaje de Prueba */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Phone className="h-5 w-5 text-indigo-500" />
          Enviar Mensaje de Prueba
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa un número telefónico para recibir un mensaje de prueba con un contacto aleatorio del CSV.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow">
            <input
              type="tel"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="Ej. 573001234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isTesting}
            />
          </div>
          <button
            onClick={handleTestMessage}
            disabled={isTesting || !testNumber.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Prueba
              </>
            )}
          </button>
        </div>
      </div>

      {/* Información Importante */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Importante:</p>
            <ul className="mt-2 text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>La campaña comenzará a enviarse inmediatamente después de confirmar</li>
              <li>Los mensajes se enviarán en lotes de {getBatchSize()} para optimizar el rendimiento</li>
              <li>No podrás cancelar el envío una vez iniciado</li>
              <li>Podrás ver el progreso en tiempo real desde el panel de campañas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Archivo CSV */}
      {campaignData.csvFile && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Archivo CSV:</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>{campaignData.csvFile.name}</span>
            <span className="text-gray-400">•</span>
            <span>{(campaignData.csvFile.size / 1024).toFixed(2)} KB</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3_CSV_Confirmation;
