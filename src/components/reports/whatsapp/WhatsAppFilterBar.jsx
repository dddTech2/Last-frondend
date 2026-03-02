import React from 'react';
import { Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

const WhatsAppFilterBar = ({ startDate, endDate, onDateChange, campaignId, onCampaignChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              value={startDate}
              onChange={(e) => onDateChange('start', e.target.value)}
            />
          </div>
          <span className="text-gray-500">-</span>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              value={endDate}
              onChange={(e) => onDateChange('end', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">ID de Campaña (Opcional)</label>
        <input
          type="text"
          placeholder="Ej: C-12345"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          value={campaignId}
          onChange={(e) => onCampaignChange(e.target.value)}
        />
      </div>
      
      <div>
        <button 
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          onClick={() => {
            onDateChange('start', format(subDays(new Date(), 30), 'yyyy-MM-dd'));
            onDateChange('end', format(new Date(), 'yyyy-MM-dd'));
            onCampaignChange('');
          }}
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};

export default WhatsAppFilterBar;
