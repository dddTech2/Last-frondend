import React, { useState, useEffect, useCallback } from 'react';
import { getTemplates, getPendingTemplates } from '../services/api';
import TemplateList from '../components/TemplateList';

const TemplateApprovalPage = () => {
  const [allTemplates, setAllTemplates] = useState([]);
  const [pendingTemplates, setPendingTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      // Obtenemos todas las plantillas y las pendientes en paralelo
      const [all, pending] = await Promise.all([
        getTemplates(),
        getPendingTemplates()
      ]);
      setAllTemplates(all);
      setPendingTemplates(pending);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Error al cargar las plantillas.');
      console.error('Error al cargar las plantillas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getFilteredTemplates = () => {
    let filtered = allTemplates;
    switch (statusFilter) {
      case 'ALL':
        filtered = allTemplates;
        break;
      case 'PENDING':
        filtered = pendingTemplates;
        break;
      case 'APPROVED':
        filtered = allTemplates.filter(t => t.status === 'APPROVED');
        break;
      case 'REJECTED':
        filtered = allTemplates.filter(t => t.status.includes('REJECTED'));
        break;
      default:
        filtered = allTemplates;
    }

    // Filtrar por término de búsqueda (nombre de plantilla)
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por fecha de creación
    if (searchDate) {
      filtered = filtered.filter(t => {
        if (!t.created_at) return false;
        // La fecha en `created_at` viene en UTC o Z, la convertimos a fecha local y comparamos
        const templateDate = new Date(t.created_at);
        // Formatear al formato YYYY-MM-DD local
        const year = templateDate.getFullYear();
        const month = String(templateDate.getMonth() + 1).padStart(2, '0');
        const day = String(templateDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        return formattedDate === searchDate;
      });
    }

    return filtered;
  };

  const getButtonClasses = (filterName) => {
    const baseClasses = "flex-1 flex items-center justify-center py-2 px-5 rounded-lg text-sm font-medium transition-colors duration-200";
    if (statusFilter === filterName) {
      return `${baseClasses} bg-white text-gray-800 shadow-sm`;
    }
    return `${baseClasses} text-gray-500 hover:bg-gray-200`;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Plantillas</h1>
        <p className="text-gray-500">Administra, revisa y aprueba las plantillas de comunicación del sistema.</p>
      </div>

      {/* Filtros de estado con nuevo diseño */}
      <div className="my-6 bg-gray-100 p-1 rounded-xl flex gap-1">
        <button onClick={() => setStatusFilter('ALL')} className={getButtonClasses('ALL')}>Todas</button>
        <button onClick={() => setStatusFilter('PENDING')} className={getButtonClasses('PENDING')}>Pendientes</button>
        <button onClick={() => setStatusFilter('APPROVED')} className={getButtonClasses('APPROVED')}>Aprobadas</button>
        <button onClick={() => setStatusFilter('REJECTED')} className={getButtonClasses('REJECTED')}>Rechazadas</button>
      </div>

      {/* --- Buscador --- */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search-name" className="block text-sm font-medium text-gray-700 mb-1">Buscar por nombre</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="search-name"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              placeholder="Ej. recordatorio_pago"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 md:max-w-xs">
          <label htmlFor="search-date" className="block text-sm font-medium text-gray-700 mb-1">Buscar por fecha de creación</label>
          <input
            type="date"
            id="search-date"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>
      </div>

      {loading && <p>Cargando plantillas...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <TemplateList 
          templates={getFilteredTemplates()} 
          onTemplateUpdated={fetchTemplates}
          statusFilter={statusFilter}
          isApprovalView={true}
        />
      )}
    </div>
  );
};

export default TemplateApprovalPage;
