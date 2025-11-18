import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftRight, Clock, RefreshCcw, XCircle } from 'lucide-react';

const statusLabels = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
};

const mockCommunications = [
  {
    id: 'demo-001',
    clientName: 'María Rodríguez',
    channel: 'EMAIL',
    templateName: 'Carta de Condición',
    requestedBy: 'Equipo Comercial',
    createdAt: '2025-11-18T09:45:00Z',
    status: 'PENDING',
  },
  {
    id: 'demo-002',
    clientName: 'Carlos Pérez',
    channel: 'WHATSAPP',
    templateName: 'Recordatorio de Pago',
    requestedBy: 'Mesa Operativa',
    createdAt: '2025-11-17T15:02:00Z',
    status: 'APPROVED',
  },
];

const LegalCommunicationsApprovalPage = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommunications = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Reemplazar con el endpoint real cuando esté disponible
        await new Promise(resolve => setTimeout(resolve, 600));
        setCommunications(mockCommunications);
      } catch (err) {
        setError(err?.message || 'No pudimos cargar las comunicaciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunications();
  }, []);

  const filteredCommunications = useMemo(() => {
    if (statusFilter === 'ALL') return communications;
    return communications.filter(comm =>
      statusFilter === 'PENDING'
        ? comm.status === 'PENDING'
        : comm.status === statusFilter
    );
  }, [communications, statusFilter]);

  const handleRefresh = () => {
    setStatusFilter(prev => prev);
  };

  const renderStatusBadge = (status) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
      {statusLabels[status] || status}
    </span>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Aprobación Jurídica de Comunicaciones</h1>
          <p className="text-gray-500 text-sm">Revisa, aprueba o rechaza comunicaciones finales antes de su envío.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100"
        >
          <RefreshCcw className="h-4 w-4" /> Recargar
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
        {[
          { key: 'ALL', label: 'Todas' },
          { key: 'PENDING', label: 'Pendientes' },
          { key: 'APPROVED', label: 'Aprobadas' },
          { key: 'REJECTED', label: 'Rechazadas' },
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              statusFilter === filter.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center space-y-2">
          <Clock className="h-10 w-10 text-blue-500 mx-auto animate-spin" />
          <p className="font-semibold text-gray-700">Cargando comunicaciones...</p>
          <p className="text-sm text-gray-500">Esto tomará solo un momento.</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-rose-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Error</p>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && filteredCommunications.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center space-y-2">
          <ArrowLeftRight className="h-10 w-10 text-gray-400 mx-auto" />
          <p className="font-semibold text-gray-700">Sin comunicaciones con este filtro</p>
          <p className="text-sm text-gray-500">Prueba cambiando el filtro o vuelve más tarde.</p>
        </div>
      )}

      {!loading && !error && filteredCommunications.length > 0 && (
        <div className="grid gap-4">
          {filteredCommunications.map(comm => (
            <div key={comm.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400">ID</p>
                <p className="text-sm font-mono text-gray-800">{comm.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Cliente</p>
                <p className="text-sm text-gray-800">{comm.clientName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Plantilla</p>
                <p className="text-sm text-gray-800">{comm.templateName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Canal</p>
                <p className="text-sm text-gray-800">{comm.channel}</p>
              </div>
              <div className="flex flex-col items-start">
                <p className="text-xs font-semibold text-gray-400">Estado</p>
                {renderStatusBadge(comm.status)}
              </div>
              {comm.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Aprobar</button>
                  <button className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg">Rechazar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LegalCommunicationsApprovalPage;
