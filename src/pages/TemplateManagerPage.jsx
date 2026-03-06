import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTemplates, createTemplate, getPendingTemplates } from '../services/api';
import TemplateList from '../components/TemplateList'; // Importar TemplateList
import TemplateActionMenu from '../components/TemplateActionMenu';
import TemplatePreviewModal from '../components/TemplatePreviewModal';

// --- Iconos ---
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657A8 8 0 018.343 7.343m9.314 9.314a8 8 0 01-9.314-9.314m0 0A8.003 8.003 0 002 8c0 4.418 3.582 8 8 8 1.26 0 2.45-.293 3.536-.813" /></svg>;
const SmsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

const StatusBadge = ({ status }) => {
  const statusInfo = {
    APPROVED: { text: 'Aprobada', style: 'bg-green-100 text-green-700' },
    PENDING_INTERNAL_APPROVAL: { text: 'Pendiente Aprobación', style: 'bg-yellow-100 text-yellow-700' },
    PENDING_OPERATIONS_APPROVAL: { text: 'Pendiente Operaciones', style: 'bg-yellow-100 text-yellow-700' },
    PENDING_META_APPROVAL: { text: 'Pendiente Meta', style: 'bg-orange-100 text-orange-700' },
    REJECTED_INTERNAL: { text: 'Rechazada', style: 'bg-red-100 text-red-700' },
    REJECTED_OPERATIONS: { text: 'Rechazada por Operaciones', style: 'bg-red-100 text-red-700' },
    REJECTED_META: { text: 'Rechazada Meta', style: 'bg-red-200 text-red-800' },
    REJECTED: { text: 'Rechazada', style: 'bg-red-100 text-red-700' },
    DRAFT: { text: 'Borrador', style: 'bg-blue-100 text-blue-700' },
  };

  const info = statusInfo[status] || { text: status || 'Desconocido', style: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${info.style}`}>
      {info.text}
    </span>
  );
};

const DuplicateTemplateModal = ({ template, onClose, onConfirm }) => {
  const [newName, setNewName] = useState(`Copia de ${template.name}`);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(newName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Duplicar Plantilla</h2>
        <p className="mb-4 text-sm text-gray-600">
          Se creará una nueva plantilla con el mismo contenido que <strong>{template.name}</strong>.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="new-template-name" className="block text-sm font-medium text-gray-700">
            Nuevo nombre de la plantilla
          </label>
          <input
            type="text"
            id="new-template-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Duplicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TemplateManagerPage = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [templateToDuplicate, setTemplateToDuplicate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null); // plantilla seleccionada para previsualizar
  const [activeChannel, setActiveChannel] = useState('WHATSAPP');
  const [activeStatus, setActiveStatus] = useState('ALL'); // Nuevo estado para el filtro de estado
  const [searchTerm, setSearchTerm] = useState(''); // Estado para búsqueda por nombre
  const [searchDate, setSearchDate] = useState(''); // Estado para búsqueda por fecha
  const [loading, setLoading] = useState(true);
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (activeStatus === 'PENDING') {
        data = await getPendingTemplates();
      } else {
        data = await getTemplates();
      }
      setTemplates(data);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, activeStatus]);

  useEffect(() => {
    // Filtramos primero por canal
    let filtered = templates.filter(t => t.channel_type === activeChannel);
    
    // Si hay un filtro de estado activo (diferente de "Todos"), aplicamos ese filtro
    if (activeStatus !== 'ALL') {
      if (activeStatus === 'PENDING') {
        filtered = filtered.filter(t => t.status.includes('PENDING'));
      } else if (activeStatus === 'REJECTED') {
        filtered = filtered.filter(t => t.status.includes('REJECTED'));
      } else {
        filtered = filtered.filter(t => t.status === activeStatus);
      }
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
    
    // Ordenamos por fecha de creación descendente
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
  setFilteredTemplates(filtered);
  // Reiniciar a primera página cuando cambien filtros o datos
  setCurrentPage(1);
  }, [activeChannel, activeStatus, searchTerm, searchDate, templates]);

  const getTabClasses = (channel) => {
    const base = "flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium transition-colors duration-200";
    if (channel === activeChannel) {
      return `${base} bg-white text-gray-800 shadow-sm rounded-lg`;
    }
    return `${base} text-gray-500 hover:bg-gray-200 rounded-lg`;
  };

  const getStatusFilterClasses = (status) => {
    const baseClasses = "flex-1 flex items-center justify-center py-2 px-5 rounded-lg text-sm font-medium transition-colors duration-200";
    if (activeStatus === status) {
      return `${baseClasses} bg-white text-gray-800 shadow-sm`;
    }
    return `${baseClasses} text-gray-500 hover:bg-gray-200`;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Plantillas</h1>
          <p className="text-gray-500">Administra plantillas de mensajes para todos los canales</p>
        </div>
        <Link to="/campaigns" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100">
          Volver a Campañas
        </Link>
      </div>

      <div className="bg-gray-100 p-1 rounded-xl flex gap-2 mb-6">
        <button onClick={() => setActiveChannel('WHATSAPP')} className={getTabClasses('WHATSAPP')}><WhatsAppIcon /> WhatsApp</button>
        <button onClick={() => setActiveChannel('SMS')} className={getTabClasses('SMS')}><SmsIcon /> SMS</button>
        <button onClick={() => setActiveChannel('EMAIL')} className={getTabClasses('EMAIL')}><EmailIcon /> Email</button>
      </div>

    <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Plantillas de {activeChannel.charAt(0) + activeChannel.slice(1).toLowerCase()}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {activeChannel === 'WHATSAPP' ? 'Plantillas que requieren aprobación de Meta' : `Plantillas para el canal ${activeChannel}`}
        </p>
      </div>
      <Link to="/templates/new" className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700">
        + Nueva Plantilla
      </Link>
    </div>

    {/* --- Filtro de Estado con nuevo diseño --- */}
    <div className="my-6 bg-gray-100 p-1 rounded-xl flex gap-1">
        <button onClick={() => setActiveStatus('ALL')} className={getStatusFilterClasses('ALL')}>Todos</button>
        <button onClick={() => setActiveStatus('APPROVED')} className={getStatusFilterClasses('APPROVED')}>Aprobadas</button>
        <button onClick={() => setActiveStatus('PENDING')} className={getStatusFilterClasses('PENDING')}>Pendientes</button>
        <button onClick={() => setActiveStatus('REJECTED')} className={getStatusFilterClasses('REJECTED')}>Rechazadas</button>
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
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
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

    <TemplateList 
      templates={filteredTemplates} 
      onTemplateUpdated={fetchTemplates} 
      statusFilter={activeStatus === 'REJECTED' ? 'REJECTED_INTERNAL' : activeStatus} 
      isApprovalView={false}
    />
    </div>

      {templateToDuplicate && (
        <DuplicateTemplateModal
          template={templateToDuplicate}
          onClose={() => setTemplateToDuplicate(null)}
          onConfirm={async (newName) => {
            const { content, channel_type, subject } = templateToDuplicate;
            const newTemplateData = { name: newName, content, channel_type, subject };
            try {
              await createTemplate(newTemplateData);
              setTemplateToDuplicate(null);
              fetchTemplates(); // Recargar la lista de plantillas
              alert("Plantilla duplicada con éxito.");
            } catch (error) {
              alert(`Error al duplicar la plantilla: ${error.message}`);
            }
          }}
        />
      )}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
};

export default TemplateManagerPage;
