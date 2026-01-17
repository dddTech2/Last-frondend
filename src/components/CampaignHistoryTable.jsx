import React from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent':
      case 'enviado':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'read':
      case 'leido':
        return 'bg-green-200 text-green-900'; // Darker green for read
      case 'failed':
      case 'fallido':
        return 'bg-red-100 text-red-800';
      case 'undelivered':
      case 'no entregado':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent':
      case 'enviado':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'delivered':
      case 'entregado':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'read':
      case 'leido':
        return <CheckCircle className="w-3 h-3 mr-1" />; // Double check visual usually
      case 'failed':
      case 'fallido':
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {status || 'Desconocido'}
    </span>
  );
};

const CampaignHistoryTable = ({ data, pagination, onPageChange, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando historial...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <FileText className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No hay registros</h3>
        <p className="text-gray-500 mt-2">No se encontraron envíos que coincidan con los filtros.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Envío
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaña
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Canal
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destinatario
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detalles
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(row.sent_at)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {row.campaign_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.channel}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="font-medium text-gray-900">{row.client_cedula}</div>
                  <div className="text-xs">{row.recipient_contact}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {row.error_message ? (
                    <div className="text-red-600 flex items-start gap-1 max-w-xs" title={row.error_message}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{row.error_message}</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 max-w-xs truncate" title={row.message_content}>
                      {row.message_content || '-'}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando página <span className="font-medium">{pagination.page}</span> de <span className="font-medium">{pagination.pages}</span> ({pagination.total} resultados)
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <span className="sr-only">Siguiente</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignHistoryTable;
