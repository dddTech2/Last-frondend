import React, { useState, useEffect, useCallback } from 'react';
import { getWhatsAppMessages } from '../../../services/api';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

const WhatsAppDataTable = ({ filters, selectedError, selectedStage }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const size = 20;

  const fetchTableData = useCallback(async (targetPage) => {
    setLoading(true);
    try {
      // Map UI stage labels to backend estado values
      const stageToEstado = {
        'Enviados': 'SENT',
        'Entregados': 'DELIVERED',
        'Leidos': 'READ',
        'Fallidos': 'FAILED',
        // English fallbacks
        'SENT': 'SENT',
        'DELIVERED': 'DELIVERED',
        'READ': 'READ',
        'FAILED': 'FAILED',
      };

      const params = {
        start_date: filters.startDate,
        end_date: filters.endDate,
        page: targetPage,
        size: size,
      };

      if (filters.campaignId) {
        params.campaign_id = filters.campaignId;
      }

      // Apply estado filter from funnel click or error click
      if (selectedError) {
        params.estado = 'FAILED';
      } else if (selectedStage) {
        const mapped = stageToEstado[selectedStage];
        if (mapped) params.estado = mapped;
      }

      const response = await getWhatsAppMessages(params);
      
      if (response && response.items) {
        // Client-side filter by specific error text (backend doesn't filter by error string)
        let itemsToSet = response.items;
        if (selectedError) {
          itemsToSet = itemsToSet.filter(item => item.error && item.error.includes(selectedError));
        }
        setData(itemsToSet);
        setTotalPages(response.pages || 1);
        setTotalItems(response.total || 0);
      } else {
        setData([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      toast.error('Error al cargar la tabla de mensajes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedError, selectedStage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    fetchTableData(1);
  }, [filters, selectedError, selectedStage]);

  // Fetch when page changes (but not on initial mount which is handled above)
  useEffect(() => {
    if (page > 1) fetchTableData(page);
  }, [page]);

  const getStatusBadge = (status) => {
    const badges = {
      'SENT': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-teal-100 text-teal-800',
      'READ': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getOriginBadge = (tipoOrigen) => {
    const badges = {
      'CAMPAIGN': 'bg-indigo-50 text-indigo-700',
      'COMMUNICATION': 'bg-amber-50 text-amber-700',
      'AGENT_CHAT': 'bg-pink-50 text-pink-700',
    };
    const labels = {
      'CAMPAIGN': 'Campana',
      'COMMUNICATION': 'Comunicacion',
      'AGENT_CHAT': 'Chat Agente',
    };
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full ${badges[tipoOrigen] || 'bg-gray-100 text-gray-600'}`}>
        {labels[tipoOrigen] || tipoOrigen || '-'}
      </span>
    );
  };

  const activeFilterLabel = selectedError
    ? `Error: "${selectedError}"`
    : selectedStage
    ? `Estado: ${selectedStage}`
    : null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Detalle de Mensajes</h3>
          {activeFilterLabel && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              Filtrado por: {activeFilterLabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchTableData(page)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            title="Actualizar tabla"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefono</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cedula</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Origen</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Respuesta</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                  Cargando datos...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">
                  No se encontraron mensajes con los filtros actuales.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id_mensaje} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {row.fecha_hora ? new Date(row.fecha_hora).toLocaleString('es-CO') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                    {row.telefono_cliente || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                    {row.cedula || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getOriginBadge(row.tipo_origen)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate" title={row.nombre_origen}>
                    {row.nombre_origen || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(row.estado)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {row.hubo_respuesta === true ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Si</span>
                    ) : row.hubo_respuesta === false ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 max-w-[200px] truncate" title={row.error}>
                    {row.error || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
        <div className="flex-1 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Pagina <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
              {' '}({new Intl.NumberFormat('es-CO').format(totalItems)} registros)
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Siguiente
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppDataTable;
