import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import CampaignActionMenu from "./CampaignActionMenu";
import CampaignReportDrawer from "./CampaignReportDrawer";
import { getCampaignStats, refreshCampaignStats } from "../services/api";
import { toast } from "sonner";

// --- Helper para obtener el ícono y la capitalización del canal ---
const getChannelInfo = (channel) => {
  switch (channel.toLowerCase()) {
    case 'whatsapp':
      return { icon: '💬', name: 'WhatsApp' };
    case 'sms':
      return { icon: '📲', name: 'SMS' };
    case 'email':
      return { icon: '📧', name: 'Email' };
    default:
      return { icon: '📢', name: channel };
  }
};

// --- Helper para el color del estado ---
const getStatusColor = (status) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('completed') || lowerStatus.includes('completada')) return "bg-green-200 text-green-900 border border-green-400";
  if (lowerStatus.includes('error')) return "bg-red-200 text-red-900 border border-red-400";
  if (lowerStatus.includes('sending') || lowerStatus.includes('enviando')) return "bg-orange-200 text-orange-900 border border-orange-400";
  if (lowerStatus.includes('scheduled') || lowerStatus.includes('programada')) return "bg-blue-200 text-blue-900 border border-blue-400";
  if (lowerStatus.includes('pending') || lowerStatus.includes('pendiente')) return "bg-yellow-200 text-yellow-900 border border-yellow-400";
  if (lowerStatus.includes('rejected') || lowerStatus.includes('rechazada')) return "bg-gray-300 text-gray-900 border border-gray-400";
  return "bg-gray-100 text-gray-700 border border-gray-300";
};

export default function CampaignsTable({ channelFilter }) {
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const fetchCampaignStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCampaignStats();
      setCampaigns(data);
      setError(null);
    } catch (err) {
      // Si es error 403, el usuario no tiene permisos
      if (err.response?.status === 403) {
        setError("No tienes permisos para ver las estadísticas de campañas. Contacta al administrador.");
      } else {
        setError("Error al cargar las estadísticas. Por favor, intente de nuevo.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaignStats();
  }, [fetchCampaignStats]);

  // Detectar si se acaba de crear una campaña y ejecutar fetch automático
  useEffect(() => {
    if (location.state?.refreshNeeded) {
      // Mostrar notificación de que se actualizará en 5 segundos
      toast.info("Actualizando tabla en 5 segundos...", {
        description: "Los cambios se reflejarán pronto.",
        duration: 5000,
      });
      
      // Esperar 5 segundos para que la vista materializada se actualice
      const timer = setTimeout(async () => {
        toast.promise(fetchCampaignStats(), {
          loading: 'Actualizando tabla...',
          success: 'Tabla actualizada correctamente',
          error: 'Error al actualizar la tabla',
        });
      }, 5000);
      
      // Limpiar el estado de navegación para evitar refrescos repetidos
      window.history.replaceState({}, document.title);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, fetchCampaignStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Solicitando actualización de estadísticas...");
    try {
      await refreshCampaignStats();
      toast.success("La actualización se está procesando en segundo plano.", {
        description: "Los datos se reflejarán en breve.",
      });
      // Opcional: re-fetch después de un delay para dar tiempo a la actualización
      setTimeout(fetchCampaignStats, 5000); // Espera 5 segundos
    } catch (err) {
      toast.error("Error al solicitar la actualización.");
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Función para actualizar automáticamente después de acciones (activar/desactivar/eliminar)
  const handleCampaignAction = async () => {
    try {
      await refreshCampaignStats();
      toast.success("Actualizando estadísticas...", {
        description: "Los cambios se reflejarán en breve.",
      });
      // Re-fetch después de un delay para dar tiempo a la actualización
      setTimeout(fetchCampaignStats, 5000);
    } catch (err) {
      console.error("Error al actualizar estadísticas:", err);
      toast.error("Error al actualizar estadísticas");
    }
  };

  const filteredCampaigns =
    channelFilter === 'Todos'
      ? campaigns
      : campaigns.filter((c) => getChannelInfo(c.channel_type).name === channelFilter);

  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredCampaigns.length / rowsPerPage);

  if (loading) {
    return <div className="text-center p-10">Cargando campañas...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <>
      <div>
        <div className="p-6 bg-white rounded-t-xl flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 mt-1">Todas las campañas creadas y su estado actual.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: '#1e2939', ...( !isRefreshing ? { } : {} ) }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e2939ff'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#243043ff'}
          >
            {isRefreshing ? "Actualizando..." : "Actualizar Tabla"}
          </button>
        </div>

        <div className="overflow-x-auto bg-white rounded-b-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre de Campaña
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enviados
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entregados
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leídos
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actualización
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCampaigns.map((c) => {
                const channelInfo = getChannelInfo(c.channel_type);
                const statusColor = getStatusColor(c.status);
                const formattedDate = c.updated_at ? new Date(c.updated_at).toLocaleString() : 'N/A';

                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100">
                          <span className="text-xl">{channelInfo.icon}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{c.name}</div>
                          <div className="text-sm text-gray-500">{channelInfo.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>{c.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">{c.enviados || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">{c.entregados || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">{c.leidos || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formattedDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <CampaignActionMenu 
                        campaign={c} 
                        onViewReport={(camp) => { setSelectedCampaign(camp); setReportOpen(true); }}
                        onCampaignDeleted={handleCampaignAction}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4 flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * rowsPerPage, filteredCampaigns.length)}</span> de <span className="font-medium">{filteredCampaigns.length}</span> resultados
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="p-1 border rounded-md">
                {[10, 25, 50].map(size => (
                  <option key={size} value={size}>Mostrar {size}</option>
                ))}
              </select>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 border rounded-md disabled:opacity-50">
                Anterior
              </button>
              <span className="text-sm">{currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 border rounded-md disabled:opacity-50">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
      <CampaignReportDrawer 
        open={reportOpen} 
        onClose={() => { setReportOpen(false); setSelectedCampaign(null); }} 
        campaign={selectedCampaign}
      />
    </>
  );
}
