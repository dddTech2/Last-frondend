import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserMinus, CheckCircle, XCircle, AlertCircle, Loader2, MessageSquare, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ModernModal from '../components/ModernModal';
import FormField from '../components/FormField';
import PersonalDetailView from '../components/PersonalDetailView';
import * as api from '../services/api';

const LegalCommunicationsApprovalPage = () => {
  const [activeTab, setActiveTab] = useState('INGRESOS');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para ver detalles
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Estado para el modal de rechazo
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, cedula: null, type: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar datos según la pestaña activa
  const fetchData = useCallback(async () => {
    if (activeTab === 'COMUNICACIONES') return; // Módulo deshabilitado

    setLoading(true);
    try {
      let params = {};
      if (activeTab === 'INGRESOS') {
        params = { estado: 'PENDIENTE_APROBACION_JURIDICO' };
      } else if (activeTab === 'RETIROS') {
        params = { estado: 'PENDIENTE_RETIRO_JURIDICO' };
      }

      const response = await api.getEmployees(params);
      // Manejar respuesta paginada o array directo
      const items = response.items || response || [];
      setData(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('No se pudieron cargar los datos pendientes.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler para ver detalles
  const handleViewDetail = async (personal) => {
    setSelectedPersonal(personal);
    setViewDetailModal(true);
    setDetailLoading(true);
    try {
      const details = await api.getEmployeeByCedula(personal.cedula);
      if (details) {
        setSelectedPersonal(details);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Error al cargar los detalles del empleado');
    } finally {
      setDetailLoading(false);
    }
  };

  // Handlers de Aprobación
  const handleApprove = async (cedula) => {
    setActionLoading(true);
    try {
      if (activeTab === 'INGRESOS') {
        await api.approveContract(cedula);
        toast.success('Contrato aprobado correctamente');
      } else if (activeTab === 'RETIROS') {
        await api.approveRetirement(cedula);
        toast.success('Retiro aprobado correctamente');
      }
      fetchData(); // Recargar lista
    } catch (error) {
      console.error('Error approving:', error);
      toast.error(error.message || 'Error al aprobar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers de Rechazo
  const openRejectionModal = (cedula) => {
    setRejectionModal({ isOpen: true, cedula, type: activeTab });
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Debes ingresar un motivo de rechazo');
      return;
    }

    setActionLoading(true);
    try {
      if (rejectionModal.type === 'INGRESOS') {
        await api.rejectContract(rejectionModal.cedula, rejectionReason);
        toast.success('Contrato rechazado correctamente');
      } else if (rejectionModal.type === 'RETIROS') {
        // Nota: El backend espera 'motivo_rechazo_juridico' en el body, api.rejectRetirement ya lo maneja
        await api.rejectRetirement(rejectionModal.cedula, rejectionReason);
        toast.success('Retiro rechazado correctamente');
      }
      setRejectionModal({ isOpen: false, cedula: null, type: null });
      fetchData();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error(error.message || 'Error al rechazar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  // Estilos de botones (Tabs)
  const getButtonClasses = (tabName) => {
    const baseClasses = "flex-1 flex items-center justify-center py-2 px-5 rounded-lg text-sm font-medium transition-colors duration-200 gap-2";
    if (activeTab === tabName) {
      return `${baseClasses} bg-white text-gray-800 shadow-sm`;
    }
    return `${baseClasses} text-gray-500 hover:bg-gray-200`;
  };

  // Renderizado de Tabla
  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-600" />
          <p>Cargando solicitudes...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
          <div className="flex justify-center mb-4">
            {activeTab === 'INGRESOS' ? <UserPlus className="h-12 w-12 text-gray-300" /> : <UserMinus className="h-12 w-12 text-gray-300" />}
          </div>
          <p className="text-lg font-medium text-gray-900">No hay solicitudes pendientes</p>
          <p className="text-sm">Actualmente no hay {activeTab === 'INGRESOS' ? 'ingresos' : 'retiros'} que requieran aprobación.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Cédula</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Área</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item) => (
                <tr key={item.cedula} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.nombre}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{item.cedula}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.cargo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.area}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewDetail(item)}
                        disabled={detailLoading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Ver Detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleApprove(item.cedula)}
                        disabled={actionLoading}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Aprobar"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openRejectionModal(item.cedula)}
                        disabled={actionLoading}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Rechazar"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Centro de Aprobaciones Jurídicas</h1>
        <p className="text-gray-500 mt-1">Gestiona las aprobaciones de ingresos, retiros y comunicaciones desde un solo lugar.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-gray-100 p-1 rounded-xl flex gap-1 overflow-x-auto">
        <button onClick={() => setActiveTab('INGRESOS')} className={getButtonClasses('INGRESOS')}>
          <UserPlus className="h-4 w-4" />
          Ingresos
        </button>
        <button onClick={() => setActiveTab('RETIROS')} className={getButtonClasses('RETIROS')}>
          <UserMinus className="h-4 w-4" />
          Retiros
        </button>
        <button onClick={() => setActiveTab('COMUNICACIONES')} className={getButtonClasses('COMUNICACIONES')}>
          <MessageSquare className="h-4 w-4" />
          Comunicaciones
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'COMUNICACIONES' ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500 h-full flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Módulo Deshabilitado</h3>
            <p className="text-sm max-w-md mx-auto mt-2">
              La aprobación de batches jurídicos se encuentra temporalmente deshabilitada. Por favor contacte al administrador del sistema para más información.
            </p>
          </div>
        ) : (
          renderTable()
        )}
      </div>

      {/* Modal de Rechazo */}
      <ModernModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, cedula: null, type: null })}
        title={`Rechazar Solicitud - ${rejectionModal.type === 'INGRESOS' ? 'Ingreso' : 'Retiro'}`}
        size="md"
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => setRejectionModal({ isOpen: false, cedula: null, type: null })}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmReject}
              className="px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Rechazo
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Esta acción notificará al área correspondiente para que realice las correcciones necesarias.
            </p>
          </div>
          <FormField
            label="Motivo del rechazo"
            type="textarea"
            placeholder="Describe detalladamente por qué se rechaza esta solicitud..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            className="min-h-[120px]"
          />
        </div>
      </ModernModal>

      {/* Modal de Ver Detalles */}
      {selectedPersonal && (
        <ModernModal
          isOpen={viewDetailModal}
          onClose={() => setViewDetailModal(false)}
          title={`Detalles - ${selectedPersonal.nombre}`}
          size="xl"
        >
          <PersonalDetailView personal={selectedPersonal} isLoading={detailLoading} />
        </ModernModal>
      )}
    </div>
  );
};

export default LegalCommunicationsApprovalPage;
