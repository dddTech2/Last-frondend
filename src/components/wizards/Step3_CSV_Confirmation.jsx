import React from 'react';
import { FileText, Send, Users, MessageSquare } from 'lucide-react';

const Step3_CSV_Confirmation = ({ campaignData }) => {
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
