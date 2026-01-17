import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, X } from 'lucide-react';

const CampaignHistoryFilters = ({ onFilterChange, onExport, isLoading }) => {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    channel: '',
    status: '',
    client_cedula: '',
    recipient_contact: ''
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportEmail, setExportEmail] = useState('');

  // Debounce simple inputs if needed, but for now we'll rely on the "Search" button or auto-update
  // Let's use a "Apply Filters" approach or auto-effect? 
  // Given it might be a heavy query, maybe a button or debounced effect.
  // Let's use a "Buscar" button for explicit action, or debounce. 
  // The user requirement didn't specify, but for history/reports, explicit search is often safer.
  // However, `CampaignsPage` usually filters instantly. Let's use debounce or effect.

  // Let's update parent immediately for now, parent can debounce if needed or we debounce here.
  // Actually, usually it's better to pass filters up.
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleClear = () => {
    const emptyFilters = {
      start_date: '',
      end_date: '',
      channel: '',
      status: '',
      client_cedula: '',
      recipient_contact: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const confirmExport = () => {
    if (exportEmail) {
      onExport(filters, exportEmail);
      setShowExportModal(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* Rango de Fechas */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Canal */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Canal</label>
            <select
              name="channel"
              value={filters.channel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="sent">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="read">Leído</option>
              <option value="failed">Fallido</option>
              <option value="undelivered">No Entregado</option>
            </select>
          </div>

          {/* Cédula */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cédula Cliente</label>
            <input
              type="text"
              name="client_cedula"
              placeholder="Ej. 12345678"
              value={filters.client_cedula}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contacto */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contacto (Tel/Email)</label>
            <input
              type="text"
              name="recipient_contact"
              placeholder="Ej. 3001234567"
              value={filters.recipient_contact}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="md:col-span-2 lg:col-span-2 flex items-end gap-2">
            <button
              type="submit"
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar
            </button>
            <div className="flex-grow"></div>
            <button
              type="button"
              onClick={handleExportClick}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Todo
            </button>
          </div>
        </div>
      </form>

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Exportar Reporte</h3>
            <p className="text-sm text-gray-500 mb-4">
              El reporte completo se generará en segundo plano y se enviará a tu correo electrónico.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={exportEmail}
                onChange={(e) => setExportEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmExport}
                disabled={!exportEmail}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmar Exportación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignHistoryFilters;
