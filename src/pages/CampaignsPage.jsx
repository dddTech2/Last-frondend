import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardMetrics from '../components/DashboardMetrics';
import CampaignsTable from '../components/CampaignsTable';
import UpdateContactsModal from '../components/UpdateContactsModal';
import CampaignHistoryFilters from '../components/CampaignHistoryFilters';
import CampaignHistoryTable from '../components/CampaignHistoryTable';
import * as api from '../services/api';

// --- Iconos para los filtros ---
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657A8 8 0 018.343 7.343m9.314 9.314a8 8 0 01-9.314-9.314m0 0A8.003 8.003 0 002 8c0 4.418 3.582 8 8 8 1.26 0 2.45-.293 3.536-.813" /></svg>;
const SmsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
// -------------------------

const CampaignsPage = () => {
  const [activeTab, setActiveTab] = useState('gestion'); // 'gestion' | 'reportes'
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isUpdateContactsModalOpen, setUpdateContactsModalOpen] = useState(false);

  // --- Estados para Historial/Reportes ---
  const [historyData, setHistoryData] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

  const fetchHistory = useCallback(async (filters = {}, page = 1) => {
    setHistoryLoading(true);
    try {
      const limit = 50;
      const skip = (page - 1) * limit;
      const response = await api.getCampaignHistory({ ...filters, skip, limit });
      setHistoryData(response.data);
      setHistoryPagination({
        page: response.page,
        pages: response.pages,
        total: response.total
      });
      setHasSearched(true);
    } catch (error) {
      toast.error('Error al cargar historial de campañas');
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Nota: Eliminado el useEffect que cargaba automáticamente al cambiar de tab.

  const handleHistoryFilterChange = (newFilters) => {
    setHistoryFilters(newFilters);
    setHistoryPagination(prev => ({ ...prev, page: 1 }));
    fetchHistory(newFilters, 1);
  };

  const handleHistoryPageChange = (newPage) => {
    fetchHistory(historyFilters, newPage);
  };

  const handleExportHistory = async (filters, email) => {
    try {
      toast.info('Iniciando exportación...');
      await api.exportCampaignHistory(filters, email);
      toast.success(`Exportación iniciada. El reporte llegará a ${email}`);
    } catch (error) {
      toast.error('Error al solicitar exportación');
      console.error(error);
    }
  };

  const getButtonClasses = (filterName) => {
    const baseClasses = "flex-1 flex items-center justify-center py-2 px-5 rounded-lg text-sm font-medium transition-colors duration-200";
    if (activeFilter === filterName) {
      return `${baseClasses} bg-white text-gray-800 shadow-sm`;
    }
    return `${baseClasses} text-gray-500 hover:bg-gray-200`;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Comunicaciones Masivas</h1>
          <p className="text-gray-500">Gestiona campañas de WhatsApp, SMS y Email desde una sola plataforma</p>
        </div>
        <div className="flex">
            <button
                onClick={() => setUpdateContactsModalOpen(true)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-100"
            >
                Actualizar Datos Contacto
            </button>
          <Link to="/templates" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-100">
            Gestionar Plantillas
          </Link>
          <Link to="/campaigns/new" className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700">
            + Crear Nueva Campaña
          </Link>
        </div>
      </div>

      {/* --- Tabs de Navegación Principal --- */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('gestion')}
            className={`${
              activeTab === 'gestion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Gestión de Campañas
          </button>
          <button
            onClick={() => setActiveTab('reportes')}
            className={`${
              activeTab === 'reportes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Historial y Reportes
          </button>
        </nav>
      </div>
      
      {activeTab === 'gestion' && (
        <>
          <DashboardMetrics />

          {/* --- Filtros --- */}
          <div className="my-6 bg-gray-100 p-1 rounded-xl flex gap-1">
            <button onClick={() => setActiveFilter('Todos')} className={getButtonClasses('Todos')}>
              Todos
            </button>
            <button onClick={() => setActiveFilter('WhatsApp')} className={getButtonClasses('WhatsApp')}>
              <WhatsAppIcon /> WhatsApp
            </button>
            <button onClick={() => setActiveFilter('SMS')} className={getButtonClasses('SMS')}>
              <SmsIcon /> SMS
            </button>
            <button onClick={() => setActiveFilter('Email')} className={getButtonClasses('Email')}>
              <EmailIcon /> Email
            </button>
          </div>

          {/* La tabla ahora se renderiza directamente aquí */}
          <CampaignsTable channelFilter={activeFilter} />
        </>
      )}

      {activeTab === 'reportes' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Historial Detallado</h2>
            <p className="text-sm text-gray-600">
              Consulta el estado individual de cada mensaje enviado y descarga reportes completos.
            </p>
          </div>
          <CampaignHistoryFilters 
            onFilterChange={handleHistoryFilterChange} 
            onExport={handleExportHistory}
            isLoading={historyLoading}
          />
          {!hasSearched ? (
            <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
              <div className="mx-auto h-16 w-16 text-gray-300 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Ingresa parámetros de búsqueda</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                Selecciona fechas, canal, o ingresa una cédula para consultar el historial de mensajes enviados.
              </p>
            </div>
          ) : (
            <CampaignHistoryTable 
              data={historyData}
              pagination={historyPagination}
              onPageChange={handleHistoryPageChange}
              isLoading={historyLoading}
            />
          )}
        </>
      )}

      <UpdateContactsModal
        isOpen={isUpdateContactsModalOpen}
        onClose={() => setUpdateContactsModalOpen(false)}
      />
    </div>
  );
};

export default CampaignsPage;

